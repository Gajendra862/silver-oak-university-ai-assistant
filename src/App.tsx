import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ChatMessageItem } from './components/ChatMessage';
import { QuickPrompts } from './components/QuickPrompts';
import { ChatInput } from './components/ChatInput';
import { ProgramExplorerModal } from './components/ProgramExplorerModal';
import { ChatMessage, SystemStatus, UniversityBranch, CollegeInfo } from './types';
import { Loader2, AlertCircle, Building2, Calendar, FileText, ExternalLink } from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [branches, setBranches] = useState<UniversityBranch[]>([]);
  const [colleges, setColleges] = useState<CollegeInfo[]>([]);
  const [activeLanguage, setActiveLanguage] = useState('Auto');
  const [apiError, setApiError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Fetch initial system status and metadata
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

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setApiError(null);

    // Apply language prefix hint if user explicitly picked a non-Auto language
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
      const history = messages.slice(-4).map((m) => ({
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      
      {/* Top Header */}
      <Header
        status={systemStatus}
        debugMode={debugMode}
        onToggleDebug={() => setDebugMode(!debugMode)}
        onOpenExplorer={() => setIsExplorerOpen(true)}
        onClearChat={handleClearChat}
        activeLanguage={activeLanguage}
        onSelectLanguage={setActiveLanguage}
      />

      {/* Main Chat Flow */}
      <main className="flex-1 flex flex-col justify-between max-w-7xl w-full mx-auto">
        
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center py-8">
            <QuickPrompts onSelectPrompt={handleSendMessage} />
            
            {/* Quick stats banner */}
            <div className="max-w-4xl mx-auto px-4 mt-6 w-full">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                  <div className="text-xl font-bold text-[#062051]">
                    {systemStatus?.branchesCount || 107}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Programmes</div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                  <div className="text-xl font-bold text-blue-700">
                    {systemStatus?.collegesCount || 17}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Colleges</div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                  <div className="text-xl font-bold text-amber-600">
                    Summer 2026
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Active Exam Schedules</div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                  <div className="text-xl font-bold text-emerald-600">
                    UGC & AICTE
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Recognized & Approved</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                debugMode={debugMode}
                onAskQuestion={handleSendMessage}
              />
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="py-4 px-4 sm:px-6 bg-slate-50/70 border-y border-slate-100">
                <div className="max-w-4xl mx-auto flex gap-4 items-center">
                  <div className="w-8 h-8 rounded-lg bg-[#062051] text-amber-400 flex items-center justify-center font-serif font-bold text-xs shadow-xs border border-amber-500/30 shrink-0">
                    SOU
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
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

            <div ref={messagesEndRef} />
          </div>
        )}

      </main>

      {/* Chat Input Dock */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        activeLanguage={activeLanguage}
      />

      {/* Full Programme Explorer Modal */}
      <ProgramExplorerModal
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        branches={branches}
        colleges={colleges}
        onAskAboutProgram={handleSendMessage}
      />

    </div>
  );
}
