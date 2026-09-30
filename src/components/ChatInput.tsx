import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, Mic, MicOff } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  activeLanguage: string;
  theme?: 'light' | 'dark';
  highContrast?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  activeLanguage,
  theme = 'light',
  highContrast = false
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicNotice('Voice input is not supported in this browser.');
      setTimeout(() => setMicNotice(null), 3000);
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
      recognition.lang = activeLanguage === 'हिन्दी' ? 'hi-IN' : activeLanguage === 'ગુજરાતી' ? 'gu-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setMicNotice('Listening... Speak your question now');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          setIsListening(false);
          setMicNotice(null);
          onSendMessage(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error in chat input:', event.error);
        setIsListening(false);
        setMicNotice(event.error === 'not-allowed' ? 'Microphone access denied in browser' : 'Listening timed out');
        setTimeout(() => setMicNotice(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e: any) {
      setIsListening(false);
      setMicNotice('Microphone error');
      setTimeout(() => setMicNotice(null), 3000);
    }
  };

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
        return 'Ask anything about Silver Oak University (programmes, fees, syllabus, Summer 2026 exams)...';
    }
  };

  const isDark = theme === 'dark' && !highContrast;

  const dockBgClass = highContrast
    ? 'bg-black border-yellow-400 text-white'
    : isDark
      ? 'bg-[#06142e]/85 backdrop-blur-xl border-blue-400/20 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] text-slate-100'
      : 'bg-white border-slate-200 shadow-lg text-slate-900';

  const formBgClass = highContrast
    ? 'bg-zinc-900 border-yellow-400'
    : isDark
      ? 'bg-slate-900/75 backdrop-blur-lg border-white/15 focus-within:border-amber-400/60 focus-within:ring-2 focus-within:ring-amber-400/20 shadow-inner'
      : 'bg-slate-50 border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20';

  return (
    <div className={`${dockBgClass} border-t p-3 sm:p-4 sticky bottom-0 z-20 transition-all duration-300`}>
      <div className="max-w-4xl mx-auto">
        <form 
          onSubmit={handleSubmit} 
          className={`relative flex items-end gap-2 ${formBgClass} border rounded-xl p-1.5 transition-all`}
        >
          
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={isLoading}
            className={`flex-1 max-h-40 min-h-[44px] p-2.5 bg-transparent border-0 ${
              highContrast ? 'text-white placeholder:text-zinc-500' : isDark ? 'text-slate-100 placeholder:text-slate-400' : 'text-slate-900 placeholder:text-slate-400'
            } text-sm sm:text-[15px] resize-none focus:outline-none leading-relaxed`}
          />

          {/* Voice Microphone Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : (highContrast 
                    ? 'text-yellow-400 hover:bg-zinc-800' 
                    : isDark ? 'text-slate-400 hover:text-amber-300 hover:bg-white/10' : 'text-slate-400 hover:text-blue-700 hover:bg-slate-200/60')
            }`}
            title={isListening ? 'Stop listening' : 'Voice input (Speech Recognition)'}
            aria-label="Voice input"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              !input.trim() || isLoading
                ? (isDark ? 'bg-slate-800 text-slate-600 border border-white/5 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed')
                : (highContrast 
                    ? 'bg-yellow-400 hover:bg-yellow-300 text-black font-bold' 
                    : isDark 
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)] active:scale-95 cursor-pointer' 
                      : 'bg-[#062051] hover:bg-blue-900 text-amber-400 shadow-sm active:scale-95 cursor-pointer')
            }`}
            title="Send message (Enter)"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>

        {micNotice && (
          <div className={`mt-2 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
            isDark ? 'text-amber-300 bg-amber-950/40 border border-amber-500/30' : 'text-amber-800 bg-amber-50 border border-amber-200'
          }`}>
            <Mic className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>{micNotice}</span>
          </div>
        )}

        <div className={`flex items-center justify-between text-[11px] px-1 mt-1.5 min-w-0 ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <span className="flex items-center gap-1 min-w-0 truncate">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">Official SOU syllabus, fees & exams grounded</span>
          </span>
          <span className="hidden sm:inline">
            Press <kbd className={`px-1 py-0.5 border rounded text-[10px] ${
              isDark ? 'bg-white/10 border-white/15 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>Enter ↵</kbd> to send, <kbd className={`px-1 py-0.5 border rounded text-[10px] ${
              isDark ? 'bg-white/10 border-white/15 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>Shift + Enter</kbd> for new line
          </span>
        </div>
      </div>
    </div>
  );
};
