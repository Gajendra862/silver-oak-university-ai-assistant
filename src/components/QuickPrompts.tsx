import React, { useState, useRef } from 'react';
import { 
  GraduationCap, 
  FileText, 
  BookOpen, 
  IndianRupee, 
  Calendar, 
  Building2, 
  Users, 
  Home, 
  Briefcase, 
  Search, 
  Mic, 
  MicOff, 
  ArrowRight, 
  Languages, 
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import campusHeroImg from '../assets/images/sou_campus_aerial_1790518154348.jpg';

interface QuickPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  onOpenExplorer?: (tab?: 'programs' | 'colleges') => void;
  onOpenFeeExplorer?: () => void;
  totalPrograms?: number;
  totalColleges?: number;
  theme?: 'light' | 'dark';
  highContrast?: boolean;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ 
  onSelectPrompt,
  onOpenExplorer,
  onOpenFeeExplorer,
  totalPrograms = 121,
  totalColleges = 17,
  theme = 'light',
  highContrast = false
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Web Speech API Voice Recognition
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicNotice('Speech recognition is not supported in this browser. Please type your query.');
      setTimeout(() => setMicNotice(null), 4000);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setMicNotice('Listening... Speak now');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSearchInput(transcript);
          setIsListening(false);
          setMicNotice(null);
          onSelectPrompt(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setMicNotice(event.error === 'not-allowed' ? 'Microphone access denied in browser settings' : 'Voice input timed out');
        setTimeout(() => setMicNotice(null), 3500);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e: any) {
      console.error('Speech recognition exception:', e);
      setIsListening(false);
      setMicNotice('Microphone is unavailable');
      setTimeout(() => setMicNotice(null), 3000);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSelectPrompt(searchInput.trim());
      setSearchInput('');
    }
  };

  // 10 Master Quick Action Cards (User Requirement #4)
  const quickActionCards = [
    {
      id: 'programmes_fees',
      icon: <GraduationCap className="w-5 h-5 text-blue-600" />,
      label: 'Programmes & Fees',
      description: 'Explore degrees, tuition fees, eligibility, and duration',
      prompt: 'What degree programmes and fee structures are offered at Silver Oak University?',
      actionLabel: 'Browse All',
      onSpecialAction: () => onOpenExplorer?.('programs')
    },
    {
      id: 'admission',
      icon: <FileText className="w-5 h-5 text-indigo-600" />,
      label: 'Admission',
      description: 'Application procedures, deadlines, criteria and forms',
      prompt: 'What is the admission procedure, eligibility criteria and important dates at Silver Oak University?'
    },
    {
      id: 'syllabus',
      icon: <BookOpen className="w-5 h-5 text-emerald-600" />,
      label: 'Syllabus',
      description: 'Official teaching schemes, subjects and PDF downloads',
      prompt: 'Where can I find the official syllabus and teaching schemes for Silver Oak University courses?'
    },
    {
      id: 'fees_scholarships',
      icon: <IndianRupee className="w-5 h-5 text-amber-600" />,
      label: 'Fees & Scholarships',
      description: 'Tuition fees, payment terms, and government scholarships',
      prompt: 'What are the official tuition fees and scholarship schemes at Silver Oak University?',
      actionLabel: 'Fee Structure',
      onSpecialAction: () => onOpenFeeExplorer?.()
    },
    {
      id: 'exams_results',
      icon: <Calendar className="w-5 h-5 text-red-600" />,
      label: 'Exams & Results',
      description: 'Summer 2026 exam timetables, schedules and rules',
      prompt: 'When are the Summer 2026 university examinations and how to check timetables?'
    },
    {
      id: 'colleges',
      icon: <Building2 className="w-5 h-5 text-cyan-600" />,
      label: 'Colleges',
      description: '17 constituent colleges and dedicated institutes',
      prompt: 'List all 17 constituent colleges and institutes of Silver Oak University',
      actionLabel: 'View 17 Colleges',
      onSpecialAction: () => onOpenExplorer?.('colleges')
    },
    {
      id: 'faculty',
      icon: <Users className="w-5 h-5 text-purple-600" />,
      label: 'Faculty',
      description: 'Academic departments, leadership, and teaching staff',
      prompt: 'Tell me about the faculty members, academic departments, and teaching staff at Silver Oak University'
    },
    {
      id: 'campus_facilities',
      icon: <Home className="w-5 h-5 text-teal-600" />,
      label: 'Campus & Facilities',
      description: 'Hostels, sports, labs, transport, and campus amenities',
      prompt: 'What campus facilities, laboratories, hostels, transport, and sports amenities are available?'
    },
    {
      id: 'placements',
      icon: <Briefcase className="w-5 h-5 text-orange-600" />,
      label: 'Placements',
      description: 'Campus recruitment records, recruiters, and training',
      prompt: 'What are the campus placement records, training opportunities, and top recruiting companies?'
    },
    {
      id: 'ask_anything',
      icon: <Search className="w-5 h-5 text-blue-700" />,
      label: 'Ask Anything',
      description: 'Type any course, circular, helpline or custom question',
      prompt: 'What are the top highlights and official contact details of Silver Oak University?',
      onSpecialAction: () => searchInputRef.current?.focus()
    }
  ];

  // Language prompt samples
  const multilingualExamples = [
    {
      lang: 'English',
      prompt: 'What is the fee and eligibility for BCA at Silver Oak University?'
    },
    {
      lang: 'English',
      prompt: 'B.Tech Computer Engineering fees, duration, and admission requirements?'
    },
    {
      lang: 'ગુજરાતી',
      prompt: 'સિલ્વર ઓક યુનિવર્સિટીમાં BCA સેમેસ્ટર 4 ની પરીક્ષા ક્યારે છે?'
    },
    {
      lang: 'हिन्दी',
      prompt: 'सिल्वर ओक यूनिवर्सिटी में एडमिशन प्रोसेस और हेल्पलाइन नंबर क्या है?'
    }
  ];

  const isDark = theme === 'dark' && !highContrast;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-3 sm:py-6">
      
      {/* Hero Welcome Card - Clean & Modern University Design (PART 23 & 24) */}
      <div className={`rounded-2xl p-6 sm:p-7 mb-6 border transition-all ${
        highContrast
          ? 'bg-zinc-950 border-yellow-400 text-white'
          : isDark
            ? 'bg-[#0a162c] border-white/10 text-slate-100 shadow-xs'
            : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs">
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                Official University Knowledge Assistant
              </span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-slate-500 dark:text-slate-400">
                silveroakuni.ac.in
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Silver Oak University AI Assistant
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Grounded on official university documents: admissions, fees, syllabus, Summer 2026 exam timetables, faculty teaching assignments, and campus facilities.
            </p>
          </div>

          <div className="flex sm:flex-col gap-2 shrink-0">
            <button
              onClick={() => onOpenFeeExplorer?.()}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Fee Structure</span>
            </button>
            <button
              onClick={() => onOpenExplorer?.('programs')}
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                isDark 
                  ? 'border-white/10 hover:bg-white/5 text-slate-200' 
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Programmes ({totalPrograms})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Search Input Form (Hero Search) */}
      <div className="mb-6">
        <form 
          onSubmit={handleSearchSubmit}
          className={`relative flex items-center border ${
            highContrast 
              ? 'border-yellow-400 bg-zinc-900' 
              : isDark 
                ? 'bg-slate-900/75 backdrop-blur-xl border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4)] focus-within:border-amber-400/70 focus-within:ring-2 focus-within:ring-amber-400/20' 
                : 'bg-white border-slate-300 shadow-xs focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-600'
          } rounded-xl p-1.5 transition-all`}
        >
          <Search className={`w-5 h-5 ml-2.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-slate-400'}`} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Ask anything about Silver Oak University (e.g. MCA fees, B.Tech syllabus, Summer 2026 exams)..."
            className={`w-full px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none bg-transparent ${
              isDark ? 'text-white placeholder:text-slate-400' : 'text-slate-800 placeholder:text-slate-400'
            }`}
          />
          
          {/* Voice Microphone Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : isDark ? 'text-slate-400 hover:text-amber-300 hover:bg-white/10' : 'text-slate-400 hover:text-blue-700 hover:bg-slate-100'
            }`}
            title={isListening ? 'Stop listening' : 'Voice input with microphone'}
            aria-label="Voice input"
          >
            {isListening ? <Mic className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Ask Button */}
          <button
            type="submit"
            disabled={!searchInput.trim()}
            className={`ml-1 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              searchInput.trim()
                ? (isDark 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-[1.02]' 
                    : 'bg-[#062051] hover:bg-blue-900 text-amber-400 shadow-xs')
                : (isDark ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed')
            }`}
          >
            <span>Ask</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {micNotice && (
          <p className={`text-xs px-3 py-1.5 rounded-lg mt-2 inline-flex items-center gap-1.5 ${
            isDark ? 'text-amber-300 bg-amber-950/40 border border-amber-500/30' : 'text-amber-700 bg-amber-50 border border-amber-200'
          }`}>
            <Mic className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>{micNotice}</span>
          </p>
        )}
      </div>

      {/* Official Grounding Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
        <div className={`p-3 rounded-xl border text-center transition-all ${
          isDark 
            ? 'bg-slate-900/60 backdrop-blur-md border-white/10 text-white shadow-xs' 
            : 'bg-white border-slate-200'
        }`}>
          <div className={`text-xl font-extrabold tabular-nums ${isDark ? 'text-amber-300' : 'text-[#062051]'}`}>
            {totalPrograms}
          </div>
          <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Programmes Grounded</div>
        </div>
        <div className={`p-3 rounded-xl border text-center transition-all ${
          isDark 
            ? 'bg-slate-900/60 backdrop-blur-md border-white/10 text-white shadow-xs' 
            : 'bg-white border-slate-200'
        }`}>
          <div className={`text-xl font-extrabold tabular-nums ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
            {totalColleges}
          </div>
          <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Constituent Colleges</div>
        </div>
        <div className={`p-3 rounded-xl border text-center transition-all ${
          isDark 
            ? 'bg-slate-900/60 backdrop-blur-md border-white/10 text-white shadow-xs' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="text-xl font-extrabold text-amber-500">
            Summer 2026
          </div>
          <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Active Exam Schedules</div>
        </div>
        <div className={`p-3 rounded-xl border text-center transition-all ${
          isDark 
            ? 'bg-slate-900/60 backdrop-blur-md border-white/10 text-white shadow-xs' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="text-xl font-extrabold text-emerald-400">
            UGC & AICTE
          </div>
          <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Recognized & Approved</div>
        </div>
      </div>

      {/* 10 Quick Actions Cards Grid (Section 4) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            isDark ? 'text-slate-200' : 'text-slate-900'
          }`}>
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Quick Actions</span>
          </h3>
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Click any topic to query immediately
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {quickActionCards.map((card) => (
            <div
              key={card.id}
              onClick={() => {
                if (card.onSpecialAction && card.id === 'ask_anything') {
                  card.onSpecialAction();
                } else {
                  onSelectPrompt(card.prompt);
                }
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                isDark 
                  ? 'bg-slate-900/60 backdrop-blur-md border-white/10 hover:border-amber-400/50 hover:bg-slate-800/80 hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)]' 
                  : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-xs'
              }`}
            >
              <div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform ${
                  isDark ? 'bg-slate-800/80 border border-white/10' : 'bg-slate-50 border border-slate-100'
                }`}>
                  {card.icon}
                </div>
                <h4 className={`text-xs font-bold transition-colors ${
                  isDark ? 'text-slate-200 group-hover:text-amber-300' : 'text-slate-900 group-hover:text-blue-700'
                }`}>
                  {card.label}
                </h4>
                <p className={`text-[11px] mt-1 leading-snug line-clamp-2 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {card.description}
                </p>
              </div>

              <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-semibold ${
                isDark ? 'border-white/10 text-amber-400' : 'border-slate-100 text-blue-700'
              }`}>
                <span>{card.actionLabel || 'Ask Assistant'}</span>
                <span className="text-amber-500 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Multilingual Questions */}
      <div className={`p-4 rounded-xl border ${
        isDark ? 'bg-slate-900/60 backdrop-blur-md border-white/10 text-white' : 'bg-white border-slate-200'
      }`}>
        <div className={`flex items-center gap-2 mb-2.5 text-xs font-bold uppercase tracking-wide ${
          isDark ? 'text-slate-200' : 'text-slate-800'
        }`}>
          <Languages className="w-4 h-4 text-emerald-500" />
          <span>Frequently Asked Questions (English · ગુજરાતી · हिन्दी)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {multilingualExamples.map((ex, i) => (
            <button
              key={i}
              onClick={() => onSelectPrompt(ex.prompt)}
              className={`text-left p-2.5 rounded-lg border transition-colors flex items-start gap-2 group cursor-pointer ${
                isDark 
                  ? 'border-white/10 hover:border-white/20 bg-slate-800/40 hover:bg-slate-800/80 text-slate-200' 
                  : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                isDark ? 'bg-white/10 text-blue-300' : 'bg-slate-100 text-slate-600'
              }`}>
                {ex.lang}
              </span>
              <span className={`text-xs leading-snug ${
                isDark ? 'text-slate-200 group-hover:text-amber-300' : 'text-slate-700 group-hover:text-blue-900'
              }`}>
                {ex.prompt}
              </span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
