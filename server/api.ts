import express from 'express';
import { universityDataManager } from './university-crawler';
import { generateUniversityAnswer } from './gemini';
import { courseResolver } from './course-resolver';
import { programmeSyncService } from './programme-sync';
import { facultyRouter } from './faculty-router';
import { DebugInfo } from '../src/types';

export const apiRouter = express.Router();

apiRouter.use(express.json());

// Mount Faculty Member & Dashboard routes
apiRouter.use('/faculty', facultyRouter);

apiRouter.post('/chat', async (req, res) => {
  const startTime = Date.now();
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Valid message is required' });
      return;
    }

    // Course Resolution Workflow
    let resolution = courseResolver.resolve(message);

    // Multi-turn context resolution:
    // If message is a follow-up query (e.g. "fees?", "what is the eligibility?", "syllabus?", "duration?", "who can apply?")
    // and hasn't explicitly resolved to a new course, check conversation history in reverse for the last discussed course
    const isFollowupQuery = /^(fees?|fee structure|eligibility|syllabus|duration|semesters?|admission|subjects?|colleges?|documents?|scholarships?|placements?|curriculum|teaching scheme|when is the exam\??)\??$/i.test(message.trim()) ||
      (/\b(fees?|fee|eligibility|syllabus|duration|admission|placements|curriculum)\b/i.test(message) && message.trim().split(/\s+/).length <= 5 && !resolution.primaryBranch);

    if ((resolution.status === 'NOT_A_COURSE_QUERY' || isFollowupQuery) && Array.isArray(history) && history.length > 0) {
      // Look back through history for previous course mention, preferring user messages first
      const messagesToCheck = [
        ...history.filter(h => h.role === 'user').reverse(),
        ...history.slice().reverse()
      ];

      for (const h of messagesToCheck) {
        const prevContent = h.content || '';
        const prevRes = courseResolver.resolve(prevContent);
        if (prevRes.status === 'RESOLVED' && prevRes.primaryBranch) {
          resolution = {
            ...prevRes,
            isCourseQuery: true,
            status: 'RESOLVED'
          };
          break;
        }
      }
    }

    // Rule: If an explicit unknown course acronym was queried that is not offered:
    const isFacultyQuery = /teach|teacher|faculty|professor|prof\b|dr\b|notes\b|lecture|padhate|adhyapak|shikshak/i.test(message);
    if (resolution.status === 'UNIDENTIFIED' && !isFacultyQuery) {
      const fallbackAnswer = 'I could not clearly identify the course from the official Silver Oak University information. Please provide the full course name.';
      res.json({
        answer: fallbackAnswer,
        sources: [
          {
            title: 'Silver Oak University - Programs Offered',
            url: 'https://silveroakuni.ac.in/program-offered',
            type: 'web_page',
            snippet: 'Official list of degree and diploma programmes offered at Silver Oak University.'
          }
        ],
        detectedLanguage: 'English',
        suggestedPrompts: [
          'What degree programmes are offered at Silver Oak University?',
          'B.Tech Engineering Courses & Fees',
          'BCA and MCA Programmes Overview'
        ],
        debugInfo: {
          query: message,
          expandedQueries: [message],
          retrievedDocsCount: 0,
          executionTimeMs: Date.now() - startTime,
          sourcesUsed: [],
          failedSources: []
        }
      });
      return;
    }

    // 1. Retrieve official documents using resolved course information
    const { docs, expandedQueries, failedSources } = await universityDataManager.retrieveRelevantDocs(message, resolution);

    // 2. Pass to Gemini
    const { answer, sources, detectedLanguage, suggestedPrompts } = await generateUniversityAnswer(
      message,
      docs,
      Array.isArray(history) ? history : []
    );

    const executionTimeMs = Date.now() - startTime;

    const debugInfo: DebugInfo = {
      query: message,
      expandedQueries,
      retrievedDocsCount: docs.length,
      executionTimeMs,
      sourcesUsed: docs.map(d => ({
        title: d.title,
        url: d.url,
        type: d.type
      })),
      failedSources
    };

    res.json({
      answer,
      sources,
      detectedLanguage,
      suggestedPrompts,
      debugInfo
    });
  } catch (error: any) {
    console.error('[API /chat] Error handling chat request:', error);
    res.json({
      answer: 'The live AI system is currently handling high query volume. Please refer to official Silver Oak University information at https://silveroakuni.ac.in or contact the university helpline directly at +91 7966046300 / info@silveroakuni.ac.in.',
      sources: [
        {
          title: 'Silver Oak University Official Website',
          url: 'https://silveroakuni.ac.in',
          type: 'official_contact',
          snippet: 'Official website, admission guidelines and helpline contact.'
        }
      ],
      detectedLanguage: 'English'
    });
  }
});

apiRouter.get('/status', (req, res) => {
  const stats = universityDataManager.getStats();
  res.json({
    status: 'online',
    ...stats,
    geminiModel: 'gemini-3.8-flash'
  });
});

apiRouter.get('/branches', (req, res) => {
  const branches = universityDataManager.getBranches();
  res.json(branches);
});

apiRouter.get('/colleges', (req, res) => {
  const colleges = universityDataManager.getColleges();
  res.json(colleges);
});

apiRouter.get('/fees', (req, res) => {
  try {
    const feeCatalogue = universityDataManager.getFeeCatalogue();
    res.json(feeCatalogue);
  } catch (err: any) {
    console.error('[API /fees] Error retrieving fee catalogue:', err);
    res.status(500).json({ error: 'Failed to retrieve fee structure data' });
  }
});

apiRouter.get('/catalogue', (req, res) => {
  res.json({
    metadata: programmeSyncService.getMetadata(),
    programs: programmeSyncService.getActivePrograms(),
    colleges: programmeSyncService.getActiveColleges(),
    degrees: programmeSyncService.getDynamicDegrees()
  });
});

apiRouter.post('/sync', async (req, res) => {
  try {
    const result = await programmeSyncService.syncFromOfficialWebsite(true);
    res.json({
      success: result.success,
      message: result.message,
      metadata: result.metadata,
      programsCount: result.programsCount,
      collegesCount: result.collegesCount
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
      metadata: programmeSyncService.getMetadata()
    });
  }
});
