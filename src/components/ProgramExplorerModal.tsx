import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Search, 
  GraduationCap, 
  ExternalLink, 
  FileText, 
  Clock, 
  IndianRupee, 
  CheckCircle,
  MessageSquare,
  Building2, 
  RotateCcw, 
  ChevronRight,
  Info,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { UniversityBranch, CollegeInfo } from '../types';
import { 
  normalizeProgrammes, 
  getFilteredProgrammes, 
  NormalizedProgram,
  DegreeFilterOption 
} from '../utils/programFilter';

interface ProgramExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: UniversityBranch[];
  colleges: CollegeInfo[];
  onAskAboutProgram: (programName: string) => void;
  initialTab?: 'programs' | 'colleges';
  theme?: 'light' | 'dark';
  highContrast?: boolean;
}

export const ProgramExplorerModal: React.FC<ProgramExplorerModalProps> = ({
  isOpen,
  onClose,
  branches,
  colleges,
  onAskAboutProgram,
  initialTab = 'programs',
  theme = 'light',
  highContrast = false
}) => {
  const [activeTab, setActiveTab] = useState<'programs' | 'colleges'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDegree, setSelectedDegree] = useState<DegreeFilterOption>('all');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [collegeSearchQuery, setCollegeSearchQuery] = useState('');

  // Selected programme for Programme Detail View (Section 10)
  const [selectedProgramDetail, setSelectedProgramDetail] = useState<NormalizedProgram | null>(null);

  // Sync initial tab when opened
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // 1. Data normalization layer & deduplication
  const normalizedAll = useMemo(() => {
    return normalizeProgrammes(branches, colleges);
  }, [branches, colleges]);

  // 2. Dynamic counts for degree options
  const degreeCounts = useMemo(() => {
    let bachelor = 0;
    let master = 0;
    let diploma = 0;
    let doctor = 0;
    let phd = 0;
    let pharmd = 0;

    for (const p of normalizedAll) {
      if (p.degreeLevel === 'Bachelor') bachelor++;
      if (p.degreeLevel === 'Master') master++;
      if (p.degreeLevel === 'Diploma') diploma++;
      if (p.isDoctor) doctor++;
      if (p.isPhD) phd++;
      if (p.isPharmD) pharmd++;
    }

    return { bachelor, master, diploma, doctor, phd, pharmd };
  }, [normalizedAll]);

  // Dynamic specific degrees
  const specificDegrees = useMemo(() => {
    const degMap = new Map<string, number>();
    for (const p of normalizedAll) {
      const d = p.degreeType || 'Other';
      if (d && d !== 'Other') {
        degMap.set(d, (degMap.get(d) || 0) + 1);
      }
    }
    return Array.from(degMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [normalizedAll]);

  // Dynamic counts for constituent colleges
  const collegeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of normalizedAll) {
      const key = p.collegeId.toString();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [normalizedAll]);

  // 4. Central combined filtering function for programmes
  const filteredPrograms = useMemo(() => {
    return getFilteredProgrammes(normalizedAll, searchQuery, selectedDegree, selectedCollege);
  }, [normalizedAll, searchQuery, selectedDegree, selectedCollege]);

  // 5. Filtered colleges for College Explorer (Section 9)
  const filteredColleges = useMemo(() => {
    const q = collegeSearchQuery.trim().toLowerCase();
    if (!q) return colleges;
    return colleges.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.abbreviation.toLowerCase().includes(q) ||
      (c.display_name && c.display_name.toLowerCase().includes(q))
    );
  }, [colleges, collegeSearchQuery]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDegree('all');
    setSelectedCollege('all');
  };

  const handleSelectCollegeToBrowse = (collegeId: string | number) => {
    setSelectedCollege(collegeId.toString());
    setActiveTab('programs');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedDegree !== 'all' || selectedCollege !== 'all';
  const selectedCollegeObj = colleges.find(c => c.id.toString() === selectedCollege);

  const isDark = theme === 'dark' && !highContrast;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div 
        className={`relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl shadow-xl overflow-hidden border transition-all ${
          highContrast
            ? 'bg-black text-white border-yellow-400'
            : isDark
              ? 'bg-[#0a1426] text-slate-100 border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.6)]'
              : 'bg-white text-slate-900 border-slate-200'
        }`}
      >
        {/* Modal Header */}
        <div className={`px-4 sm:px-6 py-3.5 sm:py-4.5 border-b flex items-center justify-between shrink-0 ${
          highContrast ? 'bg-zinc-900 border-yellow-400/40' : isDark ? 'bg-blue-950/30 border-white/10' : 'bg-slate-50/80 border-slate-200'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  Silver Oak University Catalogue
                </h2>
                <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
                  Official SOU
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Official listing of {normalizedAll.length} programmes across {colleges.length} constituent colleges
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
            title="Close modal"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explorer Tabs Switcher */}
        <div className={`px-4 sm:px-6 pt-2.5 sm:pt-3 border-b shrink-0 flex items-center gap-2 ${
          highContrast ? 'bg-zinc-950 border-zinc-800' : isDark ? 'bg-[#081222] border-white/5' : 'bg-slate-50/60 border-slate-100'
        }`}>
          <button
            onClick={() => setActiveTab('programs')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'programs'
                ? 'bg-blue-600 text-white shadow-xs'
                : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Programmes Explorer ({normalizedAll.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('colleges')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'colleges'
                ? 'bg-blue-600 text-white shadow-xs'
                : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Constituent Colleges ({colleges.length})</span>
          </button>
        </div>

        {/* Tab 1: Programmes Explorer (Section 8) */}
        {activeTab === 'programs' && (
          <>
            {/* Filter Toolbar */}
            <div className={`p-4 sm:px-6 border-b space-y-3 shrink-0 ${
              highContrast ? 'bg-zinc-950 border-zinc-800' : isDark ? 'bg-[#081222] border-white/5' : 'bg-white border-slate-100'
            }`}>
              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search programmes (BCA, B.Tech, MBA, MCA, Pharmacy, Nursing, Law)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title="Clear search"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Degrees Filter */}
              <div className="flex gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                <select
                  value={selectedDegree}
                  onChange={(e) => setSelectedDegree(e.target.value)}
                  className={`px-3 py-2 text-xs rounded-xl border focus:outline-none cursor-pointer flex-1 sm:flex-none min-w-0 font-medium ${
                    isDark
                      ? 'bg-slate-900 border-white/15 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-700'
                  }`}
                  title="Filter by degree level"
                >
                  <option value="all">All Degrees ({normalizedAll.length})</option>
                  
                  <optgroup label="Degree Levels">
                    <option value="Bachelor">Bachelor ({degreeCounts.bachelor})</option>
                    <option value="Master">Master ({degreeCounts.master})</option>
                    <option value="Diploma">Diploma ({degreeCounts.diploma})</option>
                    <option value="Doctor">Doctor ({degreeCounts.doctor})</option>
                    <option value="PhD">Ph.D ({degreeCounts.phd})</option>
                    <option value="PharmD">Pharm.D ({degreeCounts.pharmd})</option>
                  </optgroup>

                  {specificDegrees.length > 0 && (
                    <optgroup label="Programmes by Degree">
                      {specificDegrees.map((sd) => (
                        <option key={sd.name} value={sd.name}>
                          {sd.name} ({sd.count})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {/* College Filter */}
                <select
                  value={selectedCollege}
                  onChange={(e) => setSelectedCollege(e.target.value)}
                  className={`px-3 py-2 text-xs rounded-xl border focus:outline-none cursor-pointer flex-1 sm:flex-none min-w-0 max-w-full sm:max-w-[240px] truncate font-medium ${
                    isDark
                      ? 'bg-slate-900 border-white/15 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-700'
                  }`}
                  title="Filter by constituent college"
                >
                  <option value="all">All Colleges ({colleges.length})</option>
                  {colleges.map((col) => {
                    const count = collegeCounts.get(col.id.toString()) || 0;
                    return (
                      <option key={col.id} value={col.id.toString()}>
                        {col.abbreviation ? `${col.abbreviation} - ` : ''}{col.name} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Dynamic Results Status Bar */}
            <div className={`px-4 sm:px-6 py-2 border-b text-xs flex flex-wrap justify-between items-center gap-2 shrink-0 ${
              highContrast 
                ? 'bg-zinc-900 border-zinc-800 text-slate-300' 
                : isDark 
                  ? 'bg-white/[0.02] border-white/5 text-slate-400' 
                  : 'bg-slate-50/80 border-slate-100 text-slate-600'
            }`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span>
                  Showing <strong className={isDark ? 'text-white' : 'text-slate-900'}>{filteredPrograms.length}</strong> of {normalizedAll.length} programmes
                </span>

                {hasActiveFilters && (
                  <div className={`flex items-center gap-1.5 flex-wrap pl-2 border-l ${isDark ? 'border-white/10' : 'border-slate-300'}`}>
                    {searchQuery.trim() && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        isDark ? 'bg-blue-950/60 text-blue-300 border border-blue-500/30' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        Search: &ldquo;{searchQuery.trim()}&rdquo;
                        <button
                          onClick={() => setSearchQuery('')}
                          className="hover:opacity-75 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {selectedDegree !== 'all' && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        isDark ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30' : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        Degree: {selectedDegree}
                        <button
                          onClick={() => setSelectedDegree('all')}
                          className="hover:opacity-75 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {selectedCollege !== 'all' && selectedCollegeObj && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium max-w-[200px] truncate ${
                        isDark ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        College: {selectedCollegeObj.abbreviation || selectedCollegeObj.name}
                        <button
                          onClick={() => setSelectedCollege('all')}
                          className="hover:opacity-75 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset filters</span>
                </button>
              )}
            </div>

            {/* Programmes List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {filteredPrograms.length === 0 ? (
                <div className={`py-16 px-4 text-center text-xs border border-dashed rounded-2xl ${
                  highContrast 
                    ? 'bg-zinc-900 border-zinc-700 text-slate-400' 
                    : isDark 
                      ? 'border-white/10 text-slate-400' 
                      : 'border-slate-300 text-slate-500'
                }`}>
                  <GraduationCap className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                  <p className="font-bold text-base text-slate-800 dark:text-slate-200">No programmes found matching your filters</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    No university course records matched the combination of search query, degree level, and college.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Show All Programmes ({normalizedAll.length})</span>
                  </button>
                </div>
              ) : (
                filteredPrograms.map((program) => (
                  <div
                    key={program.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      highContrast
                        ? 'bg-zinc-900 border-zinc-700 text-white'
                        : isDark
                          ? 'bg-[#0d1b32]/80 border-white/10 hover:border-blue-500/40 shadow-xs text-slate-100'
                          : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs text-slate-900'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                          {program.name}
                        </h3>
                        {program.credential ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {program.credential}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                            {program.programmeType}
                          </span>
                        )}

                        {program.degreeLevel && program.degreeLevel !== 'Other' && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                            {program.degreeLevel}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-400 mt-2">
                        {program.fees && (
                          <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                            <IndianRupee className="w-3.5 h-3.5 shrink-0" />
                            <span>{program.fees}</span>
                          </div>
                        )}

                        {program.duration && (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{program.duration} {program.semesters ? `(${program.semesters} Sem)` : ''}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 truncate" title={program.collegeName}>
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium">
                            {program.collegeName}
                          </span>
                        </div>
                      </div>

                      {program.eligibility && (
                        <p className={`text-[11px] mt-2 line-clamp-1 p-1.5 rounded border ${
                          isDark ? 'bg-white/5 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'
                        }`}>
                          <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>Eligibility:</strong> {program.eligibility}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5">
                      {/* View Details Button */}
                      <button
                        onClick={() => setSelectedProgramDetail(program)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                          isDark 
                            ? 'bg-blue-600/15 border-blue-500/30 text-blue-400 hover:bg-blue-600/25' 
                            : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                        }`}
                        title="View complete programme details"
                      >
                        <Info className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                        <span>View Details</span>
                      </button>

                      {/* Ask AI Button */}
                      <button
                        onClick={() => {
                          onAskAboutProgram(`What is the fee, eligibility and syllabus for ${program.name}?`);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                        title="Ask AI Assistant about this programme"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Ask AI</span>
                      </button>

                      {/* Official Link */}
                      {program.officialUrl && (
                        <a
                          href={program.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors pt-0.5"
                          title="Open official university webpage"
                        >
                          <span>Official Portal</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Tab 2: Constituent Colleges Explorer (Section 9) */}
        {activeTab === 'colleges' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* Search Colleges input */}
            <div className="mb-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search constituent colleges (e.g. SOCCA, Engineering, Science, Pharmacy, Management, Law)..."
                  value={collegeSearchQuery}
                  onChange={(e) => setCollegeSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-20 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none transition-all ${
                    highContrast
                      ? 'bg-zinc-900 border-yellow-400 text-white focus:ring-1 focus:ring-yellow-400'
                      : isDark
                        ? 'bg-slate-900/80 border-white/15 text-white placeholder-slate-500 focus:border-blue-400'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600'
                  }`}
                />
                {collegeSearchQuery && (
                  <button
                    onClick={() => setCollegeSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Colleges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredColleges.map((col) => {
                const count = collegeCounts.get(col.id.toString()) || 0;
                return (
                  <div
                    key={col.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      highContrast
                        ? 'bg-zinc-900 border-zinc-700 text-white'
                        : isDark
                          ? 'bg-[#0d1b32]/80 border-white/10 hover:border-blue-500/40 shadow-xs text-slate-100'
                          : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs text-slate-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {col.abbreviation || 'SOU'}
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {count} Programmes
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                        {col.display_name || col.name}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        Constituent institute of Silver Oak University offering undergraduate, postgraduate, and diploma degrees.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleSelectCollegeToBrowse(col.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        <span>View Programmes</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onAskAboutProgram(`What courses are offered at ${col.name} and what is the admission process?`);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                          title="Ask AI about this college"
                        >
                          Ask AI
                        </button>

                        {col.external_website_url && (
                          <a
                            href={col.external_website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="Official college webpage"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className={`px-4 sm:px-6 py-3 sm:py-3.5 border-t flex items-center justify-between text-xs shrink-0 ${
          highContrast ? 'bg-zinc-950 border-zinc-800 text-slate-300' : isDark ? 'bg-[#081222] border-white/10 text-slate-400' : 'bg-slate-50/80 border-slate-200 text-slate-500'
        }`}>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Verified official Silver Oak University course catalogue</span>
          </span>
          <button
            onClick={onClose}
            className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer border ${
              isDark 
                ? 'bg-white/10 hover:bg-white/15 border-white/15 text-slate-200' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}
          >
            Close
          </button>
        </div>

      </div>

      {/* Programme Detail View Modal (Section 10) */}
      {selectedProgramDetail && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border flex flex-col max-h-[85vh] transition-all ${
            highContrast
              ? 'bg-black text-white border-yellow-400'
              : isDark
                ? 'bg-[#0a1426] text-slate-100 border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.6)]'
                : 'bg-white text-slate-900 border-slate-200'
          }`}>
            
            {/* Detail Header */}
            <div className={`px-4 sm:px-6 py-3.5 sm:py-4.5 border-b flex items-start justify-between gap-3 shrink-0 ${
              highContrast ? 'bg-zinc-900 border-yellow-400/40' : isDark ? 'bg-blue-950/30 border-white/10' : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {selectedProgramDetail.degreeType || selectedProgramDetail.programmeType}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1.5 truncate">
                  {selectedProgramDetail.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {selectedProgramDetail.collegeName}
                </p>
              </div>

              <button
                onClick={() => setSelectedProgramDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Detail Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              
              {/* College & Degree Level */}
              <div className={`grid grid-cols-2 gap-3 p-3.5 rounded-xl border ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Constituent College</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedProgramDetail.collegeName}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Academic Level</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedProgramDetail.degreeLevel}</p>
                </div>
              </div>

              {/* Duration & Semesters */}
              {(selectedProgramDetail.duration || selectedProgramDetail.semesters) && (
                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Duration & Structure</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedProgramDetail.duration || 'Standard academic duration'} 
                    {selectedProgramDetail.semesters ? ` (${selectedProgramDetail.semesters} Semesters)` : ''}
                  </p>
                </div>
              )}

              {/* Tuition Fees */}
              {selectedProgramDetail.fees && (
                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-emerald-950/30 border-emerald-500/20' : 'bg-emerald-50/70 border-emerald-200'
                }`}>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Official Tuition Fees</span>
                  <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {selectedProgramDetail.fees}
                  </p>
                </div>
              )}

              {/* Eligibility */}
              {selectedProgramDetail.eligibility && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Eligibility Criteria</span>
                  </h4>
                  <p className={`p-3 rounded-xl border leading-relaxed ${
                    isDark ? 'bg-white/[0.03] border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    {selectedProgramDetail.eligibility}
                  </p>
                </div>
              )}

              {/* Syllabus / Teaching Scheme */}
              {selectedProgramDetail.teachingScheme && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    <span>Curriculum & Teaching Scheme</span>
                  </h4>
                  <a
                    href={selectedProgramDetail.teachingScheme.startsWith('http') ? selectedProgramDetail.teachingScheme : `https://sapiou.silveroakuni.ac.in${selectedProgramDetail.teachingScheme}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border font-semibold text-xs transition-colors ${
                      isDark ? 'bg-blue-600/15 border-blue-500/30 text-blue-400 hover:bg-blue-600/25' : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>Download Official Syllabus PDF</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Official Source Link */}
              {selectedProgramDetail.officialUrl && (
                <div className="pt-2">
                  <a
                    href={selectedProgramDetail.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    <span>Open Official Programme Webpage</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

            </div>

            {/* Detail Actions */}
            <div className={`px-4 sm:px-6 py-3.5 border-t flex items-center justify-between gap-2 shrink-0 ${
              highContrast ? 'bg-zinc-950 border-zinc-800' : isDark ? 'bg-[#081222] border-white/10' : 'bg-slate-50/80 border-slate-200'
            }`}>
              <button
                onClick={() => {
                  onAskAboutProgram(`What is the fee, eligibility, syllabus and admission process for ${selectedProgramDetail.name}?`);
                  setSelectedProgramDetail(null);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask AI About This Course</span>
              </button>

              <button
                onClick={() => setSelectedProgramDetail(null)}
                className={`px-3.5 py-2 rounded-xl border font-semibold text-xs transition-colors cursor-pointer ${
                  isDark 
                    ? 'bg-white/10 hover:bg-white/15 border-white/15 text-slate-200' 
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                }`}
              >
                Back to Directory
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
