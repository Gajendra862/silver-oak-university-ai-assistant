import React, { useState, useMemo } from 'react';
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
  Tag
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
}

export const ProgramExplorerModal: React.FC<ProgramExplorerModalProps> = ({
  isOpen,
  onClose,
  branches,
  colleges,
  onAskAboutProgram
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDegree, setSelectedDegree] = useState<DegreeFilterOption>('all');
  const [selectedCollege, setSelectedCollege] = useState('all');

  // 1. Data normalization layer & deduplication
  const normalizedAll = useMemo(() => {
    return normalizeProgrammes(branches, colleges);
  }, [branches, colleges]);

  // 2. Dynamic counts for degree options from the genuine dataset
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

  // 3. Dynamic counts for constituent colleges
  const collegeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of normalizedAll) {
      const key = p.collegeId.toString();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [normalizedAll]);

  // 4. Central combined filtering function
  const filteredPrograms = useMemo(() => {
    return getFilteredProgrammes(normalizedAll, searchQuery, selectedDegree, selectedCollege);
  }, [normalizedAll, searchQuery, selectedDegree, selectedCollege]);

  // 5. Reset filter handler
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDegree('all');
    setSelectedCollege('all');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedDegree !== 'all' || selectedCollege !== 'all';

  if (!isOpen) return null;

  const selectedCollegeObj = colleges.find(c => c.id.toString() === selectedCollege);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#062051] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Silver Oak University Programmes Directory
              </h2>
              <p className="text-xs text-blue-200">
                Official listing of {normalizedAll.length} programmes across {colleges.length} constituent colleges
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Section Filter Toolbar */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-2.5 shrink-0">
          
          {/* BOX 1: Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search programmes (BCA, B.Tech, MBA, Pharmacy, Nursing, Law, Data Science)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Clear search input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            {/* BOX 2: All Degrees / Degree Categories */}
            <select
              value={selectedDegree}
              onChange={(e) => setSelectedDegree(e.target.value as DegreeFilterOption)}
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium cursor-pointer"
              title="Filter by degree level"
            >
              <option value="all">All Degrees ({normalizedAll.length})</option>
              <option value="Bachelor">Bachelor ({degreeCounts.bachelor})</option>
              <option value="Master">Master ({degreeCounts.master})</option>
              <option value="Diploma">Diploma ({degreeCounts.diploma})</option>
              <option value="Doctor">Doctor ({degreeCounts.doctor})</option>
              <option value="PhD">Ph.D ({degreeCounts.phd})</option>
              <option value="PharmD">Pharm.D ({degreeCounts.pharmd})</option>
            </select>

            {/* BOX 3: All Colleges */}
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 max-w-[240px] truncate font-medium cursor-pointer"
              title="Filter by constituent college"
            >
              <option value="all">All Colleges ({colleges.length})</option>
              {colleges.map((col) => {
                const count = collegeCounts.get(col.id.toString()) || 0;
                return (
                  <option key={col.id} value={col.id.toString()}>
                    {col.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Dynamic Count and Active Filter Indicator Bar */}
        <div className="px-4 py-2 bg-slate-100/70 border-b border-slate-200 text-xs text-slate-600 flex flex-wrap justify-between items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Showing <strong>{filteredPrograms.length}</strong> of {normalizedAll.length} programmes
            </span>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="flex items-center gap-1.5 flex-wrap pl-2 border-l border-slate-300">
                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium">
                    Search: &ldquo;{searchQuery.trim()}&rdquo;
                    <button
                      onClick={() => setSearchQuery('')}
                      className="hover:text-blue-900 cursor-pointer"
                      title="Remove search filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedDegree !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
                    Degree: {selectedDegree}
                    <button
                      onClick={() => setSelectedDegree('all')}
                      className="hover:text-amber-950 cursor-pointer"
                      title="Remove degree filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedCollege !== 'all' && selectedCollegeObj && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium max-w-[200px] truncate">
                    College: {selectedCollegeObj.abbreviation || selectedCollegeObj.name}
                    <button
                      onClick={() => setSelectedCollege('all')}
                      className="hover:text-emerald-950 cursor-pointer shrink-0"
                      title="Remove college filter"
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
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer transition-colors"
              title="Reset all filters to default"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          )}
        </div>

        {/* Programmes Result List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredPrograms.length === 0 ? (
            <div className="text-center py-16 px-4 text-slate-500">
              <GraduationCap className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-bold text-base text-slate-700">No programmes found matching your filters</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No university course records matched the combination of search query, degree level, and college.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Show All Programmes ({normalizedAll.length})</span>
              </button>
            </div>
          ) : (
            filteredPrograms.map((program) => (
              <div
                key={program.id}
                className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-bold text-[#062051]">
                      {program.name}
                    </h3>
                    {program.credential ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                        {program.credential}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {program.programmeType}
                      </span>
                    )}

                    {program.degreeLevel && program.degreeLevel !== 'Other' && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {program.degreeLevel}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 mt-2">
                    {program.fees && (
                      <div className="flex items-center gap-1.5 font-medium text-emerald-700">
                        <IndianRupee className="w-3.5 h-3.5 shrink-0" />
                        <span>{program.fees}</span>
                      </div>
                    )}

                    {program.duration && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{program.duration} {program.semesters ? `(${program.semesters} Sem)` : ''}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-slate-600 truncate" title={program.collegeName}>
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-medium text-slate-700">
                        {program.collegeName}
                      </span>
                    </div>
                  </div>

                  {program.eligibility && (
                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 bg-slate-50 p-1.5 rounded border border-slate-100">
                      <strong>Eligibility:</strong> {program.eligibility}
                    </p>
                  )}
                </div>

                {/* Program Action Buttons */}
                <div className="flex sm:flex-col items-center sm:items-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    onClick={() => {
                      onAskAboutProgram(`What is the fee, eligibility and syllabus for ${program.name}?`);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#062051] hover:bg-blue-900 text-amber-400 text-xs font-semibold transition-colors cursor-pointer"
                    title="Ask AI Assistant about this programme"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Ask AI</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {program.officialUrl && (
                      <a
                        href={program.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-slate-100 text-xs transition-colors"
                        title="Open official university webpage"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {program.teachingScheme && (
                      <a
                        href={program.teachingScheme.startsWith('http') ? program.teachingScheme : `https://sapiou.silveroakuni.ac.in${program.teachingScheme}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs transition-colors"
                        title="Download Syllabus / Teaching Scheme PDF"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Verified official Silver Oak University course directory
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
