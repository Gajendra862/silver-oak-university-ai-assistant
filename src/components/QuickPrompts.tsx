import React from 'react';
import { Sparkles, Calendar, BookOpen, GraduationCap, Languages, HelpCircle } from 'lucide-react';

interface QuickPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

interface PromptCategory {
  category: string;
  icon: React.ReactNode;
  prompts: string[];
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelectPrompt }) => {
  const categories: PromptCategory[] = [
    {
      category: 'Admissions & Fees',
      icon: <GraduationCap className="w-3.5 h-3.5 text-blue-600" />,
      prompts: [
        'What is the fee and eligibility for BCA at Silver Oak University?',
        'B.Tech Computer Engineering fees, duration, and admission requirements?',
        'What are the fees and eligibility for MBA and MCA programs?',
        'Does SOU offer Pharmacy (B.Pharm / Pharm.D) or Nursing courses?'
      ]
    },
    {
      category: 'Exam Timetables & Circulars',
      icon: <Calendar className="w-3.5 h-3.5 text-amber-600" />,
      prompts: [
        'When is the BCA Semester 4 Summer 2026 exam and what is the timetable?',
        'Show the B.Tech Semester 4 Summer 2026 exam schedule',
        'What are the official exam rules and seating arrangement portal?'
      ]
    },
    {
      category: 'ગુજરાતી & हिन्दी સવાલો',
      icon: <Languages className="w-3.5 h-3.5 text-emerald-600" />,
      prompts: [
        'સિલ્વર ઓક યુનિવર્સિટીમાં BCA સેમેસ્ટર 4 ની પરીક્ષા ક્યારે છે?',
        'સિલ્વર ઓક યુનિવર્સિટીમાં B.Tech કમ્પ્યુટર એન્જિનિયરિંગની ફી કેટલી છે?',
        'सिल्वर ओक यूनिवर्सिटी में एडमिशन प्रोसेस और हेल्पलाइन नंबर क्या है?'
      ]
    },
    {
      category: 'Campus, Syllabus & Facilities',
      icon: <BookOpen className="w-3.5 h-3.5 text-purple-600" />,
      prompts: [
        'Where is Silver Oak University located and what is the admission helpline?',
        'Show me the BCA syllabus and teaching scheme PDF link',
        'What approvals and accreditations does Silver Oak University hold?'
      ]
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4">
      <div className="text-center mb-5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          Powered by Official Silver Oak University Grounding
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-[#062051]">
          Ask Anything About Silver Oak University
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl mx-auto">
          Instant answers grounded in 107 programs, 17 colleges, official Summer 2026 timetables, syllabus PDFs, and circulars.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {categories.map((cat, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all"
          >
            <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
              {cat.icon}
              <span>{cat.category}</span>
            </div>
            <div className="space-y-1.5">
              {cat.prompts.map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => onSelectPrompt(prompt)}
                  className="w-full text-left text-xs text-slate-700 hover:text-blue-900 p-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 flex items-start gap-1.5 group"
                >
                  <span className="text-amber-500 font-bold group-hover:translate-x-0.5 transition-transform shrink-0">
                    ›
                  </span>
                  <span className="leading-snug">{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
