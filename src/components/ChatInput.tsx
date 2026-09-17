import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  activeLanguage: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  activeLanguage
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getPlaceholder = () => {
    switch (activeLanguage) {
      case 'ગુજરાતી':
        return 'સિલ્વર ઓક યુનિવર્સિટી વિશે પ્રશ્ન પૂછો (દા.ત. BCA સેમેસ્ટર 4 ની પરીક્ષા, B.Tech ફી...)...';
      case 'हिन्दी':
        return 'सिल्वर ओक यूनिवर्सिटी के बारे में पूछें (उदा. बीटेक कंप्यूटर फीस, एडमिशन प्रोसेस, एग्जाम...)...';
      default:
        return 'Ask anything about courses, admissions, fees, Summer 2026 exam timetables, syllabus...';
    }
  };

  return (
    <div className="bg-white border-t border-slate-200 p-3 sm:p-4 sticky bottom-0 z-20 shadow-lg">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-slate-50 border border-slate-300 rounded-xl p-1.5 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={isLoading}
            className="flex-1 max-h-40 min-h-[44px] p-2.5 bg-transparent border-0 text-slate-900 placeholder:text-slate-400 text-sm sm:text-[15px] resize-none focus:outline-none leading-relaxed"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              !input.trim() || isLoading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-[#062051] hover:bg-blue-900 text-amber-400 shadow-sm active:scale-95'
            }`}
            title="Send message (Enter)"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 mt-1.5">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Grounds on official Silver Oak University syllabus, fees & Summer 2026 exam timetables
          </span>
          <span className="hidden sm:inline">
            Press <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px]">Enter ↵</kbd> to send, <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px]">Shift + Enter</kbd> for new line
          </span>
        </div>
      </div>
    </div>
  );
};
