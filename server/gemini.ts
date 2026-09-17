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

  const systemPrompt = `You are the official, highly accurate AI Assistant for Silver Oak University (SOU), Ahmedabad, Gujarat, India.
Your primary role is to answer questions about Silver Oak University admissions, courses, syllabus, examination timetables, circulars, fees, eligibility criteria, and campus facilities.

CRITICAL POLICY & RULES:
1. STRICT SOURCE GROUNDING: You MUST base your answers ONLY on the provided official Silver Oak University sources below. Do not guess or fabricate fees, exam dates, subject codes, or eligibility criteria.
2. MISSING INFORMATION POLICY: If the answer cannot be determined from the provided sources, answer honestly and courteously:
   - English: "I could not find this information on the official Silver Oak University website. Please visit the official portal at https://silveroakuni.ac.in or contact the admission helpline at +91 7966046300."
   - Hindi: "मुझे आधिकारिक सिल्वर ओक यूनिवर्सिटी की वेबसाइट पर यह जानकारी नहीं मिली। कृपया https://silveroakuni.ac.in देखें या हेल्पलाइन +91 7966046300 पर संपर्क करें।"
   - Gujarati: "મને સિલ્વર ઓક યુનિવર્સિટીની સત્તાવાર વેબસાઇટ પર આ માહિતી મળી નથી. કૃપા કરીને https://silveroakuni.ac.in તપાસો અથવા યુનિવર્સિટી હેલ્પલાઇન +91 7966046300 પર સંપર્ક કરો."
   - Hinglish: "Mujhe official Silver Oak University website par yeh information nahi mili. Aap official website https://silveroakuni.ac.in check kar sakte hain ya helpline +91 7966046300 par contact karein."
3. LANGUAGE MATCHING: Always respond in the EXACT language used by the user:
   - If asked in Gujarati -> Respond in fluent Gujarati.
   - If asked in Hindi (Devanagari) -> Respond in standard Hindi.
   - If asked in Hinglish (Roman script Hindi) -> Respond in natural Hinglish.
   - If asked in English -> Respond in clear, professional English.
4. CITATIONS & VERIFIABLE LINKS: Whenever citing information, provide the official source URL as markdown links (e.g. [Official Page](url) or [Exam Schedule PDF](url)).
5. PRESENTATION: Use clean Markdown tables for dates, subjects, fee breakdowns, or eligibility points.

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

        return {
          answer,
          sources,
          detectedLanguage
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

  return {
    answer: fallbackAnswer,
    sources,
    detectedLanguage
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

function detectLanguage(text: string): 'English' | 'Hindi' | 'Gujarati' | 'Hinglish' {
  if (/[\u0A80-\u0AFF]/.test(text)) return 'Gujarati';
  if (/[\u0900-\u097F]/.test(text)) return 'Hindi';

  const hinglishKeywords = /\b(kya|kaise|kitni|kitna|kab|hoga|hogi|fees|paisa|admission|milega|karna|chahiye|batao|hai|kaha|kaun|pariksha|bataiye|karvaun)\b/i;
  if (hinglishKeywords.test(text)) return 'Hinglish';

  return 'English';
}
