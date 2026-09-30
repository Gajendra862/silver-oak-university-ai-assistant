import React, { useState } from 'react';
import { 
  GraduationCap, 
  Building2, 
  RotateCcw, 
  Menu, 
  X, 
  IndianRupee, 
  Sun, 
  Moon, 
  UserCheck, 
  LogIn, 
  MessageSquare,
  Eye,
  Bug,
  CheckCircle2
} from 'lucide-react';
import { SystemStatus, FacultyMember } from '../types';

interface HeaderProps {
  status: SystemStatus | null;
  totalPrograms?: number;
  totalColleges?: number;
  debugMode: boolean;
  onToggleDebug: () => void;
  onOpenExplorer: (tab?: 'programs' | 'colleges') => void;
  onOpenFeeExplorer: () => void;
  onClearChat: () => void;
  activeLanguage: string;
  onSelectLanguage: (lang: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  fontSize: 'normal' | 'large';
  onToggleFontSize: () => void;
  // Faculty Portal integration (PART 1, 2, 25)
  activeFaculty: FacultyMember | null;
  onOpenFacultyLogin: () => void;
  onOpenFacultyDashboard: () => void;
  onLogoutFaculty: () => void;
  isFacultyView: boolean;
  onReturnToChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  totalPrograms,
  totalColleges,
  debugMode,
  onToggleDebug,
  onOpenExplorer,
  onOpenFeeExplorer,
  onClearChat,
  activeLanguage,
  onSelectLanguage,
  theme,
  onToggleTheme,
  highContrast,
  onToggleHighContrast,
  fontSize,
  onToggleFontSize,
  activeFaculty,
  onOpenFacultyLogin,
  onOpenFacultyDashboard,
  onLogoutFaculty,
  isFacultyView,
  onReturnToChat
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const programsCount = totalPrograms || status?.branchesCount || 121;
  const collegesCount = totalColleges || status?.collegesCount || 17;

  const isDark = theme === 'dark' && !highContrast;

  const headerBgClass = highContrast
    ? 'bg-black border-yellow-400 text-white'
    : isDark
      ? 'bg-[#08152e]/95 backdrop-blur-md border-white/10 text-slate-100 shadow-xs'
      : 'bg-white/95 backdrop-blur-md border-slate-200 text-slate-800 shadow-xs';

  return (
    <header className={`${headerBgClass} border-b sticky top-0 z-30 transition-all duration-200`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          
          {/* Official University Identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <a 
              href="https://silveroakuni.ac.in" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`p-1 sm:p-1.5 rounded-xl border flex items-center justify-center shrink-0 hover:scale-[1.02] transition-transform ${
                isDark ? 'bg-white/10 border-white/15' : 'bg-white border-slate-200 shadow-xs'
              }`}
              title="Official Silver Oak University Portal (silveroakuni.ac.in)"
            >
              <img 
                src="/sou-emblem.svg" 
                alt="Silver Oak University Logo" 
                className="h-7 sm:h-9 w-auto aspect-[98/76] object-contain"
                loading="eager"
              />
            </a>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <button 
                  onClick={onReturnToChat}
                  className="text-sm sm:text-base lg:text-lg font-bold tracking-tight text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer truncate"
                >
                  Silver Oak University
                </button>
                {/* Desktop badge */}
                <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
                  AI Assistant
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-1.5 mt-0.5 truncate">
                <span>Official Information & Admissions</span>
                <span>·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {programsCount} Programs · {collegesCount} Colleges
                </span>
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links (PART 25) */}
          <div className="hidden lg:flex items-center gap-2">
            
            {/* Student Assistant / Chat */}
            <button
              onClick={onReturnToChat}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                !isFacultyView 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : isDark 
                    ? 'text-slate-300 hover:text-white hover:bg-white/5' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Open AI Assistant"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>AI Assistant</span>
            </button>

            {/* Programmes Explorer Modal */}
            <button
              onClick={() => onOpenExplorer('programs')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isDark 
                  ? 'border-white/10 hover:bg-white/5 text-slate-200' 
                  : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title="Browse Silver Oak University programmes and degrees"
            >
              <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Programmes</span>
            </button>

            {/* Fee Structure Modal */}
            <button
              onClick={onOpenFeeExplorer}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isDark 
                  ? 'border-white/10 hover:bg-white/5 text-slate-200' 
                  : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title="Official Silver Oak University Fee Structure"
            >
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Fees</span>
            </button>

            {/* Faculty Portal / Login / Dashboard */}
            {activeFaculty ? (
              <div className="flex items-center gap-1 pl-1">
                <button
                  onClick={onOpenFacultyDashboard}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isFacultyView 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-600/20'
                  }`}
                  title="Open Faculty Teaching Dashboard"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[120px]">{activeFaculty.name.split(' ')[0]} (Dashboard)</span>
                </button>
                <button
                  onClick={onLogoutFaculty}
                  className="px-2 py-1.5 rounded-lg text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-medium cursor-pointer"
                  title="Sign out of faculty session"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenFacultyLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-600/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-xs font-semibold transition-colors cursor-pointer"
                title="Faculty Member Login & Dashboard"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Faculty Login</span>
              </button>
            )}

            {/* Language Selector */}
            <div className={`flex items-center rounded-lg p-0.5 text-xs font-medium border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}>
              {['Auto', 'EN', 'ગુજરાતી', 'हिन्दी'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => onSelectLanguage(lang)}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    activeLanguage === lang
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDark 
                  ? 'border-white/10 text-amber-400 hover:bg-white/5' 
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Reset Chat */}
            {!isFacultyView && (
              <button
                onClick={onClearChat}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isDark ? 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title="Reset conversation"
                aria-label="Reset chat"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Right Controls: Theme + Reset + Drawer Trigger (Always fits without overflow) */}
          <div className="flex items-center gap-1 lg:hidden shrink-0">
            <button
              onClick={onToggleTheme}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDark 
                  ? 'border-white/10 text-amber-400 hover:bg-white/5' 
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {!isFacultyView && (
              <button
                onClick={onClearChat}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isDark ? 'border-white/10 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
                title="Reset conversation"
                aria-label="Reset chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* Mobile Dedicated Action Row: Guarantees "AI Assistant" and "Fees" never overflow on 320px - 430px screens */}
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-200/60 dark:border-white/10 lg:hidden">
          {/* AI Assistant Button */}
          <button
            onClick={onReturnToChat}
            className={`flex-1 min-w-0 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              !isFacultyView 
                ? 'bg-blue-600 text-white shadow-xs' 
                : isDark 
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' 
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
            title="Student AI Assistant Chat"
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">AI Assistant</span>
          </button>

          {/* Fees Button */}
          <button
            onClick={onOpenFeeExplorer}
            className="flex-1 min-w-0 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
            title="Official Silver Oak University Fee Structure"
          >
            <IndianRupee className="w-3.5 h-3.5 shrink-0" />
            <span>Fees</span>
          </button>

          {/* Faculty Button */}
          {activeFaculty ? (
            <button
              onClick={onOpenFacultyDashboard}
              className={`flex-1 min-w-0 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                isFacultyView
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                    ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
              title="Open Faculty Teaching Dashboard"
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Portal</span>
            </button>
          ) : (
            <button
              onClick={onOpenFacultyLogin}
              className={`flex-1 min-w-0 py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                isDark
                  ? 'border-white/15 text-slate-300 hover:bg-white/5'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Faculty Member Login"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Faculty</span>
            </button>
          )}
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2 pb-2 text-xs">
            <button
              onClick={() => {
                onReturnToChat();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2 rounded-lg bg-blue-600 text-white font-semibold text-left"
            >
              <MessageSquare className="w-4 h-4" />
              <span>AI Assistant</span>
            </button>

            <button
              onClick={() => {
                onOpenFeeExplorer();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-white/10 font-medium text-left"
            >
              <IndianRupee className="w-4 h-4 text-emerald-500" />
              <span>Fees</span>
            </button>

            <button
              onClick={() => {
                onOpenExplorer('programs');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-white/10 font-medium text-left"
            >
              <GraduationCap className="w-4 h-4 text-blue-500" />
              <span>Explore Programmes ({programsCount})</span>
            </button>

            <button
              onClick={() => {
                onOpenExplorer('colleges');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-white/10 font-medium text-left"
            >
              <Building2 className="w-4 h-4 text-cyan-500" />
              <span>17 Constituent Colleges</span>
            </button>

            {/* Mobile Faculty Option */}
            {activeFaculty ? (
              <div className="p-2 rounded-lg border border-blue-500/20 bg-blue-50 dark:bg-blue-950/20 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{activeFaculty.name}</div>
                  <div className="text-[11px] text-slate-500">{activeFaculty.designation}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      onOpenFacultyDashboard();
                      setMobileMenuOpen(false);
                    }}
                    className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-semibold text-xs"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      onLogoutFaculty();
                      setMobileMenuOpen(false);
                    }}
                    className="px-2 py-1 rounded-md text-red-600 text-xs font-semibold"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenFacultyLogin();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 p-2 rounded-lg border border-blue-500/30 text-blue-600 dark:text-blue-400 font-semibold text-left"
              >
                <LogIn className="w-4 h-4" />
                <span>Faculty Member Login</span>
              </button>
            )}

            {/* Theme & Controls Row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-1">
                {['Auto', 'EN', 'ગુજરાતી', 'हिन्दी'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      onSelectLanguage(lang);
                      setMobileMenuOpen(false);
                    }}
                    className={`px-2 py-1 rounded ${
                      activeLanguage === lang ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleTheme}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/15"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                </button>
                <button
                  onClick={() => {
                    onClearChat();
                    setMobileMenuOpen(false);
                  }}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/15"
                  title="Clear Chat"
                >
                  <RotateCcw className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
