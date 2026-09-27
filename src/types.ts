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
  suggestedPrompts?: string[];
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
  degreeType?: string;
  specialization?: string;
  colleges?: { id: number | string; name: string; abbreviation?: string }[];
  lastVerifiedAt?: string;
  status?: 'active' | 'inactive';
  sourceUrl?: string;
  isNew?: boolean;
}

export interface CollegeInfo {
  id: number | string;
  name: string;
  abbreviation: string;
  display_name: string;
  external_website_url?: string;
  status?: 'active' | 'inactive';
  programCount?: number;
  lastVerifiedAt?: string;
}

export interface ProgrammeFeeInfo {
  amount: string;
  period?: string;
  currency: string;
  rawText: string;
  sourceUrl?: string;
  lastVerifiedAt?: string;
}

export interface SynchronizedProgram {
  programId: string;
  officialName: string;
  degreeType: string;
  shortName?: string;
  aliases: string[];
  specialization?: string;
  colleges: {
    id: number | string;
    name: string;
    abbreviation?: string;
  }[];
  duration?: string;
  semesters?: string;
  fee?: ProgrammeFeeInfo;
  officialUrl: string;
  syllabusUrl?: string;
  brochureUrl?: string;
  admissionUrl?: string;
  eligibility?: string;
  admissionInfo?: string;
  sourceUrl: string;
  lastVerifiedAt: string;
  status: 'active' | 'inactive';
  isNew?: boolean;
}

export interface SynchronizedCollege {
  id: number | string;
  name: string;
  abbreviation: string;
  displayName: string;
  programCount: number;
  officialUrl?: string;
  lastVerifiedAt: string;
  status: 'active' | 'inactive';
}

export interface CatalogueMetadata {
  version: string;
  lastSyncAttempt: string;
  lastSuccessfulSync: string;
  syncStatus: 'idle' | 'syncing' | 'success' | 'failed';
  syncMessage: string;
  totalActivePrograms: number;
  totalColleges: number;
  changeLog?: {
    timestamp: string;
    addedPrograms: string[];
    removedPrograms: string[];
    updatedPrograms: string[];
    addedColleges: string[];
  }[];
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
  lastSuccessfulSync?: string;
  catalogueVersion?: string;
  syncStatus?: string;
  syncMessage?: string;
}
