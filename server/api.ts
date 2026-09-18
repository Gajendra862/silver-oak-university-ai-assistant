import express from 'express';
import { universityDataManager } from './university-crawler';
import { generateUniversityAnswer } from './gemini';
import { courseResolver } from './course-resolver';
import { DebugInfo } from '../src/types';

export const apiRouter = express.Router();

apiRouter.use(express.json());

apiRouter.post('/chat', async (req, res) => {
  const startTime = Date.now();
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Valid message is required' });
      return;
    }

    // Course Resolution Workflow
    const resolution = courseResolver.resolve(message);

    // Rule 14: If the short course name cannot be matched to an official Silver Oak University program:
    if (resolution.status === 'UNIDENTIFIED') {
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
    const { answer, sources, detectedLanguage } = await generateUniversityAnswer(
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
