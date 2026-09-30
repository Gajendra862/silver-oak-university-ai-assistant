import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Search, 
  IndianRupee, 
  ExternalLink, 
  MessageSquare, 
  Building2, 
  Clock, 
  GraduationCap,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { UniversityBranch, CollegeInfo, FeeStructureItem } from '../types';

interface FeeStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: UniversityBranch[];
  colleges: CollegeInfo[];
  onAskAboutProgram: (query: string) => void;
  initialQuery?: string;
  theme?: 'light' | 'dark';
  highContrast?: boolean;
}

const DEGREE_FILTERS = [
  { id: 'all', label: 'All Degrees' },
  { id: 'bachelor', label: 'Bachelor' },
  { id: 'master', label: 'Master' },
  { id: 'diploma', label: 'Diploma' },
  { id: 'doctoral', label: 'Doctoral' },
  { id: 'vocational', label: 'Vocational' }
];

export const FeeStructureModal: React.FC<FeeStructureModalProps> = ({
  isOpen,
  onClose,
  branches,
  colleges,
  onAskAboutProgram,
  initialQuery = '',
  theme = 'light',
  highContrast = false
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedDegree, setSelectedDegree] = useState('all');
  const [selectedCollege, setSelectedCollege] = useState('all');

  useEffect(() => {
    if (isOpen && initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // College lookup map
  const collegeMap = useMemo(() => {
    const map = new Map<string, CollegeInfo>();
    for (const c of colleges) {
      map.set(c.id.toString(), c);
      map.set(c.name.toLowerCase(), c);
    }
    return map;
  }, [colleges]);

  // Transform branches into clean FeeStructure items
  const feeItems = useMemo<FeeStructureItem[]>(() => {
    return branches.map((b) => {
      let feeAmount = 0;
      const numMatch = (b.fees || '').match(/(\d[\d,]*)/);
      if (numMatch) {
        feeAmount = parseInt(numMatch[1].replace(/,/g, ''), 10);
      }

      let feePeriod = 'Per Annum';
      if (/per\s*sem(?:ester)?/i.test(b.fees || '')) {
        feePeriod = 'Per Semester';
      } else if (/per\s*year|per\s*annum|annual/i.test(b.fees || '')) {
        feePeriod = 'Per Annum';
      }

      const feeFormatted = feeAmount > 0 
        ? `₹${feeAmount.toLocaleString('en-IN')}` 
        : (b.fees || 'Official SOU Fee Structure');

      let collegeName = 'Silver Oak University';
      let collegeAbbr = 'SOU';
      let collegeId = 11;

      if (b.colleges && b.colleges.length > 0) {
        collegeName = b.colleges[0].name;
        collegeAbbr = b.colleges[0].abbreviation || 'SOU';
        collegeId = typeof b.colleges[0].id === 'number' ? b.colleges[0].id : parseInt(String(b.colleges[0].id), 10) || 11;
      } else if (b.college_id) {
        collegeId = typeof b.college_id === 'number' ? b.college_id : parseInt(String(b.college_id), 10) || 11;
        const matched = collegeMap.get(collegeId.toString());
        if (matched) {
          collegeName = matched.display_name || matched.name;
          collegeAbbr = matched.abbreviation || 'SOU';
        }
      }

      let degreeLevel = 'Degree';
      if (/bachelor|b\.tech|bca|bba|b\.com|bsc|bpt/i.test(b.title)) degreeLevel = 'Bachelor';
      else if (/master|mca|mba|m\.tech|msc|m\.com|mpt/i.test(b.title)) degreeLevel = 'Master';
      else if (/diploma|gnm/i.test(b.title)) degreeLevel = 'Diploma';
      else if (/ph\.?d|doctoral/i.test(b.title)) degreeLevel = 'Doctoral';
      else if (/b\.?voc|m\.?voc/i.test(b.title)) degreeLevel = 'Vocational';

      let duration = b.duration || '3 Years';
      let semesters = b.semesters || '6 Semesters';
      if (!semesters || semesters === 'N/A') {
        const yrMatch = duration.match(/(\d+(?:\.\d+)?)\s*Year/i);
        if (yrMatch) {
          semesters = `${Math.round(parseFloat(yrMatch[1]) * 2)} Semesters`;
        }
      }

      return {
        id: b.slug || b.title,
        slug: b.slug,
        title: b.title,
        collegeId,
        collegeName,
        collegeAbbr,
        degreeLevel,
        degreeType: b.credential || b.degreeType,
        category: degreeLevel,
        duration,
        semesters,
        eligibility: b.eligibility || 'Check official Silver Oak University admission criteria',
        feeRaw: b.fees || 'Official SOU Fee Structure',
        feeAmount,
        feeFormatted,
        feePeriod,
        sourceUrl: b.url || 'https://silveroakuni.ac.in/program-offered',
        syllabusUrl: b.teachingScheme,
        lastVerifiedAt: b.lastCrawled || b.lastVerifiedAt || new Date().toISOString()
      };
    });
  }, [branches, collegeMap]);

  // Filtered fee items
  const filteredItems = useMemo(() => {
    return feeItems.filter((item) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullText = `${item.title} ${item.slug} ${item.collegeName} ${item.collegeAbbr} ${item.degreeLevel}`.toLowerCase();
        
        // Exact abbreviation checks
        if (q === 'mca' && (item.title.toLowerCase().includes('mca') || item.slug.includes('mca'))) return true;
        if (q === 'bca' && (item.title.toLowerCase().includes('bca') || item.slug.includes('bca'))) return true;
        if (q === 'bba' && (item.title.toLowerCase().includes('bba') || item.slug.includes('bba'))) return true;
        if (q === 'mba' && (item.title.toLowerCase().includes('mba') || item.slug.includes('mba'))) return true;
        if ((q === 'b.tech' || q === 'btech') && item.title.toLowerCase().includes('b.tech')) return true;
        if ((q === 'b.com' || q === 'bcom') && item.title.toLowerCase().includes('b.com')) return true;

        const words = q.split(/\s+/).filter(Boolean);
        if (!words.every(w => fullText.includes(w))) return false;
      }

      // 2. Degree Level
      if (selectedDegree !== 'all') {
        if (item.degreeLevel.toLowerCase() !== selectedDegree.toLowerCase()) return false;
      }

      // 3. College Filter
      if (selectedCollege !== 'all') {
        if (item.collegeId.toString() !== selectedCollege) return false;
      }

      return true;
    }).sort((a, b) => a.title.localeCompare(b.title));
  }, [feeItems, searchQuery, selectedDegree, selectedCollege]);

  if (!isOpen) return null;

  const isDark = theme === 'dark' && !highContrast;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div 
        className={`relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl shadow-xl overflow-hidden border transition-all ${
          highContrast
            ? 'bg-black text-white border-yellow-400'
            : isDark
              ? 'bg-[#0a1426] text-slate-100 border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.6)]'
              : 'bg-white text-slate-900 border-slate-200'
        }`}
      >
        {/* Clean Modal Header (PART 21 & 22) */}
        <div className={`px-4 sm:px-6 py-3.5 sm:py-4.5 border-b flex items-center justify-between shrink-0 ${
          highContrast ? 'bg-zinc-900 border-yellow-400/40' : isDark ? 'bg-blue-950/30 border-white/10' : 'bg-slate-50/80 border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>Fee Structure</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Official SOU
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Transparent tuition fees and duration for Silver Oak University programmes (silveroakuni.ac.in)
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Controls Bar */}
        <div className={`p-4 border-b space-y-3 shrink-0 ${
          highContrast ? 'bg-zinc-950 border-zinc-800' : isDark ? 'bg-[#081222] border-white/5' : 'bg-white border-slate-100'
        }`}>
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search programme or course (e.g. BCA, MCA, B.Tech CSE, MBA, B.Com, B.Pharm)..."
              className={`w-full pl-10 pr-20 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none transition-all ${
                highContrast
                  ? 'bg-zinc-900 border-yellow-400 text-white focus:ring-1 focus:ring-yellow-400'
                  : isDark
                    ? 'bg-slate-900/80 border-white/15 text-white placeholder-slate-500 focus:border-blue-400'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filters Row: Degree Level Tabs & College Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Degree Segmented Controls */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {DEGREE_FILTERS.map((deg) => (
                <button
                  key={deg.id}
                  onClick={() => setSelectedDegree(deg.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedDegree === deg.id
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : isDark
                        ? 'text-slate-400 hover:text-white hover:bg-white/5'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {deg.label}
                </button>
              ))}
            </div>

            {/* College Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-slate-400 hidden lg:inline shrink-0">College:</span>
              <select
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                className={`w-full sm:w-auto px-3 py-1.5 rounded-lg border text-xs font-medium focus:outline-none cursor-pointer truncate max-w-full ${
                  isDark ? 'bg-slate-900 border-white/15 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-700'
                }`}
              >
                <option value="all">All 17 Colleges</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.abbreviation ? `${c.abbreviation} - ` : ''}{c.display_name || c.name}
                  </option>
                ))}
              </select>

              {(searchQuery || selectedDegree !== 'all' || selectedCollege !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDegree('all');
                    setSelectedCollege('all');
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body / Results List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Showing {filteredItems.length} official programmes</span>
            <span>Government Scholarships: MYSY, Digital Gujarat accepted</span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500 border border-dashed border-slate-300 dark:border-white/10 rounded-2xl">
              <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No programmes found matching your search</p>
              <p className="mt-1 text-slate-500">Try searching for BCA, MCA, B.Tech, MBA, or clear filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    highContrast
                      ? 'bg-zinc-900 border-zinc-700 text-white'
                      : isDark
                        ? 'bg-[#0d1b32]/80 border-white/10 hover:border-blue-500/40 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Top Row: Programme Name & Degree Type */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {item.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                        {item.degreeLevel}
                      </span>
                    </div>

                    {/* College & Department */}
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {item.collegeName}
                    </div>

                    {/* Key Attributes Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-white/5 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Duration</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.duration}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Semesters</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.semesters}</span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-slate-400 text-[11px] block">Official Tuition</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          {item.feeFormatted}
                        </span>
                      </div>
                    </div>

                    {/* Eligibility text */}
                    {item.eligibility && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-1">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Eligibility:</span> {item.eligibility}
                      </p>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <button
                      onClick={() => {
                        onClose();
                        onAskAboutProgram(`What is the fee structure, eligibility criteria, and syllabus for ${item.title} at Silver Oak University?`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ask AI Assistant</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {item.syllabusUrl && (
                        <a
                          href={item.syllabusUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium inline-flex items-center gap-1"
                          title="Official Syllabus PDF"
                        >
                          <span>Syllabus</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium inline-flex items-center gap-1"
                        title="View official university webpage"
                      >
                        <span>Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
