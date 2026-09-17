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
  Building2
} from 'lucide-react';
import { UniversityBranch, CollegeInfo } from '../types';

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
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [selectedDegree, setSelectedDegree] = useState('all');

  const filteredBranches = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return branches.filter((b) => {
      const matchesSearch = !q || 
        b.title.toLowerCase().includes(q) ||
        (b.slug && b.slug.toLowerCase().includes(q)) ||
        (b.eligibility && b.eligibility.toLowerCase().includes(q)) ||
        (b.credential && b.credential.toLowerCase().includes(q));

      const matchesCollege = selectedCollege === 'all' || 
        (b.college_id && b.college_id.toString() === selectedCollege);

      const matchesDegree = selectedDegree === 'all' ||
        (b.credential && b.credential.toLowerCase().includes(selectedDegree.toLowerCase())) ||
        (b.title && b.title.toLowerCase().startsWith(selectedDegree.toLowerCase()));

      return matchesSearch && matchesCollege && matchesDegree;
    });
  }, [branches, searchQuery, selectedCollege, selectedDegree]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#062051] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Silver Oak University Programmes Directory
              </h2>
              <p className="text-xs text-blue-200">
                Official listing of {branches.length} programs across {colleges.length} constituent colleges
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-2.5 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by degree (BCA, B.Tech, MBA, Pharmacy, Nursing, Law)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedDegree}
              onChange={(e) => setSelectedDegree(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="all">All Degrees</option>
              <option value="Bachelor">Bachelor / B.Tech / BCA / BBA</option>
              <option value="Master">Master / M.Tech / MCA / MBA</option>
              <option value="Diploma">Diploma</option>
              <option value="Doctor">Doctor / Ph.D / Pharm.D</option>
            </select>

            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 max-w-[200px] truncate"
            >
              <option value="all">All Colleges ({colleges.length})</option>
              {colleges.map((col) => (
                <option key={col.id} value={col.id.toString()}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Programs Count Bar */}
        <div className="px-4 py-2 bg-slate-100/60 border-b border-slate-200/80 text-xs text-slate-600 flex justify-between items-center shrink-0">
          <span>Showing <strong>{filteredBranches.length}</strong> of {branches.length} programmes</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-blue-600 hover:underline font-medium"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Programs List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredBranches.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <GraduationCap className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-sm">No programmes matched your filter</p>
              <p className="text-xs text-slate-400 mt-0.5">Try searching for &apos;Computer&apos;, &apos;Engineering&apos;, &apos;Design&apos;, or &apos;Pharmacy&apos;</p>
            </div>
          ) : (
            filteredBranches.map((branch, idx) => (
              <div
                key={branch.slug || idx}
                className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-bold text-[#062051]">
                      {branch.title}
                    </h3>
                    {branch.credential && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                        {branch.credential}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 mt-2">
                    {branch.fees && (
                      <div className="flex items-center gap-1.5 font-medium text-emerald-700">
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>{branch.fees}</span>
                      </div>
                    )}

                    {branch.duration && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{branch.duration} {branch.semesters ? `(${branch.semesters} Sem)` : ''}</span>
                      </div>
                    )}

                    {branch.college_id && (
                      <div className="flex items-center gap-1.5 text-slate-500 truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {colleges.find(c => c.id.toString() === branch.college_id?.toString())?.name || `College #${branch.college_id}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {branch.eligibility && (
                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 bg-slate-50 p-1.5 rounded border border-slate-100">
                      <strong>Eligibility:</strong> {branch.eligibility}
                    </p>
                  )}
                </div>

                {/* Program Action Buttons */}
                <div className="flex sm:flex-col items-center sm:items-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    onClick={() => {
                      onAskAboutProgram(`What is the fee, eligibility and syllabus for ${branch.title}?`);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#062051] hover:bg-blue-900 text-amber-400 text-xs font-semibold transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Ask AI</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {branch.slug && (
                      <a
                        href={branch.url || `https://silveroakuni.ac.in/branches/${branch.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-slate-100 text-xs"
                        title="Open official university webpage"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {branch.teachingScheme && (
                      <a
                        href={branch.teachingScheme.startsWith('http') ? branch.teachingScheme : `https://sapiou.silveroakuni.ac.in${branch.teachingScheme}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs"
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
            Live data synchronized from official Silver Oak University APIs
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
