import { GoogleGenAI } from '@google/genai';
import { RetrievedDocument } from './university-crawler';
import { SourceCitation } from '../src/types';

let genAIClient: GoogleGenAI | null = null;

// Track model rate limits / quota cooldowns in-memory so exhausted models are skipped cleanly
const modelCooldowns: Record<string, number> = {};

function isModelCoolingDown(modelName: string): boolean {
  const cooldownUntil = modelCooldowns[modelName];
  if (!cooldownUntil) return false;
  if (Date.now() > cooldownUntil) {
    delete modelCooldowns[modelName];
    return false;
  }
  return true;
}

function setModelCooldown(modelName: string, durationMs: number = 60000) {
  modelCooldowns[modelName] = Date.now() + durationMs;
}

function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAIClient;
}

export interface ChatResponse {
  answer: string;
  sources: SourceCitation[];
  detectedLanguage: 'English' | 'Hindi' | 'Gujarati' | 'Hinglish';
  suggestedPrompts?: string[];
}

export async function generateUniversityAnswer(
  userMessage: string,
  retrievedDocs: RetrievedDocument[],
  history: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<ChatResponse> {
  const ai = getGenAI();

  // Detect query language style
  const detectedLanguage = detectLanguage(userMessage);

  // Build context string from retrieved official documents
  let contextBlock = '';
  if (retrievedDocs.length === 0) {
    contextBlock = 'NO OFFICIAL DOCUMENTS MATCHED THE QUERY ON THE SILVER OAK UNIVERSITY PORTAL.';
  } else {
    contextBlock = retrievedDocs.map((doc, idx) => `
[OFFICIAL SOURCE ${idx + 1}]
Title: ${doc.title}
URL: ${doc.url}
Type: ${doc.type}
Official Content:
${doc.content}
---`).join('\n');
  }

  const systemPrompt = `You are the official, highly accurate AI Assistant for Silver Oak University (SOU), Ahmedabad, Gujarat, India (silveroakuni.ac.in).
Your mission is to assist prospective students, current students, parents, and applicants with 100% accurate, officially grounded university information.

CRITICAL OFFICIAL DATA POLICIES & RULES:
1. STRICT SOURCE GROUNDING: You MUST base your answers ONLY on the provided official Silver Oak University sources below. Do not guess, speculate, or fabricate fees, exam dates, subject codes, college names, or eligibility criteria.
2. MISSING INFORMATION POLICY: If the requested information cannot be found in the provided official sources, strictly answer:
   "I could not find this information on the official university website."
   Never invent missing information or fabricate unverified details.
3. STRUCTURED PROGRAMME RESPONSE FORMAT: When answering about a specific academic programme or degree, use this clean structured format whenever official data is available:

   ### [PROGRAMME NAME]
   - **College:** [Official constituent college name, e.g., Silver Oak College of Computer Application]
   - **Level:** [Bachelor / Master / Diploma / Doctoral / Certificate]
   - **Duration:** [Official duration, e.g., 2 Years]
   - **Semesters:** [Official semesters, e.g., 4 Semesters]
   - **Eligibility:** [Official eligibility criteria]
   - **Fees:** [Official fee, e.g., ₹82,160 Per Annum]
   - **Specialization:** [If officially available]
   - **Syllabus / Curriculum:** [If official syllabus link or teaching scheme exists, provide markdown link]

   🔗 **Official Source:** [[Source Title]](Source URL)

   *Only display fields that are actually supported by official data. Never fabricate missing fields.*

4. NATURAL SINGLE-WORD OR ACRONYM QUERIES (e.g., "MCA", "BCA", "B.Tech", "MBA", "B.Pharm"):
   If the user enters only a programme name or abbreviation, DO NOT say "Please enter a complete question."
   Instead, provide an immediate, well-organized overview of that programme using the structure above, and guide them with:
   "You can ask me about eligibility, fees, admission process, syllabus, Summer 2026 exam timetables, or campus facilities."

5. CONTEXT AWARENESS FOR MULTI-TURN QUESTIONS:
   If the user asks follow-up questions (e.g. "fees?", "eligibility?", "syllabus?", "duration?", "who can apply?"), understand that they are referring to the programme discussed in the previous turn. Answer directly for that programme.

6. MULTILINGUAL SUPPORT: Always respond in the EXACT language of the user:
   - Gujarati -> Respond in polite, natural Gujarati.
   - Hindi (Devanagari) -> Respond in standard, respectful Hindi.
   - Hinglish (Roman script Hindi) -> Respond in natural Hinglish.
   - English -> Respond in clear, professional English.

7. VERIFIABLE LINKS: Always provide official links in markdown format (e.g., [Syllabus PDF](url) or [Official Portal](https://silveroakuni.ac.in)).

OFFICIAL SILVER OAK UNIVERSITY SOURCES:
${contextBlock}`;

  const conversationContents: any[] = [];

  // Add conversation history
  for (const h of history.slice(-4)) {
    conversationContents.push({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }]
    });
  }

  // Current query
  conversationContents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  const sources: SourceCitation[] = retrievedDocs.map(d => ({
    title: d.title,
    url: d.url,
    snippet: d.snippet,
    type: d.type
  }));

  // Robust model fallback chain: prioritize active models not in cooldown
  const allModels = [
    { name: 'gemini-3.1-flash-lite', retries: 2, delayMs: 400 },
    { name: 'gemini-3.8-flash', retries: 2, delayMs: 600 }
  ];

  // Prioritize models that are currently available and not cooling down
  const modelsToTry = [...allModels].sort((a, b) => {
    const aCooling = isModelCoolingDown(a.name) ? 1 : 0;
    const bCooling = isModelCoolingDown(b.name) ? 1 : 0;
    return aCooling - bCooling;
  });

  let lastError: any = null;

  for (const modelConfig of modelsToTry) {
    if (isModelCoolingDown(modelConfig.name)) {
      continue;
    }

    for (let attempt = 1; attempt <= modelConfig.retries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelConfig.name,
          contents: conversationContents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.2
          }
        });

        const answer = response.text || 'I could not retrieve an answer at this moment. Please check the official Silver Oak University portal.';
        const suggestedPrompts = generateSuggestedPrompts(userMessage, retrievedDocs, detectedLanguage);

        return {
          answer,
          sources,
          detectedLanguage,
          suggestedPrompts
        };
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        
        // If it's a quota / 429 error, place model in cooldown and switch models immediately
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded')) {
          console.warn(`[Gemini] Model ${modelConfig.name} quota limit reached. Placing in 60s cooldown.`);
          setModelCooldown(modelConfig.name, 60000);
          break;
        }

        console.warn(`[Gemini] Attempt ${attempt} with ${modelConfig.name} failed:`, errMsg);

        // For 503 or transient network errors, wait briefly before retrying
        await new Promise(r => setTimeout(r, modelConfig.delayMs * attempt));
      }
    }
  }

  console.warn('[Gemini] Model quota/demand limit reached on active models. Generating direct grounding answer from official records.');
  
  // Graceful fallback from official crawled university records so the user is NEVER left stranded
  const fallbackAnswer = synthesizeDirectGroundingAnswer(userMessage, retrievedDocs, detectedLanguage);
  const suggestedPrompts = generateSuggestedPrompts(userMessage, retrievedDocs, detectedLanguage);

  return {
    answer: fallbackAnswer,
    sources,
    detectedLanguage,
    suggestedPrompts
  };
}

function synthesizeDirectGroundingAnswer(
  _userMessage: string,
  retrievedDocs: RetrievedDocument[],
  detectedLanguage: 'English' | 'Hindi' | 'Gujarati' | 'Hinglish'
): string {
  if (!retrievedDocs || retrievedDocs.length === 0) {
    switch (detectedLanguage) {
      case 'Gujarati':
        return 'ક્ષમા કરશો, હાલમાં સર્વર પર વધુ ટ્રાફિક છે. સિલ્વર ઓક યુનિવર્સિટીની સત્તાવાર વેબસાઇટ https://silveroakuni.ac.in ની મુલાકાત લો અથવા હેલ્પલાઇન +91 7966046300 પર સંપર્ક કરો.';
      case 'Hindi':
        return 'क्षमा करें, इस समय सर्वर पर अत्यधिक लोड है। कृपया सिल्वर ओक यूनिवर्सिटी की आधिकारिक वेबसाइट https://silveroakuni.ac.in देखें या हेल्पलाइन +91 7966046300 पर संपर्क करें।';
      case 'Hinglish':
        return 'Server par temporary high demand hai. Aap official Silver Oak University portal https://silveroakuni.ac.in check kar sakte hain ya helpline +91 7966046300 par contact karein.';
      default:
        return 'The live AI service is currently experiencing temporary high demand. Please visit the official Silver Oak University portal at https://silveroakuni.ac.in or contact the university helpline at +91 7966046300.';
    }
  }

  let text = '';
  switch (detectedLanguage) {
    case 'Gujarati':
      text += '*(નોંધ: હાલમાં AI મોડેલ પર વધુ ટ્રાફિક હોવાથી સત્તાવાર યુનિવર્સિટી રેકોર્ડ્સ સીધા દર્શાવવામાં આવ્યા છે)*\n\n### સત્તાવાર સિલ્વર ઓક યુનિવર્સિટી માહિતી:\n\n';
      break;
    case 'Hindi':
      text += '*(सूचना: इस समय AI सेवा पर अत्यधिक लोड है, इसलिए आधिकारिक विश्वविद्यालय रिकॉर्ड सीधे दिखाए जा रहे हैं)*\n\n### आधिकारिक सिल्वर ओक यूनिवर्सिटी रिकॉर्ड:\n\n';
      break;
    case 'Hinglish':
      text += '*(Note: AI service par high demand ke kaaran official university records directly show kiye gaye hain)*\n\n### Official Silver Oak University Information:\n\n';
      break;
    default:
      text += '*(Note: Live AI service is experiencing high demand. Showing verified official university records directly)*\n\n### Official Silver Oak University Records:\n\n';
      break;
  }

  for (const doc of retrievedDocs.slice(0, 3)) {
    text += `#### ${doc.title}\n`;
    const cleanContent = doc.content.replace(/\n{3,}/g, '\n\n').trim();
    text += `${cleanContent.slice(0, 450)}${cleanContent.length > 450 ? '...' : ''}\n\n`;
    text += `🔗 **Official Source Link:** [${doc.title}](${doc.url})\n\n---\n\n`;
  }

  text += `📞 **Admission Helpline:** +91 7966046300 | 🌐 [silveroakuni.ac.in](https://silveroakuni.ac.in)`;
  return text;
}

function generateSuggestedPrompts(
  userMessage: string,
  retrievedDocs: RetrievedDocument[],
  detectedLanguage: 'English' | 'Hindi' | 'Gujarati' | 'Hinglish'
): string[] {
  const suggestions: string[] = [];
  const lowerMsg = userMessage.toLowerCase();

  const branchDoc = retrievedDocs.find(d => d.metadata?.branch);
  const branch = branchDoc?.metadata?.branch;

  if (branch) {
    const title = branch.title;
    if (!lowerMsg.includes('fee')) {
      suggestions.push(`What is the fee for ${title}?`);
    }
    if (!lowerMsg.includes('eligib')) {
      suggestions.push(`What is the eligibility for ${title}?`);
    }
    if (!lowerMsg.includes('syllab') && branch.teachingScheme) {
      suggestions.push(`Show syllabus and curriculum for ${title}`);
    }
    if (!lowerMsg.includes('admission') && !lowerMsg.includes('apply')) {
      suggestions.push(`Admission procedure for ${title}`);
    }
  } else if (lowerMsg.includes('exam') || lowerMsg.includes('timetable') || lowerMsg.includes('schedule')) {
    suggestions.push('How to check seating arrangement on SOU portal?');
    suggestions.push('What are the official examination rules?');
    suggestions.push('Summer 2026 B.Tech Exam Timetable');
  } else if (lowerMsg.includes('admission')) {
    suggestions.push('What documents are required for admission?');
    suggestions.push('What scholarships are offered at Silver Oak University?');
    suggestions.push('What is the helpline number and campus location?');
  } else if (lowerMsg.includes('college') || lowerMsg.includes('institute')) {
    suggestions.push('Which courses are available in SOCCA?');
    suggestions.push('Which college provides B.Tech?');
    suggestions.push('Show all programmes in College of Engineering & Technology');
  } else {
    suggestions.push('BCA Fees and Eligibility');
    suggestions.push('B.Tech Computer Engineering Fees');
    suggestions.push('Summer 2026 Exam Timetables');
    suggestions.push('List of all 17 Colleges at SOU');
  }

  return suggestions.slice(0, 3);
}

function detectLanguage(text: string): 'English' | 'Hindi' | 'Gujarati' | 'Hinglish' {
  if (/[\u0A80-\u0AFF]/.test(text)) return 'Gujarati';
  if (/[\u0900-\u097F]/.test(text)) return 'Hindi';

  const hinglishGrammarParticles = /\b(kya|kaise|kitni|kitna|kab|hoga|hogi|paisa|milega|karna|chahiye|batao|bataiye|hai|kaha|kaun|pariksha|karvaun|karein|hoti|hote)\b/i;
  if (hinglishGrammarParticles.test(text)) return 'Hinglish';

  return 'English';
}

