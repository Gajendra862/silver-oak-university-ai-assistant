export type MessageRole = 'user' | 'assistant' | 'system';

export interface SourceCitation {
  title: string;
  url: string;
  snippet?: string;
  type: 'web_page' | 'circular' | 'exam_timetable' | 'curriculum_pdf' | 'admission_guideline' | 'official_contact' | 'official_faculty_data' | 'faculty_document';
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

export interface FeeStructureItem {
  id: string;
  slug: string;
  title: string;
  collegeId: number;
  collegeName: string;
  collegeAbbr: string;
  degreeLevel: string;
  degreeType?: string;
  category: string;
  duration: string;
  semesters: string;
  eligibility: string;
  feeRaw: string;
  feeAmount: number;
  feeFormatted: string;
  feePeriod: string;
  sourceUrl: string;
  syllabusUrl?: string;
  lastVerifiedAt: string;
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

export interface FacultyMember {
  id: string;
  name: string;
  facultyId: string;
  email: string;
  department: string;
  designation: string;
  college: string;
  qualification: string;
  role: 'faculty' | 'admin';
  phone?: string;
  officeLocation?: string;
  officeHours?: string;
  avatarUrl?: string;
}

export interface TeachingAssignment {
  id: string;
  facultyId: string;
  facultyName: string;
  programme: string; // e.g. "BCA", "MCA", "B.Tech CSE"
  programmeSlug: string; // e.g. "bca"
  programmeTitle: string; // e.g. "Bachelor of Computer Applications"
  degreeType: string; // "Bachelor" | "Master" | "Diploma" | etc.
  college: string;
  department: string;
  duration: string; // e.g. "3 Years"
  totalSemesters: number; // e.g. 6
  semester: number; // e.g. 3
  subjectName: string; // e.g. "Database Management System"
  subjectCode: string; // e.g. "BCA301"
  lectureInfo?: string; // e.g. "Mon, Wed, Fri: 10:00 AM - 11:00 AM"
  description?: string;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
  documentsCount?: number;
}

export interface FacultyDocument {
  id: string;
  assignmentId: string;
  programme: string;
  semester: number;
  subjectName: string;
  subjectCode: string;
  facultyId: string;
  facultyName: string;
  fileName: string;
  fileTitle: string;
  fileType: 'pdf' | 'doc' | 'docx' | 'ppt' | 'pptx' | 'txt' | string;
  fileSize: number;
  fileUrl: string;
  description?: string;
  uploadedAt: string;
}

export interface FacultyAuthResponse {
  token: string;
  faculty: FacultyMember;
}

