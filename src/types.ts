export type MessageRole = 'user' | 'assistant' | 'system';

export interface SourceCitation {
  title: string;
  url: string;
  snippet?: string;
  type: 'web_page' | 'circular' | 'exam_timetable' | 'curriculum_pdf' | 'admission_guideline' | 'official_contact';
  dateOrVersion?: string;
}

export interface DebugInfo {
  query: string;
  expandedQueries: string[];
  retrievedDocsCount: number;
  executionTimeMs: number;
  sourcesUsed: {
    title: string;
    url: string;
    type: string;
  }[];
  failedSources?: string[];
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string | number;
  sources?: SourceCitation[];
  detectedLanguage?: 'English' | 'Hindi' | 'Gujarati' | 'Hinglish';
  debugInfo?: DebugInfo;
  isStreaming?: boolean;
}

export interface UniversityBranch {
  slug: string;
  url: string;
  title: string;
  description: string;
  eligibility: string;
  fees: string;
  duration: string;
  semesters: string;
  teachingScheme?: string;
  credential?: string;
  college_id?: number | string;
  lastCrawled?: string;
}

export interface CollegeInfo {
  id: number;
  name: string;
  abbreviation: string;
  display_name: string;
  external_website_url?: string;
}

export interface ExamScheduleItem {
  title: string;
  url: string;
  session: string;
  examType: string;
  content: string;
}

export interface SystemStatus {
  status: 'online' | 'degraded' | 'offline';
  branchesCount: number;
  collegesCount: number;
  examSchedulesCount: number;
  circularsCount: number;
  lastUpdated: string;
  geminiModel: string;
}
