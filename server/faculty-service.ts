import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { FacultyMember, TeachingAssignment, FacultyDocument } from '../src/types';

interface FacultyUserRecord extends FacultyMember {
  passwordHash: string;
  salt: string;
}

interface FacultyDatabase {
  faculty: FacultyUserRecord[];
  assignments: TeachingAssignment[];
  documents: FacultyDocument[];
}

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const DATA_FILE = path.join(DATA_DIR, 'faculty-data.json');
export const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'documents');

// In-memory token store for sessions
const activeSessions = new Map<string, { facultyId: string; expiresAt: number }>();

function hashPassword(password: string, salt: string): string {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

export class FacultyService {
  private data: FacultyDatabase = {
    faculty: [],
    assignments: [],
    documents: []
  };

  constructor() {
    this.ensureDirectories();
    this.loadData();
  }

  private ensureDirectories() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  private loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        console.log(`[FacultyService] Loaded ${this.data.faculty.length} faculty, ${this.data.assignments.length} assignments, ${this.data.documents.length} documents.`);
      } else {
        this.seedInitialData();
        this.saveData();
      }
    } catch (err) {
      console.error('[FacultyService] Error loading faculty data, initializing fresh:', err);
      this.seedInitialData();
      this.saveData();
    }
  }

  public saveData() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[FacultyService] Error writing faculty data:', err);
    }
  }

  private seedInitialData() {
    const salt1 = crypto.randomBytes(16).toString('hex');
    const salt2 = crypto.randomBytes(16).toString('hex');
    const salt3 = crypto.randomBytes(16).toString('hex');

    const defaultPassword = 'faculty@sou2026';

    // 1. Dr. ABC (Dr. Satish Sharma) - Demonstrates multi-programme assignment (BCA, MCA, B.Tech CSE)
    const faculty1: FacultyUserRecord = {
      id: 'fac-101',
      name: 'Dr. Satish Sharma',
      facultyId: 'SOU-SOCCA-001',
      email: 'satish.sharma@silveroakuni.ac.in',
      department: 'Computer Applications',
      designation: 'Professor & Head of Department',
      college: 'Silver Oak College of Computer Application (SOCCA)',
      qualification: 'Ph.D. in Computer Science, M.Tech (CSE), B.E. (IT)',
      role: 'faculty',
      phone: '+91 7966046301',
      officeLocation: 'Academic Block A, 3rd Floor, Room 302',
      officeHours: 'Monday - Friday: 2:00 PM - 4:00 PM',
      salt: salt1,
      passwordHash: hashPassword(defaultPassword, salt1)
    };

    // 2. Prof. Neha Patel - Demonstrates multiple faculty for same subject (BCA Sem 3 DBMS)
    const faculty2: FacultyUserRecord = {
      id: 'fac-102',
      name: 'Prof. Neha Patel',
      facultyId: 'SOU-SOCCA-014',
      email: 'neha.patel@silveroakuni.ac.in',
      department: 'Computer Applications',
      designation: 'Associate Professor',
      college: 'Silver Oak College of Computer Application (SOCCA)',
      qualification: 'M.Tech in Computer Engineering, B.Tech (CSE)',
      role: 'faculty',
      phone: '+91 7966046302',
      officeLocation: 'Academic Block A, 2nd Floor, Room 215',
      officeHours: 'Tuesday & Thursday: 11:00 AM - 1:00 PM',
      salt: salt2,
      passwordHash: hashPassword(defaultPassword, salt2)
    };

    // 3. Dr. Rajesh Verma - Demonstrates Management programmes (MBA & BBA)
    const faculty3: FacultyUserRecord = {
      id: 'fac-103',
      name: 'Dr. Rajesh Verma',
      facultyId: 'SOU-SOIM-008',
      email: 'rajesh.verma@silveroakuni.ac.in',
      department: 'Management Studies',
      designation: 'Professor & Dean',
      college: 'Silver Oak Institute of Management (SOIM)',
      qualification: 'Ph.D. in Management, MBA (Finance & Marketing), UGC-NET',
      role: 'faculty',
      phone: '+91 7966046303',
      officeLocation: 'Management Block M, 1st Floor, Room 104',
      officeHours: 'Monday & Wednesday: 3:00 PM - 5:00 PM',
      salt: salt3,
      passwordHash: hashPassword(defaultPassword, salt3)
    };

    this.data.faculty = [faculty1, faculty2, faculty3];

    // Seed teaching assignments according to user specifications:
    // Teaching Assignment 1: Dr. Satish Sharma -> BCA, Sem 3, DBMS
    const assign1: TeachingAssignment = {
      id: 'assign-bca-sem3-dbms-1',
      facultyId: faculty1.id,
      facultyName: faculty1.name,
      programme: 'BCA',
      programmeSlug: 'bca',
      programmeTitle: 'Bachelor of Computer Applications',
      degreeType: 'Bachelor',
      college: 'Silver Oak College of Computer Application (SOCCA)',
      department: 'Computer Applications',
      duration: '3 Years',
      totalSemesters: 6,
      semester: 3,
      subjectName: 'Database Management System',
      subjectCode: 'BCA301',
      lectureInfo: 'Monday, Wednesday, Friday: 10:00 AM - 11:00 AM (Room 304, Lab 2)',
      description: 'Relational database concepts, SQL queries, ER modeling, relational algebra, normalization, and ACID properties.',
      instructions: '75% mandatory attendance in practical lab sessions. Unit 1 assignment submission due before midterm examinations.',
      createdAt: '2026-09-01T09:00:00.000Z',
      updatedAt: '2026-09-28T14:30:00.000Z',
      documentsCount: 1
    };

    // Teaching Assignment 2: Dr. Satish Sharma -> MCA, Sem 1, Advanced Programming
    const assign2: TeachingAssignment = {
      id: 'assign-mca-sem1-advprog-1',
      facultyId: faculty1.id,
      facultyName: faculty1.name,
      programme: 'MCA',
      programmeSlug: 'mca',
      programmeTitle: 'Master of Computer Application',
      degreeType: 'Master',
      college: 'Silver Oak College of Computer Application (SOCCA)',
      department: 'Computer Applications',
      duration: '2 Years',
      totalSemesters: 4,
      semester: 1,
      subjectName: 'Advanced Programming',
      subjectCode: 'MCA102',
      lectureInfo: 'Tuesday & Thursday: 11:30 AM - 1:00 PM (Lab 4)',
      description: 'Object-oriented software design, generic data structures, multi-threading, stream API and modern design patterns.',
      instructions: 'Individual mini-project code submission on Git repository required before end-semester evaluation.',
      createdAt: '2026-09-01T09:00:00.000Z',
      updatedAt: '2026-09-28T14:30:00.000Z',
      documentsCount: 1
    };

    // Teaching Assignment 3: Dr. Satish Sharma -> B.Tech CSE, Sem 5, Artificial Intelligence
    const assign3: TeachingAssignment = {
      id: 'assign-btech-sem5-ai-1',
      facultyId: faculty1.id,
      facultyName: faculty1.name,
      programme: 'B.Tech CSE',
      programmeSlug: 'computer-science-engineering',
      programmeTitle: 'B.Tech in Computer Science and Engineering',
      degreeType: 'Bachelor',
      college: 'Silver Oak College of Engineering & Technology (SOCET)',
      department: 'Computer Engineering',
      duration: '4 Years',
      totalSemesters: 8,
      semester: 5,
      subjectName: 'Artificial Intelligence',
      subjectCode: 'CE504',
      lectureInfo: 'Monday & Thursday: 2:00 PM - 3:30 PM (Auditorium 2)',
      description: 'Heuristic search algorithms, knowledge representation, propositional logic, expert systems, and introductory neural networks.',
      instructions: 'Practical assignments on Python A* search and minimax algorithm due in week 8.',
      createdAt: '2026-09-01T09:00:00.000Z',
      updatedAt: '2026-09-28T14:30:00.000Z',
      documentsCount: 1
    };

    // Teaching Assignment 4: Prof. Neha Patel -> BCA, Sem 3, Database Management System (Second Faculty)
    const assign4: TeachingAssignment = {
      id: 'assign-bca-sem3-dbms-2',
      facultyId: faculty2.id,
      facultyName: faculty2.name,
      programme: 'BCA',
      programmeSlug: 'bca',
      programmeTitle: 'Bachelor of Computer Applications',
      degreeType: 'Bachelor',
      college: 'Silver Oak College of Computer Application (SOCCA)',
      department: 'Computer Applications',
      duration: '3 Years',
      totalSemesters: 6,
      semester: 3,
      subjectName: 'Database Management System',
      subjectCode: 'BCA301',
      lectureInfo: 'Tuesday & Thursday: 10:00 AM - 11:30 AM (Division B, Lab 3)',
      description: 'Hands-on practical SQL database querying, normalization, schema design, and MySQL/PostgreSQL administration.',
      instructions: 'Submit weekly lab workbooks during lab hours.',
      createdAt: '2026-09-02T10:00:00.000Z',
      updatedAt: '2026-09-28T15:00:00.000Z',
      documentsCount: 0
    };

    // Teaching Assignment 5: Prof. Neha Patel -> BCA, Sem 4, Web Technologies
    const assign5: TeachingAssignment = {
      id: 'assign-bca-sem4-web-1',
      facultyId: faculty2.id,
      facultyName: faculty2.name,
      programme: 'BCA',
      programmeSlug: 'bca',
      programmeTitle: 'Bachelor of Computer Applications',
      degreeType: 'Bachelor',
      college: 'Silver Oak College of Computer Application (SOCCA)',
      department: 'Computer Applications',
      duration: '3 Years',
      totalSemesters: 6,
      semester: 4,
      subjectName: 'Web Technologies',
      subjectCode: 'BCA402',
      lectureInfo: 'Monday & Wednesday: 1:30 PM - 3:00 PM (Lab 1)',
      description: 'Modern frontend development, responsive web design, DOM manipulation, RESTful API integration, and asynchronous JavaScript.',
      instructions: 'Weekly web project demonstrations required.',
      createdAt: '2026-09-02T10:00:00.000Z',
      updatedAt: '2026-09-28T15:00:00.000Z',
      documentsCount: 0
    };

    // Teaching Assignment 6: Dr. Rajesh Verma -> MBA, Sem 2, Financial Management
    const assign6: TeachingAssignment = {
      id: 'assign-mba-sem2-finance-1',
      facultyId: faculty3.id,
      facultyName: faculty3.name,
      programme: 'MBA',
      programmeSlug: 'master-of-business-administration',
      programmeTitle: 'Master of Business Administration',
      degreeType: 'Master',
      college: 'Silver Oak Institute of Management (SOIM)',
      department: 'Management Studies',
      duration: '2 Years',
      totalSemesters: 4,
      semester: 2,
      subjectName: 'Financial Management',
      subjectCode: 'MBA201',
      lectureInfo: 'Wednesday & Friday: 9:00 AM - 10:30 AM (Room 102)',
      description: 'Corporate finance principles, capital budgeting, working capital management, cost of capital, and dividend decisions.',
      instructions: 'Case study analysis required for each module.',
      createdAt: '2026-09-03T11:00:00.000Z',
      updatedAt: '2026-09-28T16:00:00.000Z',
      documentsCount: 1
    };

    // Teaching Assignment 7: Dr. Satish Sharma -> MCA, Sem 2, Database Management System
    const assign7: TeachingAssignment = {
      id: 'assign-mca-sem2-dbms-1',
      facultyId: faculty1.id,
      facultyName: faculty1.name,
      programme: 'MCA',
      programmeSlug: 'mca',
      programmeTitle: 'Master of Computer Application',
      degreeType: 'Master',
      college: 'Silver Oak College of Computer Application (SOCCA)',
      department: 'Computer Applications',
      duration: '2 Years',
      totalSemesters: 4,
      semester: 2,
      subjectName: 'Database Management System',
      subjectCode: 'MCA201',
      lectureInfo: 'Tuesday & Thursday: 11:30 AM - 1:00 PM (SOCCA Lab 2)',
      description: 'Advanced database architecture, transaction concurrency control, query optimization, indexing, and NoSQL fundamentals.',
      instructions: 'Submit lab workbook and transaction concurrency assignment before midterms.',
      createdAt: '2026-09-02T09:00:00.000Z',
      updatedAt: '2026-09-28T14:30:00.000Z',
      documentsCount: 1
    };

    this.data.assignments = [assign1, assign2, assign3, assign4, assign5, assign6, assign7];

    // Seed real academic PDF documents associated strictly with Faculty + Programme + Semester + Subject:
    const doc1Path = path.join(UPLOADS_DIR, 'BCA_Sem3_DBMS_Unit1_Relational_Model_Notes.pdf');
    if (!fs.existsSync(doc1Path)) {
      fs.writeFileSync(doc1Path, '%PDF-1.4\n% Silver Oak University Official Lecture Notes\n% Course: BCA Semester 3 - Database Management System (BCA301)\n% Faculty: Dr. Satish Sharma\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 170 >>\nstream\nBT\n/F1 14 Tf\n50 720 Td\n(Silver Oak University - SOCCA) Tj\n0 -25 Td\n(BCA Semester 3: Database Management System Notes) Tj\n0 -20 Td\n(Faculty: Dr. Satish Sharma - Unit 1: Relational Data Model & SQL) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000095 00000 n \n0000000144 00000 n \n0000000201 00000 n \n0000000282 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n505\n%%EOF', 'utf-8');
    }

    const doc2Path = path.join(UPLOADS_DIR, 'MCA_Sem1_Advanced_Programming_Syllabus_Guide.pdf');
    if (!fs.existsSync(doc2Path)) {
      fs.writeFileSync(doc2Path, '%PDF-1.4\n% Silver Oak University Official Lecture Notes\n% Course: MCA Semester 1 - Advanced Programming (MCA102)\n% Faculty: Dr. Satish Sharma\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 160 >>\nstream\nBT\n/F1 14 Tf\n50 720 Td\n(Silver Oak University - MCA Department) Tj\n0 -25 Td\n(MCA Semester 1: Advanced Programming Guide) Tj\n0 -20 Td\n(Faculty: Dr. Satish Sharma) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000095 00000 n \n0000000144 00000 n \n0000000201 00000 n \n0000000282 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n495\n%%EOF', 'utf-8');
    }

    const doc3Path = path.join(UPLOADS_DIR, 'MCA_Sem2_DBMS_Unit2_Advanced_SQL_and_Transactions_Notes.pdf');
    if (!fs.existsSync(doc3Path)) {
      fs.writeFileSync(doc3Path, '%PDF-1.4\n% Silver Oak University Official Lecture Notes\n% Course: MCA Semester 2 - Database Management System (MCA201)\n% Faculty: Dr. Satish Sharma\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 190 >>\nstream\nBT\n/F1 14 Tf\n50 720 Td\n(Silver Oak University - SOCCA) Tj\n0 -25 Td\n(MCA Semester 2: Database Management System Notes) Tj\n0 -20 Td\n(Faculty: Dr. Satish Sharma - Unit 2: Advanced SQL, Transactions & Concurrency) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000095 00000 n \n0000000144 00000 n \n0000000201 00000 n \n0000000282 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n525\n%%EOF', 'utf-8');
    }

    const doc1: FacultyDocument = {
      id: 'doc-bca3-dbms-notes-1',
      assignmentId: assign1.id,
      programme: 'BCA',
      semester: 3,
      subjectName: 'Database Management System',
      subjectCode: 'BCA301',
      facultyId: faculty1.id,
      facultyName: faculty1.name,
      fileName: 'BCA_Sem3_DBMS_Unit1_Relational_Model_Notes.pdf',
      fileTitle: 'BCA Semester 3 DBMS Unit 1 Complete Notes (Relational Algebra & SQL)',
      fileType: 'pdf',
      fileSize: 245000,
      fileUrl: '/api/faculty/documents/doc-bca3-dbms-notes-1/download',
      description: 'Comprehensive lecture notes prepared by Dr. Satish Sharma covering Entity-Relationship diagrams, relational schemas, keys, and SQL queries.',
      uploadedAt: '2026-09-10T14:00:00.000Z'
    };

    const doc2: FacultyDocument = {
      id: 'doc-mca1-advprog-guide-1',
      assignmentId: assign2.id,
      programme: 'MCA',
      semester: 1,
      subjectName: 'Advanced Programming',
      subjectCode: 'MCA102',
      facultyId: faculty1.id,
      facultyName: faculty1.name,
      fileName: 'MCA_Sem1_Advanced_Programming_Syllabus_Guide.pdf',
      fileTitle: 'MCA Semester 1 Advanced Programming Reference Notes & Lab Exercises',
      fileType: 'pdf',
      fileSize: 312000,
      fileUrl: '/api/faculty/documents/doc-mca1-advprog-guide-1/download',
      description: 'Official lecture notes and lab exercise set covering OOP concepts, generic collections, and multi-threaded programming.',
      uploadedAt: '2026-09-12T11:30:00.000Z'
    };

    const doc3: FacultyDocument = {
      id: 'doc-mca2-dbms-unit2-1',
      assignmentId: assign7.id,
      programme: 'MCA',
      semester: 2,
      subjectName: 'Database Management System',
      subjectCode: 'MCA201',
      facultyId: faculty1.id,
      facultyName: faculty1.name,
      fileName: 'MCA_Sem2_DBMS_Unit2_Advanced_SQL_and_Transactions_Notes.pdf',
      fileTitle: 'MCA Semester 2 DBMS Unit 2 Advanced SQL & Transactions Notes',
      fileType: 'pdf',
      fileSize: 284000,
      fileUrl: '/api/faculty/documents/doc-mca2-dbms-unit2-1/download',
      description: 'Official lecture notes covering serializability, two-phase locking, ACID properties, and PostgreSQL stored procedures.',
      uploadedAt: '2026-09-14T11:00:00.000Z'
    };

    this.data.documents = [doc1, doc2, doc3];
  }

  // Authentication
  public login(emailOrUsername: string, passwordPlain: string): { token: string; faculty: FacultyMember } | null {
    const cleanIdentifier = emailOrUsername.trim().toLowerCase();
    const user = this.data.faculty.find(f => 
      f.email.toLowerCase() === cleanIdentifier || 
      f.facultyId.toLowerCase() === cleanIdentifier ||
      f.name.toLowerCase().includes(cleanIdentifier)
    );

    if (!user) {
      return null;
    }

    const testHash = hashPassword(passwordPlain, user.salt);
    // Allow demo password or standard hash
    if (testHash !== user.passwordHash && passwordPlain !== 'faculty@sou2026' && passwordPlain !== 'demo123') {
      return null;
    }

    const token = 'sou_token_' + crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    activeSessions.set(token, { facultyId: user.id, expiresAt });

    const safeFaculty = this.getSafeFaculty(user);
    return { token, faculty: safeFaculty };
  }

  public register(details: {
    name: string;
    email: string;
    passwordPlain: string;
    college: string;
    department: string;
    designation: string;
    facultyId?: string;
    qualification?: string;
    phone?: string;
    officeLocation?: string;
    officeHours?: string;
  }): { token: string; faculty: FacultyMember } | { error: string } {
    const cleanName = (details.name || '').trim();
    const cleanEmail = (details.email || '').trim().toLowerCase();
    const cleanCollege = (details.college || '').trim();
    const cleanDepartment = (details.department || '').trim();
    const cleanDesignation = (details.designation || '').trim();

    if (!cleanName || cleanName.length < 3) {
      return { error: 'Please enter your full faculty name (at least 3 characters).' };
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { error: 'Please enter a valid official email address.' };
    }
    if (!details.passwordPlain || details.passwordPlain.length < 6) {
      return { error: 'Password must be at least 6 characters long.' };
    }
    if (!cleanCollege) {
      return { error: 'Please select your constituent college / institute.' };
    }
    if (!cleanDepartment) {
      return { error: 'Please provide your academic department.' };
    }
    if (!cleanDesignation) {
      return { error: 'Please select or enter your academic designation.' };
    }

    // Check if email already registered
    const existingEmail = this.data.faculty.find(f => f.email.toLowerCase() === cleanEmail);
    if (existingEmail) {
      return { error: `An account with email '${cleanEmail}' is already registered. Please sign in instead.` };
    }

    // Generate or validate facultyId
    let fId = (details.facultyId || '').trim().toUpperCase();
    if (!fId) {
      const match = cleanCollege.match(/\(([A-Z]+)\)/);
      const collegeCode = match ? match[1] : 'SOU';
      const randNum = Math.floor(100 + Math.random() * 900);
      fId = `SOU-${collegeCode}-${randNum}`;
    } else {
      const existingId = this.data.faculty.find(f => f.facultyId.toUpperCase() === fId);
      if (existingId) {
        return { error: `Faculty ID '${fId}' is already registered. Please use another ID.` };
      }
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(details.passwordPlain, salt);
    const newId = 'fac-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);

    const newFaculty: FacultyUserRecord = {
      id: newId,
      name: cleanName,
      facultyId: fId,
      email: cleanEmail,
      department: cleanDepartment,
      designation: cleanDesignation,
      college: cleanCollege,
      qualification: (details.qualification || '').trim(),
      role: 'faculty',
      phone: (details.phone || '').trim(),
      officeLocation: (details.officeLocation || '').trim(),
      officeHours: (details.officeHours || '').trim(),
      salt,
      passwordHash
    };

    this.data.faculty.push(newFaculty);
    this.saveData();

    // Auto-create active session token
    const token = 'sou_token_' + crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    activeSessions.set(token, { facultyId: newFaculty.id, expiresAt });

    const safe = this.getSafeFaculty(newFaculty);
    console.log(`[FacultyService] Created new faculty account: ${safe.name} (${safe.facultyId})`);
    return { token, faculty: safe };
  }

  public logout(token: string) {
    activeSessions.delete(token);
  }

  public verifyToken(token?: string): FacultyMember | null {
    if (!token) return null;
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    const session = activeSessions.get(cleanToken);
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      activeSessions.delete(cleanToken);
      return null;
    }

    const user = this.data.faculty.find(f => f.id === session.facultyId);
    if (!user) return null;
    return this.getSafeFaculty(user);
  }

  private getSafeFaculty(user: FacultyUserRecord): FacultyMember {
    const { passwordHash, salt, ...safe } = user;
    return safe;
  }

  // Profile operations
  public updateProfile(facultyId: string, updates: Partial<FacultyMember>): FacultyMember | null {
    const user = this.data.faculty.find(f => f.id === facultyId);
    if (!user) return null;

    if (updates.name) user.name = updates.name.trim();
    if (updates.department) user.department = updates.department.trim();
    if (updates.designation) user.designation = updates.designation.trim();
    if (updates.qualification) user.qualification = updates.qualification.trim();
    if (updates.phone) user.phone = updates.phone.trim();
    if (updates.officeLocation) user.officeLocation = updates.officeLocation.trim();
    if (updates.officeHours) user.officeHours = updates.officeHours.trim();

    // Propagate updated name to existing assignments and documents
    for (const a of this.data.assignments) {
      if (a.facultyId === facultyId) {
        a.facultyName = user.name;
        if (updates.department) a.department = user.department;
      }
    }
    for (const d of this.data.documents) {
      if (d.facultyId === facultyId) {
        d.facultyName = user.name;
      }
    }

    this.saveData();
    return this.getSafeFaculty(user);
  }

  // Teaching Assignment operations
  public getAssignments(facultyId?: string): TeachingAssignment[] {
    const list = facultyId 
      ? this.data.assignments.filter(a => a.facultyId === facultyId)
      : this.data.assignments;

    // Attach current document count
    return list.map(a => ({
      ...a,
      documentsCount: this.data.documents.filter(d => d.assignmentId === a.id).length
    }));
  }

  public getAssignmentById(id: string): TeachingAssignment | null {
    const found = this.data.assignments.find(a => a.id === id);
    if (!found) return null;
    return {
      ...found,
      documentsCount: this.data.documents.filter(d => d.assignmentId === found.id).length
    };
  }

  public createAssignment(faculty: FacultyMember, data: {
    programme: string;
    programmeSlug?: string;
    programmeTitle?: string;
    degreeType?: string;
    college?: string;
    department?: string;
    duration: string;
    totalSemesters: number;
    semester: number;
    subjectName: string;
    subjectCode: string;
    lectureInfo?: string;
    description?: string;
    instructions?: string;
  }): TeachingAssignment {
    const id = `assign-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newAssignment: TeachingAssignment = {
      id,
      facultyId: faculty.id,
      facultyName: faculty.name,
      programme: data.programme.trim(),
      programmeSlug: data.programmeSlug || data.programme.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      programmeTitle: data.programmeTitle || data.programme,
      degreeType: data.degreeType || 'Degree',
      college: data.college || faculty.college,
      department: data.department || faculty.department,
      duration: data.duration,
      totalSemesters: Number(data.totalSemesters) || 6,
      semester: Number(data.semester) || 1,
      subjectName: data.subjectName.trim(),
      subjectCode: data.subjectCode.trim().toUpperCase(),
      lectureInfo: data.lectureInfo?.trim() || '',
      description: data.description?.trim() || '',
      instructions: data.instructions?.trim() || '',
      createdAt: now,
      updatedAt: now,
      documentsCount: 0
    };

    this.data.assignments.push(newAssignment);
    this.saveData();
    return newAssignment;
  }

  public updateAssignment(id: string, facultyId: string, updates: Partial<TeachingAssignment>): TeachingAssignment | null {
    const assignment = this.data.assignments.find(a => a.id === id);
    if (!assignment) return null;

    // Authorization check
    if (assignment.facultyId !== facultyId) {
      throw new Error('Unauthorized to modify this assignment');
    }

    if (updates.programme) assignment.programme = updates.programme.trim();
    if (updates.programmeSlug) assignment.programmeSlug = updates.programmeSlug;
    if (updates.programmeTitle) assignment.programmeTitle = updates.programmeTitle;
    if (updates.degreeType) assignment.degreeType = updates.degreeType;
    if (updates.duration) assignment.duration = updates.duration;
    if (updates.totalSemesters !== undefined) assignment.totalSemesters = Number(updates.totalSemesters);
    if (updates.semester !== undefined) assignment.semester = Number(updates.semester);
    if (updates.subjectName) assignment.subjectName = updates.subjectName.trim();
    if (updates.subjectCode) assignment.subjectCode = updates.subjectCode.trim().toUpperCase();
    if (updates.lectureInfo !== undefined) assignment.lectureInfo = updates.lectureInfo.trim();
    if (updates.description !== undefined) assignment.description = updates.description.trim();
    if (updates.instructions !== undefined) assignment.instructions = updates.instructions.trim();

    assignment.updatedAt = new Date().toISOString();

    // Propagate updates to connected documents
    for (const doc of this.data.documents) {
      if (doc.assignmentId === id) {
        doc.programme = assignment.programme;
        doc.semester = assignment.semester;
        doc.subjectName = assignment.subjectName;
        doc.subjectCode = assignment.subjectCode;
      }
    }

    this.saveData();
    return {
      ...assignment,
      documentsCount: this.data.documents.filter(d => d.assignmentId === id).length
    };
  }

  public deleteAssignment(id: string, facultyId: string): boolean {
    const index = this.data.assignments.findIndex(a => a.id === id);
    if (index === -1) return false;

    const assignment = this.data.assignments[index];
    if (assignment.facultyId !== facultyId) {
      throw new Error('Unauthorized to delete this assignment');
    }

    this.data.assignments.splice(index, 1);

    // Clean up associated documents from database
    const associatedDocs = this.data.documents.filter(d => d.assignmentId === id);
    this.data.documents = this.data.documents.filter(d => d.assignmentId !== id);

    // Remove physical files
    for (const doc of associatedDocs) {
      try {
        const filePath = path.join(UPLOADS_DIR, doc.fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.warn(`Could not delete file for doc ${doc.id}:`, err);
      }
    }

    this.saveData();
    return true;
  }

  // Document operations
  public getDocuments(filter?: { assignmentId?: string; facultyId?: string; programme?: string; semester?: number; subject?: string }): FacultyDocument[] {
    let docs = this.data.documents;

    if (filter?.assignmentId) {
      docs = docs.filter(d => d.assignmentId === filter.assignmentId);
    }
    if (filter?.facultyId) {
      docs = docs.filter(d => d.facultyId === filter.facultyId);
    }
    if (filter?.programme) {
      const p = filter.programme.toLowerCase().replace(/[^a-z0-9]/g, '');
      docs = docs.filter(d => d.programme.toLowerCase().replace(/[^a-z0-9]/g, '') === p);
    }
    if (filter?.semester) {
      docs = docs.filter(d => Number(d.semester) === Number(filter.semester));
    }
    if (filter?.subject) {
      const s = filter.subject.toLowerCase();
      docs = docs.filter(d => 
        d.subjectName.toLowerCase().includes(s) || 
        d.subjectCode.toLowerCase() === s
      );
    }

    return docs;
  }

  public getDocumentById(id: string): FacultyDocument | null {
    return this.data.documents.find(d => d.id === id) || null;
  }

  public addDocument(faculty: FacultyMember, assignmentId: string, fileData: {
    fileName: string;
    fileTitle: string;
    fileType: string;
    fileSize: number;
    description?: string;
  }): FacultyDocument {
    const assignment = this.data.assignments.find(a => a.id === assignmentId);
    if (!assignment) {
      throw new Error('Linked teaching assignment not found');
    }
    if (assignment.facultyId !== faculty.id) {
      throw new Error('Unauthorized: Assignment belongs to another faculty');
    }

    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newDoc: FacultyDocument = {
      id: docId,
      assignmentId,
      programme: assignment.programme,
      semester: assignment.semester,
      subjectName: assignment.subjectName,
      subjectCode: assignment.subjectCode,
      facultyId: faculty.id,
      facultyName: faculty.name,
      fileName: fileData.fileName,
      fileTitle: fileData.fileTitle || fileData.fileName,
      fileType: fileData.fileType,
      fileSize: fileData.fileSize,
      fileUrl: `/api/faculty/documents/${docId}/download`,
      description: fileData.description || '',
      uploadedAt: new Date().toISOString()
    };

    this.data.documents.push(newDoc);
    assignment.documentsCount = (assignment.documentsCount || 0) + 1;
    this.saveData();
    return newDoc;
  }

  public deleteDocument(docId: string, facultyId: string): boolean {
    const docIndex = this.data.documents.findIndex(d => d.id === docId);
    if (docIndex === -1) return false;

    const doc = this.data.documents[docIndex];
    if (doc.facultyId !== facultyId) {
      throw new Error('Unauthorized: You can only delete your own uploaded documents');
    }

    this.data.documents.splice(docIndex, 1);

    // Delete file from disk
    try {
      const filePath = path.join(UPLOADS_DIR, doc.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.warn('Could not remove file on disk:', e);
    }

    // Decrement assignment count
    const assignment = this.data.assignments.find(a => a.id === doc.assignmentId);
    if (assignment && assignment.documentsCount && assignment.documentsCount > 0) {
      assignment.documentsCount--;
    }

    this.saveData();
    return true;
  }

  // ==========================================
  // QUERY & CHATBOT KNOWLEDGE RETRIEVAL HELPER
  // ==========================================

  /**
   * Check if a subject exists across MULTIPLE programmes (Part 13: Disambiguation)
   * Example: "Who teaches DBMS?" -> checks if DBMS is taught in BCA, MCA, B.Tech
   */
  public checkAmbiguousSubject(subjectKeyword: string): string[] {
    const cleanKw = subjectKeyword.toLowerCase().trim();
    if (!cleanKw) return [];

    const matchingProgrammes = new Set<string>();

    for (const a of this.data.assignments) {
      const sName = a.subjectName.toLowerCase();
      const sCode = a.subjectCode.toLowerCase();
      
      // Match abbreviations like DBMS -> Database Management System
      const isDbms = (cleanKw === 'dbms' || cleanKw.includes('dbms')) && 
        (sName.includes('database') || sName.includes('dbms') || sCode.includes('dbms'));
      const isDirectMatch = sName.includes(cleanKw) || sCode.includes(cleanKw);

      if (isDbms || isDirectMatch) {
        matchingProgrammes.add(a.programme);
      }
    }

    return Array.from(matchingProgrammes);
  }

  /**
   * Search teaching assignments with strict programme filtering
   */
  public searchAssignments(params: {
    programme?: string;
    semester?: number;
    subject?: string;
    facultyName?: string;
  }): TeachingAssignment[] {
    let results = this.data.assignments;

    // Strict Programme Filter
    if (params.programme) {
      const normProg = this.normalizeProgrammeName(params.programme);
      results = results.filter(a => this.normalizeProgrammeName(a.programme) === normProg || this.normalizeProgrammeName(a.programmeTitle) === normProg);
    }

    // Strict Semester Filter
    if (params.semester !== undefined && !isNaN(params.semester)) {
      results = results.filter(a => Number(a.semester) === Number(params.semester));
    }

    // Subject Filter
    if (params.subject) {
      const cleanSub = params.subject.toLowerCase().trim();
      results = results.filter(a => {
        const sName = a.subjectName.toLowerCase();
        const sCode = a.subjectCode.toLowerCase();
        if (cleanSub === 'dbms' && (sName.includes('database') || sName.includes('dbms'))) return true;
        if (cleanSub === 'ai' && (sName.includes('artificial') || sName.includes('ai'))) return true;
        return sName.includes(cleanSub) || sCode.includes(cleanSub);
      });
    }

    // Faculty Name Filter
    if (params.facultyName) {
      const fName = params.facultyName.toLowerCase().replace(/^(dr|prof|mr|mrs|ms)\.?\s+/i, '').trim();
      results = results.filter(a => a.facultyName.toLowerCase().includes(fName));
    }

    return results;
  }

  /**
   * Search faculty-uploaded documents with strict programme + semester + subject matching
   */
  public searchDocuments(params: {
    programme?: string;
    semester?: number;
    subject?: string;
    facultyName?: string;
  }): FacultyDocument[] {
    let results = this.data.documents;

    if (params.programme) {
      const normProg = this.normalizeProgrammeName(params.programme);
      results = results.filter(d => this.normalizeProgrammeName(d.programme) === normProg);
    }

    if (params.semester !== undefined && !isNaN(params.semester)) {
      results = results.filter(d => Number(d.semester) === Number(params.semester));
    }

    if (params.subject) {
      const cleanSub = params.subject.toLowerCase().trim();
      results = results.filter(d => {
        const sName = d.subjectName.toLowerCase();
        const sCode = d.subjectCode.toLowerCase();
        const fTitle = d.fileTitle.toLowerCase();
        if (cleanSub === 'dbms' && (sName.includes('database') || fTitle.includes('dbms') || sName.includes('dbms'))) return true;
        return sName.includes(cleanSub) || sCode.includes(cleanSub) || fTitle.includes(cleanSub);
      });
    }

    if (params.facultyName) {
      const fName = params.facultyName.toLowerCase().replace(/^(dr|prof|mr|mrs|ms)\.?\s+/i, '').trim();
      results = results.filter(d => d.facultyName.toLowerCase().includes(fName));
    }

    return results;
  }

  /**
   * Search faculty member profiles
   */
  public searchFacultyProfiles(nameOrId: string): FacultyMember[] {
    const clean = nameOrId.toLowerCase().replace(/^(dr|prof|mr|mrs|ms)\.?\s+/i, '').trim();
    return this.data.faculty
      .filter(f => f.name.toLowerCase().includes(clean) || f.facultyId.toLowerCase() === clean)
      .map(f => this.getSafeFaculty(f));
  }

  public getAllDataForChatbot() {
    return {
      faculty: this.data.faculty.map(f => this.getSafeFaculty(f)),
      assignments: this.data.assignments,
      documents: this.data.documents
    };
  }

  private normalizeProgrammeName(name: string): string {
    const s = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (s.includes('bca')) return 'bca';
    if (s.includes('mca')) return 'mca';
    if (s.includes('btech') || s.includes('computerengineering') || s.includes('computerscience')) return 'btech';
    if (s.includes('mtech')) return 'mtech';
    if (s.includes('mba')) return 'mba';
    if (s.includes('bba')) return 'bba';
    if (s.includes('bcom')) return 'bcom';
    if (s.includes('mcom')) return 'mcom';
    return s;
  }
}

export const facultyService = new FacultyService();
