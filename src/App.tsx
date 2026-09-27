import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ChatMessageItem } from './components/ChatMessage';
import { QuickPrompts } from './components/QuickPrompts';
import { ChatInput } from './components/ChatInput';
import { ProgramExplorerModal } from './components/ProgramExplorerModal';
import { ChatMessage, SystemStatus, UniversityBranch, CollegeInfo } from './types';
import { Loader2, AlertCircle, ArrowDown } from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [explorerTab, setExplorerTab] = useState<'programs' | 'colleges'>('programs');
  const [branches, setBranches] = useState<UniversityBranch[]>([]);
  const [colleges, setColleges] = useState<CollegeInfo[]>([]);
  const [activeLanguage, setActiveLanguage] = useState('Auto');
  const [apiError, setApiError] = useState<string | null>(null);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle scroll detection for Scroll-to-latest button (Section 5)
  const handleScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBottom(isScrolledUp);
  };

  // Fetch initial system status and university catalogue
  useEffect(() => {
    async function loadData() {
      try {
        const [statusRes, branchesRes, collegesRes] = await Promise.all([
          fetch('/api/status'),
          fetch('/api/branches'),
          fetch('/api/colleges')
        ]);

        if (statusRes.ok) {
          const s = await statusRes.json();
          setSystemStatus(s);
        }
        if (branchesRes.ok) {
          const b = await branchesRes.json();
          setBranches(b);
        }
        if (collegesRes.ok) {
          const c = await collegesRes.json();
          setColleges(c);
        }
      } catch (err) {
        console.error('Failed to fetch initial university data:', err);
      }
    }
    loadData();
  }, []);

  const handleOpenExplorer = (tab: 'programs' | 'colleges' = 'programs') => {
    setExplorerTab(tab);
    setIsExplorerOpen(true);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setApiError(null);

    // Apply language hint if user explicitly picked non-Auto language
    let promptToSend = text;
    if (activeLanguage === 'ગુજરાતી' && !/[\u0A80-\u0AFF]/.test(text)) {
      promptToSend = `[Please answer in Gujarati language]: ${text}`;
    } else if (activeLanguage === 'हिन्दी' && !/[\u0900-\u097F]/.test(text)) {
      promptToSend = `[Please answer in Hindi language]: ${text}`;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptToSend,
          history
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to get answer');
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        detectedLanguage: data.detectedLanguage,
        suggestedPrompts: data.suggestedPrompts,
        debugInfo: data.debugInfo,
        timestamp: Date.now()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setApiError(err.message || 'Unable to connect to Silver Oak University AI service.');
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, an error occurred while retrieving official information: ${err.message || 'Please try again'}. You can also visit the official website directly at https://silveroakuni.ac.in or contact the admission helpline at +91 7966046300.`,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setApiError(null);
  };

  const totalPrograms = branches.length || systemStatus?.branchesCount || 121;
  const totalColleges = colleges.length || systemStatus?.collegesCount || 17;

  return (
    <div className={`min-h-screen ${
      highContrast ? 'bg-black text-white' : 'bg-slate-100 text-slate-900'
    } flex flex-col font-sans transition-colors`}>
      
      {/* Top Header */}
      <Header
        status={systemStatus}
        totalPrograms={totalPrograms}
        totalColleges={totalColleges}
        debugMode={debugMode}
        onToggleDebug={() => setDebugMode(!debugMode)}
        onOpenExplorer={handleOpenExplorer}
        onClearChat={handleClearChat}
        activeLanguage={activeLanguage}
        onSelectLanguage={setActiveLanguage}
        highContrast={highContrast}
        onToggleHighContrast={() => setHighContrast(!highContrast)}
        fontSize={fontSize}
        onToggleFontSize={() => setFontSize(fontSize === 'normal' ? 'large' : 'normal')}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-between max-w-7xl w-full mx-auto relative">
        
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center py-4 sm:py-6">
            <QuickPrompts 
              onSelectPrompt={handleSendMessage}
              onOpenExplorer={handleOpenExplorer}
              totalPrograms={totalPrograms}
              totalColleges={totalColleges}
              highContrast={highContrast}
            />
          </div>
        ) : (
          <div 
            ref={chatScrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto relative"
          >
            {messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                debugMode={debugMode}
                onAskQuestion={handleSendMessage}
                highContrast={highContrast}
                fontSize={fontSize}
              />
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className={`py-4 px-4 sm:px-6 ${highContrast ? 'bg-zinc-900 border-yellow-400' : 'bg-slate-50/70 border-slate-200'} border-y`}>
                <div className="max-w-4xl mx-auto flex gap-4 items-center">
                  <div className={`w-8 h-8 rounded-lg ${highContrast ? 'bg-yellow-400 text-black' : 'bg-[#062051] text-amber-400 border border-amber-500/30'} flex items-center justify-center font-serif font-bold text-xs shadow-xs shrink-0`}>
                    SOU
                  </div>
                  <div className={`flex items-center gap-2 text-xs font-semibold ${highContrast ? 'text-yellow-300' : 'text-slate-600'}`}>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Searching official Silver Oak University records & generating grounded response...</span>
                  </div>
                </div>
              </div>
            )}

            {apiError && (
              <div className="max-w-4xl mx-auto my-3 px-4">
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{apiError}</span>
                </div>
              </div>
            )}

            {/* Scroll-to-latest button (Section 5) */}
            {showScrollBottom && (
              <button
                onClick={scrollToBottom}
                className="fixed bottom-24 right-6 z-20 p-2.5 rounded-full bg-[#062051] hover:bg-blue-900 text-amber-400 shadow-lg border border-amber-500/30 transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Scroll to latest message"
              >
                <ArrowDown className="w-4 h-4" />
                <span className="hidden sm:inline">Latest</span>
              </button>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

      </main>

      {/* Sticky Chat Input Dock */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        activeLanguage={activeLanguage}
        highContrast={highContrast}
      />

      {/* Full Programme & College Explorer Modal */}
      <ProgramExplorerModal
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        branches={branches}
        colleges={colleges}
        onAskAboutProgram={handleSendMessage}
        initialTab={explorerTab}
        highContrast={highContrast}
      />

    </div>
  );
}
