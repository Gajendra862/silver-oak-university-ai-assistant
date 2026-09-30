-- ==============================================================================
-- SILVER OAK UNIVERSITY AI ASSISTANT - SUPABASE DATABASE SCHEMA
-- Copy and paste this script directly into the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Enable UUID Extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- TABLE 1: FACULTY MEMBERS
-- Stores faculty user profiles, authentication credentials, and official details
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.faculty_members (
    id TEXT PRIMARY KEY DEFAULT ('fac-' || substr(md5(random()::text), 1, 12)),
    faculty_id TEXT UNIQUE NOT NULL,                       -- e.g. 'SOU-SOCCA-001'
    name TEXT NOT NULL,                                   -- e.g. 'Dr. Satish Sharma'
    email TEXT UNIQUE NOT NULL,                           -- e.g. 'satish.sharma@silveroakuni.ac.in'
    password_hash TEXT NOT NULL,                          -- Hashed password with salt
    salt TEXT NOT NULL,                                   -- Cryptographic salt
    department TEXT NOT NULL,                             -- e.g. 'Computer Applications'
    designation TEXT NOT NULL,                            -- e.g. 'Professor & Head of Department'
    college TEXT NOT NULL,                                -- e.g. 'Silver Oak College of Computer Application (SOCCA)'
    qualification TEXT DEFAULT '',                        -- e.g. 'Ph.D. in Computer Science, M.Tech'
    phone TEXT DEFAULT '',                                -- e.g. '+91 7966046301'
    office_location TEXT DEFAULT '',                      -- e.g. 'Academic Block A, 3rd Floor, Room 302'
    office_hours TEXT DEFAULT '',                         -- e.g. 'Monday - Friday: 2:00 PM - 4:00 PM'
    role TEXT DEFAULT 'faculty',                          -- 'faculty' | 'admin' | 'hod'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast login and profile lookups
CREATE INDEX IF NOT EXISTS idx_faculty_email ON public.faculty_members(email);
CREATE INDEX IF NOT EXISTS idx_faculty_faculty_id ON public.faculty_members(faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_college ON public.faculty_members(college);


-- ==============================================================================
-- TABLE 2: TEACHING ASSIGNMENTS (Multi-Programme Faculty Teaching Data)
-- Allows a single faculty member to teach multiple programmes across semesters & subjects
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.teaching_assignments (
    id TEXT PRIMARY KEY DEFAULT ('assign-' || substr(md5(random()::text), 1, 14)),
    faculty_id TEXT NOT NULL REFERENCES public.faculty_members(id) ON DELETE CASCADE,
    faculty_name TEXT NOT NULL,                           -- Cached for fast AI retrieval
    programme TEXT NOT NULL,                              -- Short name e.g. 'BCA', 'MCA', 'B.Tech CSE'
    programme_slug TEXT NOT NULL,                         -- Slug e.g. 'bca', 'mca', 'btech_computer_engineering'
    programme_title TEXT NOT NULL,                        -- e.g. 'Bachelor of Computer Applications'
    degree_type TEXT NOT NULL,                            -- 'Bachelor' | 'Master' | 'Diploma' | 'Doctoral'
    college TEXT NOT NULL,                                -- Constituent college offering this programme
    department TEXT NOT NULL,                             -- Department
    duration TEXT NOT NULL,                               -- e.g. '3 Years', '4 Years', '2 Years'
    total_semesters INTEGER NOT NULL DEFAULT 6,           -- Dynamically defined per programme
    semester INTEGER NOT NULL,                            -- Current teaching semester e.g. 1 to 10
    subject_name TEXT NOT NULL,                           -- e.g. 'Database Management System'
    subject_code TEXT DEFAULT '',                         -- e.g. 'BCA301'
    lecture_info TEXT DEFAULT '',                         -- Schedule: e.g. 'Mon, Wed, Fri 10:00 AM - 11:00 AM (Room 304, Lab 2)'
    description TEXT DEFAULT '',                          -- Curriculum focus / module summary
    instructions TEXT DEFAULT '',                         -- Submission / attendance requirements
    documents_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fast lookup indexes for student chatbot queries
CREATE INDEX IF NOT EXISTS idx_assignments_faculty_id ON public.teaching_assignments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_assignments_programme ON public.teaching_assignments(programme);
CREATE INDEX IF NOT EXISTS idx_assignments_semester ON public.teaching_assignments(semester);
CREATE INDEX IF NOT EXISTS idx_assignments_subject ON public.teaching_assignments(subject_name);
CREATE INDEX IF NOT EXISTS idx_assignments_lookup ON public.teaching_assignments(programme, semester, subject_name);


-- ==============================================================================
-- TABLE 3: FACULTY DOCUMENTS & STUDENT STUDY MATERIALS
-- Stores syllabus copies, lecture notes, question banks, sample papers & presentations
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.faculty_documents (
    id TEXT PRIMARY KEY DEFAULT ('doc-' || substr(md5(random()::text), 1, 14)),
    assignment_id TEXT NOT NULL REFERENCES public.teaching_assignments(id) ON DELETE CASCADE,
    faculty_id TEXT NOT NULL REFERENCES public.faculty_members(id) ON DELETE CASCADE,
    faculty_name TEXT NOT NULL,
    programme TEXT NOT NULL,                              -- Strictly bound to programme (BCA, MCA, etc.)
    semester INTEGER NOT NULL,
    subject_name TEXT NOT NULL,
    subject_code TEXT DEFAULT '',
    file_name TEXT NOT NULL,                              -- Original or disk file name
    file_title TEXT NOT NULL,                             -- Human-readable resource title
    file_type TEXT NOT NULL DEFAULT 'pdf',                -- 'pdf' | 'doc' | 'docx' | 'ppt' | 'pptx' | 'txt'
    file_size INTEGER DEFAULT 0,                          -- File size in bytes
    file_url TEXT NOT NULL,                               -- API download endpoint or Supabase Storage public URL
    description TEXT DEFAULT '',                          -- Description / syllabus unit details
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for searching student resources
CREATE INDEX IF NOT EXISTS idx_documents_assignment ON public.faculty_documents(assignment_id);
CREATE INDEX IF NOT EXISTS idx_documents_prog_sem_sub ON public.faculty_documents(programme, semester, subject_name);
CREATE INDEX IF NOT EXISTS idx_documents_faculty_id ON public.faculty_documents(faculty_id);


-- ==============================================================================
-- TABLE 4: STUDENT INQUIRIES & CHATBOT AUDIT LOGS (OPTIONAL)
-- Records student queries and detected topics for academic analytics
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.chat_logs (
    id BIGSERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    detected_language TEXT DEFAULT 'English',
    resolved_course TEXT DEFAULT '',
    response_preview TEXT DEFAULT '',
    execution_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON public.chat_logs(created_at DESC);


-- ==============================================================================
-- SEED INITIAL FACULTY DEMO DATA
-- Pre-populates the 3 demonstration professors matching Silver Oak University
-- ==============================================================================
INSERT INTO public.faculty_members (
    id, faculty_id, name, email, password_hash, salt, department, designation, college, qualification, phone, office_location, office_hours
) VALUES 
(
    'fac-101', 
    'SOU-SOCCA-001', 
    'Dr. Satish Sharma', 
    'satish.sharma@silveroakuni.ac.in',
    -- password: faculty@sou2026
    '4a20b7bc60309995c6569106206d203893d56b02553b6da25a2df6a096a603b5', 
    'f3c64bb93766d0e82aa2a8ee09bb840e',
    'Computer Applications', 
    'Professor & Head of Department', 
    'Silver Oak College of Computer Application (SOCCA)',
    'Ph.D. in Computer Science, M.Tech (CSE), B.E. (IT)',
    '+91 7966046301',
    'Academic Block A, 3rd Floor, Room 302',
    'Monday - Friday: 2:00 PM - 4:00 PM'
),
(
    'fac-102', 
    'SOU-SOCCA-002', 
    'Prof. Neha Patel', 
    'neha.patel@silveroakuni.ac.in',
    '4a20b7bc60309995c6569106206d203893d56b02553b6da25a2df6a096a603b5', 
    'f3c64bb93766d0e82aa2a8ee09bb840e',
    'Computer Applications', 
    'Assistant Professor', 
    'Silver Oak College of Computer Application (SOCCA)',
    'M.Phil (CS), Master of Computer Application (MCA)',
    '+91 7966046302',
    'Academic Block A, 2nd Floor, Staff Room 204',
    'Tuesday & Thursday: 11:00 AM - 1:00 PM'
),
(
    'fac-103', 
    'SOU-SOIM-001', 
    'Dr. Rajesh Verma', 
    'rajesh.verma@silveroakuni.ac.in',
    '4a20b7bc60309995c6569106206d203893d56b02553b6da25a2df6a096a603b5', 
    'f3c64bb93766d0e82aa2a8ee09bb840e',
    'Management Studies', 
    'Associate Professor', 
    'Silver Oak Institute of Management (SOIM)',
    'Ph.D. in Management, MBA (Finance), CFA',
    '+91 7966046303',
    'Management Block B, 1st Floor, Room 108',
    'Monday & Wednesday: 1:30 PM - 3:30 PM'
)
ON CONFLICT (id) DO NOTHING;

-- Seed Teaching Assignments
INSERT INTO public.teaching_assignments (
    id, faculty_id, faculty_name, programme, programme_slug, programme_title, degree_type, college, department, duration, total_semesters, semester, subject_name, subject_code, lecture_info, description, instructions
) VALUES 
(
    'assign-bca-sem3-dbms-1',
    'fac-101',
    'Dr. Satish Sharma',
    'BCA',
    'bca',
    'Bachelor of Computer Applications',
    'Bachelor',
    'Silver Oak College of Computer Application (SOCCA)',
    'Computer Applications',
    '3 Years',
    6,
    3,
    'Database Management System',
    'BCA301',
    'Monday, Wednesday, Friday: 10:00 AM - 11:00 AM (Room 304, Lab 2)',
    'Relational database concepts, SQL queries, ER modeling, relational algebra, normalization, and ACID properties.',
    '75% mandatory attendance in practical lab sessions. Unit 1 assignment submission due before midterm examinations.'
),
(
    'assign-mca-sem1-advprog-1',
    'fac-101',
    'Dr. Satish Sharma',
    'MCA',
    'mca',
    'Master of Computer Application',
    'Master',
    'Silver Oak College of Computer Application (SOCCA)',
    'Computer Applications',
    '2 Years',
    4,
    1,
    'Advanced Programming',
    'MCA102',
    'Tuesday & Thursday: 11:30 AM - 1:00 PM (Lab 4)',
    'Advanced data structures, object-oriented software engineering, modern design patterns, and multithreaded architecture.',
    'Individual programming assignment repository must be maintained on GitHub.'
),
(
    'assign-btech-sem5-ai-1',
    'fac-101',
    'Dr. Satish Sharma',
    'B.Tech CSE',
    'btech_computer_engineering',
    'B.Tech in Computer Engineering',
    'Bachelor',
    'Silver Oak College of Engineering & Technology (SOCET)',
    'Computer Engineering',
    '4 Years',
    8,
    5,
    'Artificial Intelligence',
    'CE504',
    'Monday & Thursday: 2:00 PM - 3:30 PM (Auditorium 2)',
    'Heuristic search techniques, knowledge representation, propositional logic, game theory, expert systems, and neural network foundations.',
    'Mid-semester project demonstration in groups of two.'
),
(
    'assign-bca-sem3-dbms-2',
    'fac-102',
    'Prof. Neha Patel',
    'BCA',
    'bca',
    'Bachelor of Computer Applications',
    'Bachelor',
    'Silver Oak College of Computer Application (SOCCA)',
    'Computer Applications',
    '3 Years',
    6,
    3,
    'Database Management System',
    'BCA301',
    'Tuesday & Thursday: 10:00 AM - 11:30 AM (Division B, Lab 3)',
    'Hands-on practical SQL database querying, normalization, schema design, and MySQL/PostgreSQL administration.',
    'Submit weekly lab workbooks during lab hours.'
)
ON CONFLICT (id) DO NOTHING;

-- Seed Faculty Study Materials / Documents
INSERT INTO public.faculty_documents (
    id, assignment_id, faculty_id, faculty_name, programme, semester, subject_name, subject_code, file_name, file_title, file_type, file_size, file_url, description
) VALUES 
(
    'doc-bca3-dbms-notes-1',
    'assign-bca-sem3-dbms-1',
    'fac-101',
    'Dr. Satish Sharma',
    'BCA',
    3,
    'Database Management System',
    'BCA301',
    'BCA_Sem3_DBMS_Unit1_Relational_Model_Notes.pdf',
    'BCA Semester 3 DBMS Unit 1 Complete Notes (Relational Algebra & SQL)',
    'pdf',
    145020,
    '/api/faculty/documents/doc-bca3-dbms-notes-1/download',
    'Comprehensive lecture notes covering ER diagrams, relational schema mapping, integrity constraints, and SQL DDL/DML examples.'
)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures data security while allowing read access for student chatbot queries
-- ==============================================================================
ALTER TABLE public.faculty_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to teaching assignments and documents for the student chatbot
CREATE POLICY "Public read for assignments" ON public.teaching_assignments FOR SELECT USING (true);
CREATE POLICY "Public read for documents" ON public.faculty_documents FOR SELECT USING (true);
CREATE POLICY "Public read for faculty profiles" ON public.faculty_members FOR SELECT USING (true);
