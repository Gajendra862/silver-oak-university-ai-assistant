import React, { useState } from 'react';
import { 
  GraduationCap, 
  Building2, 
  Bug, 
  RotateCcw, 
  Eye, 
  Menu, 
  X, 
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { SystemStatus } from '../types';

interface HeaderProps {
  status: SystemStatus | null;
  totalPrograms?: number;
  totalColleges?: number;
  debugMode: boolean;
  onToggleDebug: () => void;
  onOpenExplorer: (tab?: 'programs' | 'colleges') => void;
  onClearChat: () => void;
  activeLanguage: string;
  onSelectLanguage: (lang: string) => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  fontSize: 'normal' | 'large';
  onToggleFontSize: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  totalPrograms,
  totalColleges,
  debugMode,
  onToggleDebug,
  onOpenExplorer,
  onClearChat,
  activeLanguage,
  onSelectLanguage,
  highContrast,
  onToggleHighContrast,
  fontSize,
  onToggleFontSize
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const programsCount = totalPrograms || status?.branchesCount || 121;
  const collegesCount = totalColleges || status?.collegesCount || 17;

  return (
    <header className={`${highContrast ? 'bg-black border-yellow-400' : 'bg-[#062051] border-blue-900/60'} text-white border-b sticky top-0 z-30 shadow-md transition-colors`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-3">
          
          {/* Brand & Identity */}
          <div className="flex items-center gap-3">
            <a 
              href="https://silveroakuni.ac.in" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-sm flex items-center justify-center shrink-0 hover:opacity-95 transition-opacity"
              title="Official Silver Oak University Portal"
            >
              <div className={`w-full h-full ${highContrast ? 'bg-black' : 'bg-[#062051]'} rounded-[10px] flex items-center justify-center font-serif text-amber-400 font-black text-lg tracking-wider`}>
                SOU
              </div>
            </a>
            <div>
              <div className="flex items-center gap-2">
                <a href="/" className="text-base sm:text-lg font-bold tracking-tight text-white hover:text-amber-300 transition-colors">
                  Silver Oak University
                </a>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  AI Student Assistant
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80 hidden sm:flex items-center gap-2">
                <span>Official Information & Admissions</span>
                <span className="text-blue-400">·</span>
                <span className="text-emerald-300 inline-flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {programsCount} Programs · {collegesCount} Colleges Grounded
                </span>
              </p>
            </div>
          </div>

          {/* Desktop Controls */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex items-center bg-white/10 rounded-lg p-0.5 text-xs font-medium border border-white/10">
              {['Auto', 'EN', 'ગુજરાતી', 'हिन्दी'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => onSelectLanguage(lang)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    activeLanguage === lang
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-blue-100 hover:text-white hover:bg-white/5'
                  }`}
                  title={`Language style: ${lang}`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Programme Explorer */}
            <button
              onClick={() => onOpenExplorer('programs')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/70 hover:bg-blue-600 border border-blue-400/30 text-xs font-medium text-white transition-all cursor-pointer active:scale-95"
              title="Explore all Silver Oak University programmes"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
              <span>Programmes ({programsCount})</span>
            </button>

            {/* College Explorer */}
            <button
              onClick={() => onOpenExplorer('colleges')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-medium text-white transition-all cursor-pointer active:scale-95"
              title="Browse 17 Constituent Colleges of Silver Oak University"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-200" />
              <span>Colleges ({collegesCount})</span>
            </button>

            {/* Accessibility: Font size */}
            <button
              onClick={onToggleFontSize}
              className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                fontSize === 'large'
                  ? 'bg-amber-400 text-slate-950 border-amber-500'
                  : 'bg-white/5 text-blue-200 border-white/10 hover:bg-white/10'
              }`}
              title={fontSize === 'large' ? 'Switch to normal font size' : 'Increase font size (Accessibility)'}
            >
              <span className="px-1">A{fontSize === 'large' ? '↑' : ''}</span>
            </button>

            {/* Accessibility: High contrast */}
            <button
              onClick={onToggleHighContrast}
              className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                highContrast
                  ? 'bg-yellow-400 text-black border-yellow-500 font-bold'
                  : 'bg-white/5 text-blue-200 border-white/10 hover:bg-white/10'
              }`}
              title="Toggle High Contrast Mode"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {/* Developer Debug Toggle */}
            <button
              onClick={onToggleDebug}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                debugMode
                  ? 'bg-amber-400 text-slate-950 border-amber-500 font-semibold'
                  : 'bg-white/5 text-blue-200 border-white/10 hover:bg-white/10'
              }`}
              title="Toggle Developer Retrieval Debug Logs"
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Debug</span>
            </button>

            {/* Reset Chat */}
            <button
              onClick={onClearChat}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-blue-200 hover:text-white transition-all cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => onOpenExplorer('programs')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/80 text-xs text-white font-medium"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
              <span>Courses</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-blue-800/60 flex flex-col gap-2.5 pb-2">
            {/* Language Selection */}
            <div className="flex items-center justify-between text-xs text-blue-200 pb-1">
              <span>Language:</span>
              <div className="flex items-center bg-white/10 rounded-lg p-0.5 text-xs font-medium">
                {['Auto', 'EN', 'ગુજરાતી', 'हिन्दी'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      onSelectLanguage(lang);
                      setMobileMenuOpen(false);
                    }}
                    className={`px-2 py-0.5 rounded ${
                      activeLanguage === lang ? 'bg-amber-500 text-slate-950 font-bold' : 'text-blue-100'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  onOpenExplorer('programs');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/10 text-left text-xs font-medium text-white hover:bg-white/15"
              >
                <GraduationCap className="w-4 h-4 text-amber-300" />
                <span>Programmes ({programsCount})</span>
              </button>

              <button
                onClick={() => {
                  onOpenExplorer('colleges');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/10 text-left text-xs font-medium text-white hover:bg-white/15"
              >
                <Building2 className="w-4 h-4 text-blue-200" />
                <span>Colleges ({collegesCount})</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-blue-800/40 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleFontSize}
                  className="px-2.5 py-1 rounded bg-white/10 text-blue-100"
                >
                  Size: {fontSize === 'large' ? 'Large' : 'Normal'}
                </button>
                <button
                  onClick={onToggleHighContrast}
                  className="px-2.5 py-1 rounded bg-white/10 text-blue-100"
                >
                  {highContrast ? 'Standard Mode' : 'High Contrast'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleDebug}
                  className={`px-2 py-1 rounded text-xs ${debugMode ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-blue-200'}`}
                >
                  Debug
                </button>
                <button
                  onClick={() => {
                    onClearChat();
                    setMobileMenuOpen(false);
                  }}
                  className="p-1 rounded bg-white/10 text-blue-200"
                  title="Clear chat"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
