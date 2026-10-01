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
1. STRICT SOURCE GROUNDING: You MUST base your answers ONLY on the provided official Silver Oak University sources below. The provided sources include:
   - Official University Web Portal data (programmes, degrees, fees, eligibility, constituent colleges, syllabus schemes, exam schedules)
   - Authorized Silver Oak University Faculty Dashboard & Academic Teaching Records (official faculty profiles, teaching assignments, subjects taught, semester assignments, lecture schedules, and uploaded study material/notes)
   Both are authorized, official Silver Oak University data. Do not guess, speculate, or fabricate unlisted fees, exam dates, subject codes, or eligibility criteria.
2. MISSING INFORMATION POLICY: If the requested information cannot be found anywhere in the provided official sources (neither university website nor faculty dashboard records), strictly answer:
   "I could not find this information on the official university website."
   Never invent missing information or fabricate unverified details.
   HOWEVER, whenever faculty teaching records, professors, subjects, or study materials ARE present in the provided sources, you MUST provide them directly and accurately! Do NOT claim faculty records are missing when they are in the provided sources!
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

8. SILVER OAK UNIVERSITY OVERVIEW (MANDATORY RULE when user queries "Silver Oak University", "SOU", "Silver Oak", or asks for university overview):
   Understand that the user wants a complete official university overview.
   Present a comprehensive, beautifully structured overview covering:
   - **University Introduction:** Premier state private university established under Gujarat Private Universities Act 2019, UGC recognized under Section 22, AICTE approved, NAAC accredited, located on S.G. Highway, Gota, Ahmedabad, Gujarat.
   - **Academic Programs:** 120+ career-oriented programmes across Engineering, IT & Computer Applications, Management, Commerce, Science, Pharmacy, Physiotherapy, Nursing, Design, Law, Aviation, and Vocational streams.
   - **Colleges & Institutes:** 17 constituent colleges (SOCCA, SOCET/COET, SOIM, SOIS, COP, SOCP, SOCN, SOLC, SOCC, SOCAM, SOCHSS, SOILPS, SOCAHC, SOCVE, SOID, SOIBM, SOCAT).
   - **Admissions & Eligibility:** Merit-based admission, online application via admission portal, helpline: +91 7966046300 / admission@silveroakuni.ac.in.
   - **Fee Information:** Transparent annual tuition fees per discipline; accepted government scholarships include MYSY (Mukhyamantri Yuva Swavalamban Yojana) and Digital Gujarat.
   - **Examination & Student Services:** Structured semester evaluations, online Summer/Winter timetables, internal assessments, and student portal.
   - **Placements & Internships:** Strong industry collaborations, Training & Placement Cell, pre-placement training, and top recruiters (TCS, Infosys, Wipro, Capgemini, Reliance, etc.).
   - **Campus Facilities:** 25+ acre modern campus, Wi-Fi, Apple iOS Lab, advanced computing labs, central library, hostel & mess, sports grounds, cafeteria, and university transport across Ahmedabad and Gandhinagar.
   - **Official Contact & Important Links:** [Official Website](https://silveroakuni.ac.in) | [Programs Offered](https://silveroakuni.ac.in/program-offered) | [Admission Portal](https://admission.silveroakuni.ac.in).

   CRITICAL: Do NOT ask an unnecessary follow-up question.
   Conclude your response with the following quick links:
   [🎓 Explore Courses] [💰 Fee Structure] [📝 Admissions] [📚 Syllabus] [📅 Exams] [📢 Notices] [🏫 Colleges] [💼 Placements]

9. CAMPUS & HOSTEL FACILITIES POLICY (CRITICAL):
   - When asked about hostels, accommodation, rooms, boys/girls living facilities, mess, Wi-Fi, campus, library, sports, laboratories, or transportation:
     * Base your answer strictly on official Silver Oak University information.
     * Confirm that separate hostel facilities are provided for boys and girls: Girls' Hostel is located securely within the main campus perimeter; Boys' Hostel accommodations are located in close proximity to campus.
     * Highlight verified amenities: furnished rooms (AC and Non-AC options), 24x7 Wi-Fi, 24x7 CCTV surveillance, resident wardens and security, in-house mess facility offering nutritious meals (breakfast, lunch, evening snacks, dinner), RO drinking water, power backup, daily cleaning, and indoor recreation.
     * Highlight campus facilities: 25+ acre campus on S.G. Highway, Central Library, PARAM Shavak Supercomputing Center, Apple iOS Lab, AI/Robotics labs, sports complex & gym, cafeteria, healthcare, and university bus routes across Ahmedabad and Gandhinagar.
   - HOSTEL FEE POLICY:
     * If asked about hostel fees: State clearly that the official university website confirms the availability of comprehensive hostel and mess facilities for boys and girls, but does NOT currently publish the specific hostel fee amount online. Direct the user to the University Hostel Administration or Admission Helpline at +91 7966046300 / info@silveroakuni.ac.in for the official current hostel fee quote and room allotment procedure.
     * NEVER invent or guess hostel prices, room rent, or deposit amounts.

10. FACULTY & TEACHING INFORMATION POLICY (CRITICAL - USER REQUIREMENTS PARTS 4 TO 19):
   - Two trusted sources: Official University Data for general courses/fees, and Authorized Faculty Dashboard Data for teaching assignments, professors, and lecture documents.
   - STRICT PROGRAMME-SPECIFIC ANSWERS: If a student asks about a particular programme (e.g. "Who teaches DBMS in BCA?"), return ONLY information belonging to that programme (e.g., Dr. Satish Sharma and Prof. Neha Patel in SOCCA). DO NOT return MCA faculty, MBA faculty, or B.Tech faculty when BCA was asked.
   - PROGRAMME + SEMESTER + SUBJECT FILTER: If a student asks e.g. "Who teaches DBMS in BCA Semester 3?", filter strictly: Programme = BCA, Semester = 3, Subject = DBMS.
   - AMBIGUOUS QUESTIONS: If a student asks "Who teaches DBMS?" without specifying a programme, and the subject exists in multiple programmes, DO NOT guess or pick randomly. Clearly ask:
     "Which programme do you mean?
     - BCA
     - MCA
     - B.Tech CSE"
   - MULTIPLE FACULTY MEMBERS: If multiple faculty members teach a subject (e.g. Dr. Satish Sharma and Prof. Neha Patel for BCA Sem 3 DBMS), present all authorized instructors clearly with their respective designations, lecture schedules, and lab instructions.
   - FACULTY PROFILE & SEARCH: When asked "Who is Dr. Satish Sharma?" or "Which subjects does Dr. ABC teach?", provide their official profile, designation, college, and list their teaching assignments clearly separated by programme.
   - FACULTY ACADEMIC DOCUMENTS: When a student asks for notes or study materials (e.g. "Give me BCA semester 3 DBMS notes" or "Show BCA DBMS PDF"), structure the response clearly:
     - Programme: [Programme Name]
     - Semester: [Semester Number]
     - Subject: [Subject Name]
     - Faculty: [Faculty Name]
     📄 Faculty Resource:
     [View / Open File Title](actual_download_url)
     NEVER invent or create fake PDF links. ONLY provide the exact URL present in the official faculty source.
   - NO INVENTED INFORMATION: If no matching faculty record exists for the requested programme, strictly respond:
     "I could not find this faculty information for the requested programme in the available university/faculty data."
     Never guess, fabricate, or substitute other programmes.

11. STRICT PROGRAMME-SPECIFIC ANSWERS (NO UNRELATED PROGRAMMES / NO KEYWORD BLEED):
   - When a student asks about a specific programme or course (e.g., "What is fee of MSc IT?", "BCA fees", "MCA eligibility", "MBA duration", "B.Tech Mechanical"):
     * Answer ONLY about the exact requested programme.
     * NEVER include, list, or mention unrelated programmes, even if they share keywords (e.g., when asked about MSc IT, NEVER mention Information Technology Diploma, BCA, B.Tech IT, B.Voc IT, or B.Sc CS/IT).
     * Even if unrelated sources are present in the context, strictly ignore them and answer ONLY for the requested programme.

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
  const lowerMsg = userMessage.toLowerCase().trim();

  // Requirement #3: Silver Oak University Overview exact prompts
  const isOverview = /^(?:silver\s*oak(?:\s*university)?|sou|about\s*sou|about\s*silver\s*oak(?:\s*university)?|university\s*overview)$/i.test(lowerMsg) ||
    (/silver\s*oak\s*university/i.test(lowerMsg) && (lowerMsg.includes('overview') || lowerMsg.includes('about') || lowerMsg.split(/\s+/).length <= 4));

  if (isOverview) {
    return [
      '🎓 Explore Courses',
      '💰 Fee Structure',
      '📝 Admissions',
      '📚 Syllabus',
      '📅 Exams',
      '📢 Notices',
      '🏫 Colleges',
      '💼 Placements'
    ];
  }

  const suggestions: string[] = [];
  const branchDoc = retrievedDocs.find(d => d.metadata?.branch);
  const branch = branchDoc?.metadata?.branch;

  if (branch) {
    let title = branch.title;
    if (branch.credential && !title.toLowerCase().includes(branch.credential.toLowerCase())) {
      title = `${branch.credential} ${title}`;
    }
    if (branch.slug === 'msc-it' || branch.slug === 'msc-it-2year') {
      title = 'M.Sc. IT';
    }
    if (!lowerMsg.includes('fee')) {
      suggestions.push(`What is the official fee for ${title}?`);
    } else {
      suggestions.push('💰 Open SOU Fee Structure Explorer');
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
  } else if (lowerMsg.includes('fee') || lowerMsg.includes('fees') || lowerMsg.includes('ફી') || lowerMsg.includes('फीस')) {
    suggestions.push('💰 Open SOU Fee Structure Explorer');
    suggestions.push('What government scholarships are accepted at SOU (MYSY)?');
    suggestions.push('B.Tech Engineering Fees & Seat Matrix');
    suggestions.push('BCA & MCA Official Tuition Fees');
  } else if (lowerMsg.includes('exam') || lowerMsg.includes('timetable') || lowerMsg.includes('schedule')) {
    suggestions.push('How to check seating arrangement on SOU portal?');
    suggestions.push('What are the official examination rules?');
    suggestions.push('Summer 2026 B.Tech Exam Timetable');
  } else if (lowerMsg.includes('admission')) {
    suggestions.push('What documents are required for admission?');
    suggestions.push('💰 SOU Fee Structure & Payment Guidelines');
    suggestions.push('What is the helpline number and campus location?');
  } else if (lowerMsg.includes('college') || lowerMsg.includes('institute')) {
    suggestions.push('Which courses are available in SOCCA?');
    suggestions.push('💰 Fees for Silver Oak College of Computer Application');
    suggestions.push('Show all programmes in College of Engineering & Technology');
  } else {
    suggestions.push('💰 Fee Structure');
    suggestions.push('BCA Fees and Eligibility');
    suggestions.push('B.Tech Computer Engineering Fees');
    suggestions.push('Summer 2026 Exam Timetables');
    suggestions.push('List of all 17 Colleges at SOU');
  }

  return suggestions.slice(0, 4);
}

function detectLanguage(text: string): 'English' | 'Hindi' | 'Gujarati' | 'Hinglish' {
  if (/[\u0A80-\u0AFF]/.test(text)) return 'Gujarati';
  if (/[\u0900-\u097F]/.test(text)) return 'Hindi';

  // Romanized Gujarati particles (e.g. "mca ni fee ketli che?", "su fee chhe", "dakhila mate su joiye?")
  const gujaratiRomanParticles = /\b(ketli|ketla|ketlo|che|chhe|su|joiye|kyare|aave|mate|kare|nathi|laikata|dakhila)\b/i;
  if (gujaratiRomanParticles.test(text) && /\b(che|chhe|ketli|ketla|su|joiye|kyare|mate)\b/i.test(text)) {
    return 'Gujarati';
  }

  const hinglishGrammarParticles = /\b(kya|kaise|kitni|kitna|kab|hoga|hogi|paisa|milega|karna|chahiye|batao|bataiye|hai|kaha|kaun|pariksha|karvaun|karein|hoti|hote)\b/i;
  if (hinglishGrammarParticles.test(text)) return 'Hinglish';

  return 'English';
}

