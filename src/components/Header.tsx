import React from 'react';
import { Sparkles, GraduationCap, Bug, RefreshCw, Globe, CheckCircle2 } from 'lucide-react';
import { SystemStatus } from '../types';

interface HeaderProps {
  status: SystemStatus | null;
  totalPrograms?: number;
  debugMode: boolean;
  onToggleDebug: () => void;
  onOpenExplorer: () => void;
  onClearChat: () => void;
  activeLanguage: string;
  onSelectLanguage: (lang: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  totalPrograms,
  debugMode,
  onToggleDebug,
  onOpenExplorer,
  onClearChat,
  activeLanguage,
  onSelectLanguage
}) => {
  return (
    <header className="bg-[#062051] text-white border-b border-blue-900/60 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Brand & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-sm flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#062051] rounded-[10px] flex items-center justify-center font-serif text-amber-400 font-black text-xl tracking-wider">
                SOU
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Silver Oak University
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    AI Assistant
                  </span>
                </h1>
              </div>
              <p className="text-xs text-blue-200/80 flex items-center gap-2 flex-wrap">
                <span>Official Information Portal</span>
                <span className="text-blue-400">•</span>
                <span>Admissions, Syllabus & Exam Timetables</span>
                {status && (
                  <>
                    <span className="text-blue-400">•</span>
                    <span className="inline-flex items-center gap-1 text-emerald-300 font-medium">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {status.branchesCount} Programs Grounded
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Controls & Nav */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Language Badges */}
            <div className="flex items-center bg-white/10 rounded-lg p-0.5 text-xs font-medium border border-white/10">
              {['Auto', 'EN', 'ગુજરાતી', 'हिन्दी'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => onSelectLanguage(lang)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeLanguage === lang
                      ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                      : 'text-blue-100 hover:text-white hover:bg-white/5'
                  }`}
                  title={`Language style: ${lang}`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Program Explorer Drawer Button */}
            <button
              onClick={onOpenExplorer}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/60 hover:bg-blue-600 border border-blue-400/30 text-xs font-medium text-white transition-all cursor-pointer shadow-xs active:scale-95"
              title="Explore all Silver Oak University programmes"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
              <span>Programmes ({totalPrograms || status?.branchesCount || 107})</span>
            </button>

            {/* Developer Debug Toggle */}
            <button
              onClick={onToggleDebug}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                debugMode
                  ? 'bg-amber-400 text-slate-950 border-amber-500 font-semibold'
                  : 'bg-white/5 text-blue-200 border-white/10 hover:bg-white/10'
              }`}
              title="Toggle Developer Retrieval Debug Logs"
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Debug</span>
            </button>

            {/* Clear Chat */}
            <button
              onClick={onClearChat}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-blue-200 hover:text-white transition-all"
              title="Reset conversation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
