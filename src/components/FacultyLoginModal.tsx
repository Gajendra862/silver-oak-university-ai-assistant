import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  LogIn, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  UserCheck, 
  ArrowRight,
  KeyRound,
  UserPlus,
  Building2,
  Briefcase,
  GraduationCap,
  BadgeCheck,
  Phone,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { FacultyMember, CollegeInfo } from '../types';

interface FacultyLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (faculty: FacultyMember, token: string) => void;
  theme?: 'light' | 'dark';
  highContrast?: boolean;
  colleges?: CollegeInfo[];
}

const DEFAULT_SOU_COLLEGES = [
  'Silver Oak College of Computer Application (SOCCA)',
  'Silver Oak College of Engineering & Technology (SOCET)',
  'College of Technology (COET)',
  'Silver Oak Institute of Management (SOIM)',
  'Silver Oak Institute of Science (SOIS)',
  'Silver Oak College of Pharmacy (SOCP)',
  'College of Pharmacy (COP)',
  'Silver Oak College of Nursing (SOCN)',
  'Silver Oak Law College (SOLC)',
  'Silver Oak Commerce College (SOCC)',
  'Silver Oak College of Animation & Multimedia (SOCAM)',
  'Silver Oak College of Humanities and Social Sciences (SOCHSS)',
  'Silver Oak Institute of Liberal Studies (SOILPS)',
  'Silver Oak College of Allied Health Sciences (SOCAHC)',
  'Silver Oak College of Vocational Education (SOCVE)',
  'Silver Oak Institute of Design (SOID)',
  'Silver Oak College of Aviation Technology (SOCAT)'
];

const DEFAULT_DEPARTMENTS = [
  'Computer Applications',
  'Computer Engineering',
  'Information Technology',
  'Artificial Intelligence & Machine Learning',
  'Management Studies',
  'Commerce & Banking',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Aeronautical & Aviation',
  'Pharmacy & Pharmacology',
  'Nursing & Clinical Sciences',
  'Physiotherapy',
  'Law & Legal Studies',
  'Applied Sciences & Mathematics',
  'Design & Animation',
  'Humanities & Social Sciences'
];

const DESIGNATIONS = [
  'Assistant Professor',
  'Associate Professor',
  'Professor',
  'Professor & Head of Department (HOD)',
  'Dean / Director',
  'Visiting Faculty / Lecturer',
  'Lab Instructor'
];

export const FacultyLoginModal: React.FC<FacultyLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  theme = 'light',
  highContrast = false,
  colleges = []
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regCollege, setRegCollege] = useState(DEFAULT_SOU_COLLEGES[0]);
  const [regDepartment, setRegDepartment] = useState(DEFAULT_DEPARTMENTS[0]);
  const [regCustomDepartment, setRegCustomDepartment] = useState('');
  const [regDesignation, setRegDesignation] = useState(DESIGNATIONS[0]);
  const [regFacultyId, setRegFacultyId] = useState('');
  const [regQualification, setRegQualification] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regOfficeLocation, setRegOfficeLocation] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const collegeOptions = colleges.length > 0 
    ? colleges.map(c => c.display_name || `${c.name} (${c.abbreviation || 'SOU'})`)
    : DEFAULT_SOU_COLLEGES;

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrId.trim() || !password) {
      setError('Please provide your official email / ID and password.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/faculty/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrUsername: emailOrId.trim(),
          password
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('sou_faculty_token', data.token);
      localStorage.setItem('sou_faculty_user', JSON.stringify(data.faculty));

      onLoginSuccess(data.faculty, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!regName.trim() || regName.trim().length < 3) {
      setError('Please enter your full faculty name (at least 3 characters).');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@') || !regEmail.includes('.')) {
      setError('Please enter a valid official university email address.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please verify both password fields.');
      return;
    }

    const dept = regDepartment === 'Other' && regCustomDepartment.trim()
      ? regCustomDepartment.trim()
      : regDepartment;

    if (!dept) {
      setError('Please specify your academic department.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/faculty/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          college: regCollege,
          department: dept,
          designation: regDesignation,
          facultyId: regFacultyId.trim() || undefined,
          qualification: regQualification.trim() || undefined,
          phone: regPhone.trim() || undefined,
          officeLocation: regOfficeLocation.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed.');
      }

      setSuccessMessage('Faculty account registered successfully! Redirecting to Dashboard...');
      localStorage.setItem('sou_faculty_token', data.token);
      localStorage.setItem('sou_faculty_user', JSON.stringify(data.faculty));

      setTimeout(() => {
        onLoginSuccess(data.faculty, data.token);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Login fill helper for convenient testing
  const fillDemoAccount = (email: string) => {
    setMode('login');
    setEmailOrId(email);
    setPassword('faculty@sou2026');
    setError(null);
  };

  const isDark = theme === 'dark' && !highContrast;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div 
        className={`relative w-full ${mode === 'register' ? 'max-w-xl' : 'max-w-md'} rounded-2xl shadow-xl overflow-hidden border transition-all my-8 ${
          highContrast
            ? 'bg-black text-white border-yellow-400'
            : isDark
              ? 'bg-[#0a1426] text-slate-100 border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.6)]'
              : 'bg-white text-slate-900 border-slate-200'
        }`}
      >
        {/* Modal Header */}
        <div className={`px-4 sm:px-6 py-3.5 sm:py-4 border-b flex items-center justify-between ${
          highContrast ? 'bg-zinc-900 border-yellow-400/40' : isDark ? 'bg-blue-950/40 border-white/10' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              {mode === 'register' ? <UserPlus className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold tracking-tight truncate">
                {mode === 'register' ? 'Create Faculty Account' : 'Faculty Member Portal'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                Silver Oak University Teaching & Resource Management
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4">
          <div className={`grid grid-cols-2 p-1 rounded-xl border text-xs font-semibold ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'login'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'register'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        </div>

        {/* Feedback alerts */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* MODE 1: LOGIN FORM */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="p-4 sm:p-6 pt-2 sm:pt-3 space-y-3.5 sm:space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Official Email / Faculty ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={emailOrId}
                  onChange={(e) => setEmailOrId(e.target.value)}
                  placeholder="e.g. satish.sharma@silveroakuni.ac.in"
                  required
                  className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none transition-all ${
                    highContrast
                      ? 'bg-zinc-900 border-yellow-400 text-white focus:ring-1 focus:ring-yellow-400'
                      : isDark
                        ? 'bg-slate-900/80 border-white/15 text-white placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter faculty password"
                  required
                  className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none transition-all ${
                    highContrast
                      ? 'bg-zinc-900 border-yellow-400 text-white focus:ring-1 focus:ring-yellow-400'
                      : isDark
                        ? 'bg-slate-900/80 border-white/15 text-white placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Dashboard</span>
                </>
              )}
            </button>

            {/* Switch to Register link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <span>New faculty member?</span>
                <span className="font-bold">Create Account here →</span>
              </button>
            </div>

            {/* Quick Demo Credentials Panel for testing */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Test Accounts (Click to Autofill):</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => fillDemoAccount('satish.sharma@silveroakuni.ac.in')}
                  className="text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50 dark:bg-white/5 text-xs transition-colors cursor-pointer group"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-between">
                    <span>Dr. Satish Sharma (SOCCA)</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Teaches: BCA (Sem 3 DBMS), MCA (Sem 1 Adv Prog), B.Tech CSE (Sem 5 AI)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemoAccount('neha.patel@silveroakuni.ac.in')}
                  className="text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50 dark:bg-white/5 text-xs transition-colors cursor-pointer group"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-between">
                    <span>Prof. Neha Patel (SOCCA)</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Teaches: BCA (Sem 3 DBMS, Sem 4 Web Tech)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemoAccount('rajesh.verma@silveroakuni.ac.in')}
                  className="text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50 dark:bg-white/5 text-xs transition-colors cursor-pointer group"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-between">
                    <span>Dr. Rajesh Verma (SOIM)</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Teaches: MBA (Sem 2 Finance)
                  </div>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* MODE 2: REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} className="p-4 sm:p-6 pt-2 sm:pt-3 space-y-3.5 sm:space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Faculty Name *
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Dr. Amit Trivedi or Prof. Ananya Joshi"
                    required
                    className={`w-full pl-10 pr-3 py-2 rounded-xl border text-sm focus:outline-none transition-all ${
                      highContrast
                        ? 'bg-zinc-900 border-yellow-400 text-white focus:ring-1 focus:ring-yellow-400'
                        : isDark
                          ? 'bg-slate-900/80 border-white/15 text-white placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                    }`}
                  />
                </div>
              </div>

              {/* Official Email */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Official University Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. amit.trivedi@silveroakuni.ac.in"
                    required
                    className={`w-full pl-10 pr-3 py-2 rounded-xl border text-sm focus:outline-none transition-all ${
                      highContrast
                        ? 'bg-zinc-900 border-yellow-400 text-white focus:ring-1 focus:ring-yellow-400'
                        : isDark
                          ? 'bg-slate-900/80 border-white/15 text-white placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                    }`}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password * (min 6 chars)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create secure password"
                    required
                    minLength={6}
                    className={`w-full pl-10 pr-3 py-2 rounded-xl border text-sm focus:outline-none transition-all ${
                      highContrast
                        ? 'bg-zinc-900 border-yellow-400 text-white focus:ring-1 focus:ring-yellow-400'
                        : isDark
                          ? 'bg-slate-900/80 border-white/15 text-white placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                    }`}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                    minLength={6}
                    className={`w-full pl-10 pr-3 py-2 rounded-xl border text-sm focus:outline-none transition-all ${
                      highContrast
                        ? 'bg-zinc-900 border-yellow-400 text-white focus:ring-1 focus:ring-yellow-400'
                        : isDark
                          ? 'bg-slate-900/80 border-white/15 text-white placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                    }`}
                  />
                </div>
              </div>

              {/* College / Institute Selection */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Constituent College / Institute *</span>
                </label>
                <select
                  value={regCollege}
                  onChange={(e) => setRegCollege(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none transition-all ${
                    highContrast
                      ? 'bg-zinc-900 border-yellow-400 text-white'
                      : isDark
                        ? 'bg-slate-900/80 border-white/15 text-white focus:border-blue-400'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-blue-600'
                  }`}
                >
                  {collegeOptions.map((c, i) => (
                    <option key={i} value={c} className="bg-slate-900 text-white dark:bg-slate-900">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Academic Department *</span>
                </label>
                <select
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none transition-all ${
                    highContrast
                      ? 'bg-zinc-900 border-yellow-400 text-white'
                      : isDark
                        ? 'bg-slate-900/80 border-white/15 text-white focus:border-blue-400'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-blue-600'
                  }`}
                >
                  {DEFAULT_DEPARTMENTS.map((d, i) => (
                    <option key={i} value={d} className="bg-slate-900 text-white dark:bg-slate-900">
                      {d}
                    </option>
                  ))}
                  <option value="Other" className="bg-slate-900 text-white dark:bg-slate-900">Other (Enter custom)</option>
                </select>
                {regDepartment === 'Other' && (
                  <input
                    type="text"
                    value={regCustomDepartment}
                    onChange={(e) => setRegCustomDepartment(e.target.value)}
                    placeholder="Enter department name"
                    className="w-full mt-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/15 text-xs bg-transparent"
                  />
                )}
              </div>

              {/* Designation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Designation *</span>
                </label>
                <select
                  value={regDesignation}
                  onChange={(e) => setRegDesignation(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none transition-all ${
                    highContrast
                      ? 'bg-zinc-900 border-yellow-400 text-white'
                      : isDark
                        ? 'bg-slate-900/80 border-white/15 text-white focus:border-blue-400'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-blue-600'
                  }`}
                >
                  {DESIGNATIONS.map((d, i) => (
                    <option key={i} value={d} className="bg-slate-900 text-white dark:bg-slate-900">
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Qualification */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Qualification (Optional)</span>
                </label>
                <input
                  type="text"
                  value={regQualification}
                  onChange={(e) => setRegQualification(e.target.value)}
                  placeholder="e.g. Ph.D. in CSE, M.Tech, MCA"
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none transition-all ${
                    highContrast
                      ? 'bg-zinc-900 border-yellow-400 text-white'
                      : isDark
                        ? 'bg-slate-900/80 border-white/15 text-white placeholder-slate-500 focus:border-blue-400'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600'
                  }`}
                />
              </div>

              {/* Faculty ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Faculty ID (Optional)
                </label>
                <input
                  type="text"
                  value={regFacultyId}
                  onChange={(e) => setRegFacultyId(e.target.value)}
                  placeholder="Auto-generated if left blank"
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none transition-all ${
                    highContrast
                      ? 'bg-zinc-900 border-yellow-400 text-white'
                      : isDark
                        ? 'bg-slate-900/80 border-white/15 text-white placeholder-slate-500 focus:border-blue-400'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600'
                  }`}
                />
              </div>

              {/* Office / Cabin Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Office / Room (Optional)</span>
                </label>
                <input
                  type="text"
                  value={regOfficeLocation}
                  onChange={(e) => setRegOfficeLocation(e.target.value)}
                  placeholder="e.g. Block A, Room 204"
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none transition-all ${
                    highContrast
                      ? 'bg-zinc-900 border-yellow-400 text-white'
                      : isDark
                        ? 'bg-slate-900/80 border-white/15 text-white placeholder-slate-500 focus:border-blue-400'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600'
                  }`}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contact Phone (Optional)</span>
                </label>
                <input
                  type="text"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none transition-all ${
                    highContrast
                      ? 'bg-zinc-900 border-yellow-400 text-white'
                      : isDark
                        ? 'bg-slate-900/80 border-white/15 text-white placeholder-slate-500 focus:border-blue-400'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account & Setting Up Portal...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Register & Open Teaching Dashboard</span>
                </>
              )}
            </button>

            {/* Switch to Login link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Already have a faculty account?</span>
                <span className="font-bold">Sign In here →</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
