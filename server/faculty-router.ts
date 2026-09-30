import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { facultyService, UPLOADS_DIR } from './faculty-service';
import { universityDataManager } from './university-crawler';

export const facultyRouter = express.Router();

// Multer storage configuration for student academic resources
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and preserve extension
    const cleanOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    const ext = path.extname(cleanOriginal);
    const baseName = path.basename(cleanOriginal, ext);
    cb(null, `${baseName}_${uniqueSuffix}${ext}`);
  }
});

// File filter supporting PDF, DOC, DOCX, PPT, PPTX, TXT
const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  const allowedExts = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type '${ext}'. Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB max
  }
});

// Auth middleware
function requireFacultyAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const faculty = facultyService.verifyToken(authHeader);
  if (!faculty) {
    res.status(401).json({ error: 'Unauthorized: Valid faculty session required' });
    return;
  }
  (req as any).faculty = faculty;
  next();
}

// 1. Faculty Login
facultyRouter.post('/login', (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      res.status(400).json({ error: 'Email/Username and password are required' });
      return;
    }

    const auth = facultyService.login(emailOrUsername, password);
    if (!auth) {
      res.status(401).json({ error: 'Invalid credentials. Please verify your official email/ID and password.' });
      return;
    }

    res.json({
      success: true,
      token: auth.token,
      faculty: auth.faculty
    });
  } catch (err: any) {
    console.error('[Faculty API /login] Error:', err);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

// 1B. Create Faculty Account / Registration
facultyRouter.post('/register', (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      college, 
      department, 
      designation, 
      facultyId, 
      qualification, 
      phone, 
      officeLocation, 
      officeHours 
    } = req.body;

    if (!name || !email || !password || !college || !department || !designation) {
      res.status(400).json({ 
        error: 'Please fill all required fields: Name, Official Email, Password, College, Department, and Designation.' 
      });
      return;
    }

    const result = facultyService.register({
      name,
      email,
      passwordPlain: password,
      college,
      department,
      designation,
      facultyId,
      qualification,
      phone,
      officeLocation,
      officeHours
    });

    if ('error' in result) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Faculty account created successfully.',
      token: result.token,
      faculty: result.faculty
    });
  } catch (err: any) {
    console.error('[Faculty API /register] Error:', err);
    res.status(500).json({ error: 'Internal server error while creating faculty account.' });
  }
});

// 2. Faculty Logout
facultyRouter.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const cleanToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    facultyService.logout(cleanToken);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// 3. Current Faculty Session (me)
facultyRouter.get('/me', requireFacultyAuth, (req, res) => {
  const faculty = (req as any).faculty;
  res.json({ faculty });
});

// 4. Update Profile
facultyRouter.put('/profile', requireFacultyAuth, (req, res) => {
  try {
    const faculty = (req as any).faculty;
    const updated = facultyService.updateProfile(faculty.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Faculty record not found' });
      return;
    }
    res.json({ success: true, faculty: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update profile' });
  }
});

// 5. Get Teaching Assignments (filter by faculty or query)
facultyRouter.get('/assignments', requireFacultyAuth, (req, res) => {
  try {
    const faculty = (req as any).faculty;
    const assignments = facultyService.getAssignments(faculty.id);
    res.json({ assignments });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve teaching assignments' });
  }
});

// 6. Create Teaching Assignment
facultyRouter.post('/assignments', requireFacultyAuth, (req, res) => {
  try {
    const faculty = (req as any).faculty;
    const { programme, duration, totalSemesters, semester, subjectName, subjectCode } = req.body;

    if (!programme || !subjectName || !semester || !duration || !totalSemesters) {
      res.status(400).json({ error: 'Missing required assignment fields: programme, duration, totalSemesters, semester, subjectName' });
      return;
    }

    if (Number(semester) > Number(totalSemesters)) {
      res.status(400).json({ error: `Semester ${semester} exceeds total semesters (${totalSemesters}) for ${programme}` });
      return;
    }

    const assignment = facultyService.createAssignment(faculty, req.body);
    res.status(201).json({ success: true, assignment });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create assignment' });
  }
});

// 7. Update Teaching Assignment
facultyRouter.put('/assignments/:id', requireFacultyAuth, (req, res) => {
  try {
    const faculty = (req as any).faculty;
    const assignmentId = req.params.id;

    const updated = facultyService.updateAssignment(assignmentId, faculty.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    res.json({ success: true, assignment: updated });
  } catch (err: any) {
    const status = err.message?.includes('Unauthorized') ? 403 : 500;
    res.status(status).json({ error: err.message || 'Failed to update assignment' });
  }
});

// 8. Delete Teaching Assignment
facultyRouter.delete('/assignments/:id', requireFacultyAuth, (req, res) => {
  try {
    const faculty = (req as any).faculty;
    const assignmentId = req.params.id;

    const ok = facultyService.deleteAssignment(assignmentId, faculty.id);
    if (!ok) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    res.json({ success: true, message: 'Teaching assignment and associated documents deleted' });
  } catch (err: any) {
    const status = err.message?.includes('Unauthorized') ? 403 : 500;
    res.status(status).json({ error: err.message || 'Failed to delete assignment' });
  }
});

// 9. Upload Document for Assignment
facultyRouter.post('/assignments/:id/documents', requireFacultyAuth, upload.single('document'), (req, res) => {
  try {
    const faculty = (req as any).faculty;
    const assignmentId = req.params.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No document file uploaded' });
      return;
    }

    const ext = path.extname(file.originalname).replace(/^\./, '').toLowerCase();
    const doc = facultyService.addDocument(faculty, assignmentId, {
      fileName: file.filename,
      fileTitle: req.body.fileTitle || file.originalname,
      fileType: ext,
      fileSize: file.size,
      description: req.body.description || ''
    });

    res.status(201).json({ success: true, document: doc });
  } catch (err: any) {
    console.error('[Faculty API /documents upload] Error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload document' });
  }
});

// 10. Get Documents for Current Faculty
facultyRouter.get('/documents', requireFacultyAuth, (req, res) => {
  try {
    const faculty = (req as any).faculty;
    const documents = facultyService.getDocuments({ facultyId: faculty.id });
    res.json({ documents });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve documents' });
  }
});

// 11. Delete Document
facultyRouter.delete('/documents/:id', requireFacultyAuth, (req, res) => {
  try {
    const faculty = (req as any).faculty;
    const docId = req.params.id;

    const ok = facultyService.deleteDocument(docId, faculty.id);
    if (!ok) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    res.json({ success: true, message: 'Document removed' });
  } catch (err: any) {
    const status = err.message?.includes('Unauthorized') ? 403 : 500;
    res.status(status).json({ error: err.message || 'Failed to delete document' });
  }
});

// 12. Public Document Download/View Endpoint
facultyRouter.get('/documents/:id/download', (req, res) => {
  try {
    const docId = req.params.id;
    const doc = facultyService.getDocumentById(docId);
    if (!doc) {
      res.status(404).send('Document not found on Silver Oak University server.');
      return;
    }

    const filePath = path.join(UPLOADS_DIR, doc.fileName);
    if (!fs.existsSync(filePath)) {
      res.status(404).send('Physical file missing from server storage.');
      return;
    }

    // Set appropriate content type
    let contentType = 'application/octet-stream';
    if (doc.fileType === 'pdf') contentType = 'application/pdf';
    else if (doc.fileType === 'docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (doc.fileType === 'pptx') contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    else if (doc.fileType === 'txt') contentType = 'text/plain; charset=utf-8';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err: any) {
    console.error('[Faculty API /documents download] Error:', err);
    res.status(500).send('Error serving document');
  }
});

// 13. Official Programmes Metadata helper for Faculty Assignment Dropdowns
// (Provides accurate durations and semester counts for BCA, MCA, B.Tech, MBA, etc.)
facultyRouter.get('/meta/programmes', (req, res) => {
  try {
    const branches = universityDataManager.getBranches();
    const colleges = universityDataManager.getColleges();

    // Map programmes with normalized structure, duration, and calculated semesters
    const programmeList = branches.map(b => {
      let durationStr = b.duration || '3 Years';
      let semestersCount = 6;

      const durMatch = durationStr.match(/(\d+(?:\.\d+)?)\s*Year/i);
      if (durMatch) {
        const yrs = parseFloat(durMatch[1]);
        semestersCount = Math.round(yrs * 2);
      } else if (/4\s*Sem/i.test(b.semesters || '')) {
        semestersCount = 4;
      } else if (/6\s*Sem/i.test(b.semesters || '')) {
        semestersCount = 6;
      } else if (/8\s*Sem/i.test(b.semesters || '')) {
        semestersCount = 8;
      } else if (/10\s*Sem/i.test(b.semesters || '')) {
        semestersCount = 10;
      }

      let collegeName = 'Silver Oak University';
      if (b.colleges && b.colleges.length > 0) {
        collegeName = b.colleges[0].name;
      }

      let degreeType = 'Degree';
      if (/bachelor|b\.tech|bca|bba|b\.com|bsc|bpt/i.test(b.title)) degreeType = 'Bachelor';
      else if (/master|mca|mba|m\.tech|msc|m\.com|mpt/i.test(b.title)) degreeType = 'Master';
      else if (/diploma/i.test(b.title)) degreeType = 'Diploma';
      else if (/ph\.?d|doctoral/i.test(b.title)) degreeType = 'Doctoral';

      return {
        slug: b.slug,
        title: b.title,
        degreeType,
        college: collegeName,
        duration: durationStr,
        totalSemesters: semestersCount
      };
    });

    res.json({ programmes: programmeList, colleges });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve programme metadata' });
  }
});
