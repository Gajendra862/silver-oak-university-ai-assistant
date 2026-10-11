import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  GraduationCap, 
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  Upload, 
  FileText, 
  Download, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowLeft, 
  LogOut, 
  RefreshCw, 
  Layers, 
  HelpCircle,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { FacultyMember, TeachingAssignment, FacultyDocument } from '../types';

interface FacultyDashboardProps {
  faculty: FacultyMember;
  token: string;
  onLogout: () => void;
  onReturnToChat: (prefilledQuery?: string) => void;
  theme?: 'light' | 'dark';
  highContrast?: boolean;
}

interface MetaProgramme {
  slug: string;
  title: string;
  degreeType: string;
  college: string;
  duration: string;
  totalSemesters: number;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  faculty,
  token,
  onLogout,
  onReturnToChat,
  theme = 'light',
  highContrast = false
}) => {
  const [activeTab, setActiveTab] = useState<'assignments' | 'resources' | 'profile' | 'test'>('assignments');
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [documents, setDocuments] = useState<FacultyDocument[]>([]);
  const [metaProgrammes, setMetaProgrammes] = useState<MetaProgramme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Assignment Modal State (Add or Edit)
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TeachingAssignment | null>(null);
  const [formProgramme, setFormProgramme] = useState('BCA');
  const [formProgrammeTitle, setFormProgrammeTitle] = useState('Bachelor of Computer Applications');
  const [formDuration, setFormDuration] = useState('3 Years');
  const [formTotalSemesters, setFormTotalSemesters] = useState(6);
  const [formSemester, setFormSemester] = useState(1);
  const [formSubjectName, setFormSubjectName] = useState('');
  const [formSubjectCode, setFormSubjectCode] = useState('');
  const [formLectureInfo, setFormLectureInfo] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document Upload State
  const [uploadAssignmentId, setUploadAssignmentId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(faculty.name);
  const [profileDesignation, setProfileDesignation] = useState(faculty.designation);
  const [profileDepartment, setProfileDepartment] = useState(faculty.department);
  const [profileQualification, setProfileQualification] = useState(faculty.qualification || '');
  const [profilePhone, setProfilePhone] = useState(faculty.phone || '');
  const [profileOfficeLocation, setProfileOfficeLocation] = useState(faculty.officeLocation || '');
  const [profileOfficeHours, setProfileOfficeHours] = useState(faculty.officeHours || '');

  const isDark = theme === 'dark' && !highContrast;

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [assignRes, docsRes, metaRes] = await Promise.all([
        fetch('/api/faculty/assignments', { headers }),
        fetch('/api/faculty/documents', { headers }),
        fetch('/api/faculty/meta/programmes')
      ]);

      if (assignRes.status === 401 || docsRes.status === 401) {
        onLogout();
        return;
      }

      const assignData = await assignRes.json();
      const docsData = await docsRes.json();
      const metaData = await metaRes.json();

      setAssignments(assignData.assignments || []);
      setDocuments(docsData.documents || []);
      if (metaData.programmes && metaData.programmes.length > 0) {
        setMetaProgrammes(metaData.programmes);
      }
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError('Could not load faculty data. Please refresh or log in again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Open modal to add new assignment
  const handleOpenAddAssignment = () => {
    setEditingAssignment(null);
    // Default to BCA
    setFormProgramme('BCA');
    setFormProgrammeTitle('Bachelor of Computer Applications');
    setFormDuration('3 Years');
    setFormTotalSemesters(6);
    setFormSemester(1);
    setFormSubjectName('');
    setFormSubjectCode('');
    setFormLectureInfo('');
    setFormDescription('');
    setFormInstructions('');
    setIsAssignmentModalOpen(true);
  };

  // Open modal to edit existing assignment
  const handleOpenEditAssignment = (assign: TeachingAssignment) => {
    setEditingAssignment(assign);
    setFormProgramme(assign.programme);
    setFormProgrammeTitle(assign.programmeTitle);
    setFormDuration(assign.duration);
    setFormTotalSemesters(assign.totalSemesters);
    setFormSemester(assign.semester);
    setFormSubjectName(assign.subjectName);
    setFormSubjectCode(assign.subjectCode);
    setFormLectureInfo(assign.lectureInfo || '');
    setFormDescription(assign.description || '');
    setFormInstructions(assign.instructions || '');
    setIsAssignmentModalOpen(true);
  };

  // Handle programme selection change in form to auto-populate duration and semesters
  const handleProgrammeSelectChange = (progName: string) => {
    setFormProgramme(progName);
    const matched = metaProgrammes.find(p => p.title.toLowerCase().includes(progName.toLowerCase()) || p.slug === progName.toLowerCase());
    if (matched) {
      setFormProgrammeTitle(matched.title);
      setFormDuration(matched.duration);
      setFormTotalSemesters(matched.totalSemesters);
      if (formSemester > matched.totalSemesters) {
        setFormSemester(1);
      }
    } else if (progName === 'BCA' || progName === 'B.Com' || progName === 'BBA') {
      setFormDuration('3 Years');
      setFormTotalSemesters(6);
      if (formSemester > 6) setFormSemester(1);
    } else if (progName === 'MCA' || progName === 'MBA' || progName === 'M.Tech') {
      setFormDuration('2 Years');
      setFormTotalSemesters(4);
      if (formSemester > 4) setFormSemester(1);
    } else if (progName === 'B.Tech CSE' || progName === 'B.Tech') {
      setFormDuration('4 Years');
      setFormTotalSemesters(8);
      if (formSemester > 8) setFormSemester(1);
    }
  };

  // Save Assignment (Add or Edit)
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubjectName.trim() || !formSubjectCode.trim()) {
      alert('Subject Name and Subject Code are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        programme: formProgramme,
        programmeTitle: formProgrammeTitle,
        duration: formDuration,
        totalSemesters: formTotalSemesters,
        semester: Number(formSemester),
        subjectName: formSubjectName.trim(),
        subjectCode: formSubjectCode.trim().toUpperCase(),
        lectureInfo: formLectureInfo.trim(),
        description: formDescription.trim(),
        instructions: formInstructions.trim()
      };

      const url = editingAssignment
        ? `/api/faculty/assignments/${editingAssignment.id}`
        : '/api/faculty/assignments';
      const method = editingAssignment ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save teaching assignment');

      setIsAssignmentModalOpen(false);
      showNotification(editingAssignment ? 'Teaching assignment updated successfully!' : 'New teaching assignment added successfully!');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error saving assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Assignment
  const handleDeleteAssignment = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove the teaching assignment for "${name}"? Any uploaded documents will also be deleted.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/faculty/assignments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete assignment');
      showNotification('Assignment removed successfully.');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error deleting assignment');
    }
  };

  // Handle Document Upload
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadAssignmentId) {
      alert('Please select a teaching assignment for this document.');
      return;
    }
    if (!uploadFile) {
      alert('Please choose a file to upload.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', uploadFile);
      formData.append('fileTitle', uploadTitle.trim() || uploadFile.name);
      formData.append('description', uploadDescription.trim());

      const res = await fetch(`/api/faculty/assignments/${uploadAssignmentId}/documents`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload document');

      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
      showNotification('Document uploaded successfully and linked to chatbot!');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error uploading document');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Document
  const handleDeleteDocument = async (docId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/faculty/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete document');
      showNotification('Document deleted.');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error deleting document');
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/faculty/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileName,
          designation: profileDesignation,
          department: profileDepartment,
          qualification: profileQualification,
          phone: profilePhone,
          officeLocation: profileOfficeLocation,
          officeHours: profileOfficeHours
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setIsEditingProfile(false);
      showNotification('Faculty profile updated successfully!');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error updating profile');
    }
  };

  return (
    <div className={`min-h-screen ${
      highContrast 
        ? 'bg-black text-white' 
        : isDark 
          ? 'bg-[#060e1d] text-slate-100' 
          : 'bg-slate-50 text-slate-900'
    } flex flex-col font-sans transition-colors duration-200`}>
      
      {/* Top Faculty Header Bar */}
      <header className={`border-b sticky top-0 z-30 ${
        highContrast 
          ? 'bg-zinc-900 border-yellow-400' 
          : isDark 
            ? 'bg-[#08152e]/90 backdrop-blur-md border-white/10 shadow-sm' 
            : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand & Faculty ID */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => onReturnToChat()}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer shrink-0"
              title="Return to Student AI Assistant"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <a 
              href="https://silveroakuni.ac.in" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-white p-1 rounded-lg border border-slate-200 dark:border-white/20 shrink-0"
            >
              <img src="/sou-emblem.svg" alt="SOU" className="h-7 sm:h-8 w-auto object-contain" />
            </a>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-base font-bold tracking-tight truncate">Faculty Portal</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                  {faculty.facultyId}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate max-w-[160px] sm:max-w-md">
                {faculty.name} · {faculty.designation} ({faculty.college})
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onReturnToChat()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Student Chatbot</span>
            </button>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold transition-colors cursor-pointer"
              title="Sign out of Faculty Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto border-t border-slate-100 dark:border-white/5 py-2 scrollbar-none text-xs font-semibold">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'assignments'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>My Teaching Assignments ({assignments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'resources'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Student Resources & Notes ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Faculty Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('test')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'test'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-amber-500'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Live Chatbot Knowledge Test</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        
        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: TEACHING ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            
            {/* Header row with Add button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-white/10">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Active Teaching Assignments</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  You can teach multiple programmes and semesters across Silver Oak University.
                </p>
              </div>

              <button
                onClick={handleOpenAddAssignment}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Teaching Assignment</span>
              </button>
            </div>

            {/* Teaching Assignments Grid */}
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading your teaching assignments...</span>
              </div>
            ) : assignments.length === 0 ? (
              <div className="py-12 text-center p-8 rounded-2xl border border-dashed border-slate-300 dark:border-white/10">
                <GraduationCap className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Teaching Assignments Listed</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Click the button below to add your programmes, semesters, and subjects.
                </p>
                <button
                  onClick={handleOpenAddAssignment}
                  className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs"
                >
                  + Add First Assignment
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments.map((assign) => (
                  <div 
                    key={assign.id}
                    className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                      highContrast 
                        ? 'bg-zinc-900 border-zinc-700' 
                        : isDark 
                          ? 'bg-[#0b182e] border-white/10 hover:border-blue-500/40 shadow-xs' 
                          : 'bg-white border-slate-200 hover:border-blue-400 shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Programme & Semester Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold">
                          {assign.programme} · Sem {assign.semester}
                        </span>

                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {assign.duration} ({assign.totalSemesters} Sem)
                        </span>
                      </div>

                      {/* Subject Name & Code */}
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {assign.subjectName}
                      </h3>
                      <div className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                        Code: {assign.subjectCode}
                      </div>

                      {/* Department & College */}
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        <div>{assign.department}</div>
                        <div className="truncate text-[11px] text-slate-400">{assign.college}</div>
                      </div>

                      {/* Lecture Timings */}
                      {assign.lectureInfo && (
                        <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-xs">
                          <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-0.5">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Lecture & Lab Timings:</span>
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                            {assign.lectureInfo}
                          </div>
                        </div>
                      )}

                      {/* Description / Instructions */}
                      {assign.description && (
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {assign.description}
                        </p>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
                      <button
                        onClick={() => {
                          setUploadAssignmentId(assign.id);
                          setActiveTab('resources');
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Docs ({assign.documentsCount || 0})</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditAssignment(assign)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                          title="Edit assignment details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(assign.id, assign.subjectName)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          title="Delete assignment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STUDENT RESOURCES & DOCUMENT UPLOAD */}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            <div className="pb-2 border-b border-slate-200 dark:border-white/10">
              <h1 className="text-xl font-bold tracking-tight">Student Academic Resources & Documents</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload lecture notes, unit summaries, and lab exercises. Documents are automatically indexed into the student chatbot.
              </p>
            </div>

            {/* Upload Box */}
            <div className={`p-5 rounded-2xl border ${
              highContrast ? 'bg-zinc-900 border-zinc-700' : isDark ? 'bg-[#0b182e] border-white/10' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Upload New Student Resource (PDF, DOC, DOCX, PPT, PPTX, TXT)</span>
              </h2>

              <form onSubmit={handleUploadDocument} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Link to Teaching Assignment *
                    </label>
                    <select
                      value={uploadAssignmentId}
                      onChange={(e) => setUploadAssignmentId(e.target.value)}
                      required
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none ${
                        isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    >
                      <option value="">-- Select Programme, Semester & Subject --</option>
                      {assignments.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.programme} (Sem {a.semester}) - {a.subjectName} ({a.subjectCode})
                        </option>
                      ))}
                    </select>
                    {uploadAssignmentId && (() => {
                      const sel = assignments.find(a => a.id === uploadAssignmentId);
                      if (!sel) return null;
                      return (
                        <div className="mt-2 p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/25 border border-blue-200/50 dark:border-blue-900/30 text-[11px] text-slate-700 dark:text-slate-300">
                          <div className="font-semibold text-blue-700 dark:text-blue-400">
                            {sel.programme} · Sem {sel.semester} · {sel.subjectName} ({sel.subjectCode})
                          </div>
                          {sel.lectureInfo && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-pre-line mt-1 font-mono leading-relaxed">
                              {sel.lectureInfo}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Resource Title / Topic *
                    </label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="e.g. Unit 1 Relational Data Model & SQL Notes"
                      required
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                        isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Select Academic File *
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      required
                      className={`w-full px-3 py-1.5 rounded-xl border text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer ${
                        isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Description / Learning Objectives
                    </label>
                    <textarea
                      rows={4}
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder="e.g. Concepts of schemas, keys, relational algebra, and SQL DDL/DML"
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none resize-y min-h-[100px] max-h-[220px] ${
                        isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                      style={{ height: '115px' }}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading & Indexing...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload & Associate Document</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Uploaded Documents List */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Uploaded Resources ({documents.length})
              </h2>

              {documents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-300 dark:border-white/10 rounded-xl">
                  No documents uploaded yet. Upload your first PDF notes above.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
                        isDark ? 'bg-[#0b182e] border-white/10' : 'bg-white border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-xs uppercase shrink-0">
                          {doc.fileType || 'PDF'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                            {doc.fileTitle}
                          </h4>
                          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                            {doc.programme} · Sem {doc.semester} · {doc.subjectName}
                          </div>
                          {doc.description && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line leading-relaxed line-clamp-3">
                              {doc.description}
                            </p>
                          )}
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                            {doc.fileName} · {(doc.fileSize / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                          title="Open document download link"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteDocument(doc.id, doc.fileTitle)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FACULTY PROFILE */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl space-y-6">
            <div className="pb-2 border-b border-slate-200 dark:border-white/10">
              <h1 className="text-xl font-bold tracking-tight">Faculty Member Profile</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official institutional profile information as displayed in university directories and student queries.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#0b182e] border-white/10' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              {!isEditingProfile ? (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">{faculty.name}</h2>
                      <p className="text-xs text-blue-600 dark:text-blue-400">{faculty.designation}</p>
                    </div>
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Faculty ID:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{faculty.facultyId}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Department:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{faculty.department}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Constituent College:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{faculty.college}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Official Email:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{faculty.email}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Qualifications:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{faculty.qualification || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Phone / Extension:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{faculty.phone || '+91 7966046300'}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Office Location:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{faculty.officeLocation || 'Main Campus'}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Office Consultation Hours:</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{faculty.officeHours || 'During working hours'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Faculty Name *</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        required
                        className={`w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300'}`}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Designation *</label>
                      <input
                        type="text"
                        value={profileDesignation}
                        onChange={(e) => setProfileDesignation(e.target.value)}
                        required
                        className={`w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300'}`}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Department *</label>
                      <input
                        type="text"
                        value={profileDepartment}
                        onChange={(e) => setProfileDepartment(e.target.value)}
                        required
                        className={`w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300'}`}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Qualifications</label>
                      <input
                        type="text"
                        value={profileQualification}
                        onChange={(e) => setProfileQualification(e.target.value)}
                        placeholder="e.g. Ph.D. in Computer Science"
                        className={`w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300'}`}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Phone</label>
                      <input
                        type="text"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300'}`}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Office Location</label>
                      <input
                        type="text"
                        value={profileOfficeLocation}
                        onChange={(e) => setProfileOfficeLocation(e.target.value)}
                        placeholder="e.g. Academic Block A, Room 302"
                        className={`w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300'}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs cursor-pointer"
                    >
                      Save Profile
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CHATBOT KNOWLEDGE PREVIEW */}
        {activeTab === 'test' && (
          <div className="max-w-3xl space-y-6">
            <div className="pb-2 border-b border-slate-200 dark:border-white/10">
              <h1 className="text-xl font-bold tracking-tight">Live Chatbot Knowledge Integration</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Test how students find your teaching assignments, subjects, and study notes through the university AI assistant.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#0b182e] border-white/10' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Click any of these verified student queries to launch the AI Assistant with real-time factual grounding:
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {assignments.map((a, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        "Who teaches {a.subjectName} in {a.programme}?"
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Matches: {a.programme} Semester {a.semester} · {a.facultyName}
                      </div>
                    </div>
                    <button
                      onClick={() => onReturnToChat(`Who teaches ${a.subjectName} in ${a.programme}?`)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shrink-0 cursor-pointer"
                    >
                      Ask in Chatbot →
                    </button>
                  </div>
                ))}

                {documents.map((d, dIdx) => (
                  <div key={`doc-${dIdx}`} className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        "Give me {d.programme} semester {d.semester} {d.subjectName} notes."
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Returns: {d.fileTitle} ({d.fileName})
                      </div>
                    </div>
                    <button
                      onClick={() => onReturnToChat(`Give me ${d.programme} semester ${d.semester} ${d.subjectName} notes.`)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shrink-0 cursor-pointer"
                    >
                      Ask in Chatbot →
                    </button>
                  </div>
                ))}

                <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      "Who is {faculty.name}?"
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Returns verified faculty profile, designation, and all multi-programme assignments
                    </div>
                  </div>
                  <button
                    onClick={() => onReturnToChat(`Who is ${faculty.name}?`)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shrink-0 cursor-pointer"
                  >
                    Ask in Chatbot →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ADD / EDIT TEACHING ASSIGNMENT MODAL */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className={`relative w-full max-w-xl rounded-2xl shadow-xl overflow-hidden border ${
            highContrast ? 'bg-black text-white border-yellow-400' : isDark ? 'bg-[#0a1426] text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'
          }`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
              isDark ? 'bg-blue-950/40 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <h2 className="text-base font-bold">
                {editingAssignment ? 'Edit Teaching Assignment' : 'Add New Teaching Assignment'}
              </h2>
              <button
                onClick={() => setIsAssignmentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Select Programme *</label>
                  <select
                    value={formProgramme}
                    onChange={(e) => handleProgrammeSelectChange(e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-xl border font-medium ${
                      isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="BCA">BCA (Bachelor of Computer Applications - 3 Years / 6 Sem)</option>
                    <option value="MCA">MCA (Master of Computer Application - 2 Years / 4 Sem)</option>
                    <option value="B.Tech CSE">B.Tech CSE (Computer Science & Engineering - 4 Years / 8 Sem)</option>
                    <option value="BBA">BBA (Bachelor of Business Administration - 3 Years / 6 Sem)</option>
                    <option value="MBA">MBA (Master of Business Administration - 2 Years / 4 Sem)</option>
                    <option value="B.Com">B.Com (Bachelor of Commerce - 3 Years / 6 Sem)</option>
                    <option value="M.Com">M.Com (Master of Commerce - 2 Years / 4 Sem)</option>
                    <option value="B.Pharm">B.Pharm (Bachelor of Pharmacy - 4 Years / 8 Sem)</option>
                    <option value="BPT">BPT (Physiotherapy - 4.5/5 Years / 10 Sem)</option>
                    <option value="M.Sc IT">M.Sc IT (Integrated - 5 Years / 10 Sem)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Select Semester (Valid for {formProgramme}: Sem 1 to {formTotalSemesters}) *
                  </label>
                  <select
                    value={formSemester}
                    onChange={(e) => setFormSemester(Number(e.target.value))}
                    required
                    className={`w-full px-3 py-2 rounded-xl border font-medium ${
                      isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    {Array.from({ length: formTotalSemesters }, (_, i) => i + 1).map((semNum) => (
                      <option key={semNum} value={semNum}>
                        Semester {semNum}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Subject Name *</label>
                  <input
                    type="text"
                    value={formSubjectName}
                    onChange={(e) => setFormSubjectName(e.target.value)}
                    placeholder="e.g. Database Management System"
                    required
                    className={`w-full px-3 py-2 rounded-xl border ${
                      isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Subject Code *</label>
                  <input
                    type="text"
                    value={formSubjectCode}
                    onChange={(e) => setFormSubjectCode(e.target.value)}
                    placeholder="e.g. BCA301"
                    required
                    className={`w-full px-3 py-2 rounded-xl border uppercase font-mono ${
                      isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Lecture & Lab Timings</label>
                <textarea
                  rows={3}
                  value={formLectureInfo}
                  onChange={(e) => setFormLectureInfo(e.target.value)}
                  placeholder={"Monday: 10:00 AM - 11:00 AM\nWednesday: 2:00 PM - 3:00 PM\nFriday: 11:00 AM - 12:00 PM"}
                  className={`w-full px-3 py-2 rounded-xl border resize-y whitespace-pre-wrap font-sans ${
                    isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
                <span className="block text-[10px] text-slate-400 mt-1">
                  Enter day-wise timings. Press Enter for multiple timing lines.
                </span>
              </div>

              <div>
                <label className="block font-semibold mb-1">Subject Description & Key Topics</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Relational model, ER modeling, SQL querying, normalization, and transaction processing."
                  className={`w-full px-3 py-2 rounded-xl border resize-none ${
                    isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Important Student Instructions & Deadlines</label>
                <input
                  type="text"
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  placeholder="e.g. 75% lab attendance mandatory; Assignment 1 due week 6."
                  className={`w-full px-3 py-2 rounded-xl border ${
                    isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAssignmentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingAssignment ? 'Save Changes' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
