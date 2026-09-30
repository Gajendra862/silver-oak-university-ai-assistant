import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ChatMessageItem } from './components/ChatMessage';
import { QuickPrompts } from './components/QuickPrompts';
import { ChatInput } from './components/ChatInput';
import { ProgramExplorerModal } from './components/ProgramExplorerModal';
import { FeeStructureModal } from './components/FeeStructureModal';
import { FacultyLoginModal } from './components/FacultyLoginModal';
import { FacultyDashboard } from './components/FacultyDashboard';
import { 
  ChatMessage, 
  SystemStatus, 
  UniversityBranch, 
  CollegeInfo, 
  FacultyMember 
} from './types';
import { Loader2, AlertCircle, ArrowDown } from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [explorerTab, setExplorerTab] = useState<'programs' | 'colleges'>('programs');
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [feeModalQuery, setFeeModalQuery] = useState('');
  const [branches, setBranches] = useState<UniversityBranch[]>([]);
  const [colleges, setColleges] = useState<CollegeInfo[]>([]);
  const [activeLanguage, setActiveLanguage] = useState('Auto');
  const [apiError, setApiError] = useState<string | null>(null);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Faculty Authentication & Portal State (PARTS 1, 2, 20)
  const [activeFaculty, setActiveFaculty] = useState<FacultyMember | null>(null);
  const [facultyToken, setFacultyToken] = useState<string | null>(null);
  const [isFacultyLoginOpen, setIsFacultyLoginOpen] = useState(false);
  const [isFacultyDashboardView, setIsFacultyDashboardView] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('sou_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sou_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.warn('Failed to persist theme:', e);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBottom(isScrolledUp);
  };

  // Restore Faculty Session on Load
  useEffect(() => {
    async function checkSavedFacultySession() {
      try {
        const savedToken = localStorage.getItem('sou_faculty_token');
        if (!savedToken) return;

        const res = await fetch('/api/faculty/me', {
          headers: { 'Authorization': `Bearer ${savedToken}` }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.faculty) {
            setActiveFaculty(data.faculty);
            setFacultyToken(savedToken);
          }
        } else {
          // Token expired or invalid
          localStorage.removeItem('sou_faculty_token');
          localStorage.removeItem('sou_faculty_user');
        }
      } catch (err) {
        console.warn('Faculty session check failed:', err);
      }
    }
    checkSavedFacultySession();
  }, []);

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

  const handleOpenFeeExplorer = (searchQuery?: string) => {
    if (searchQuery) {
      setFeeModalQuery(searchQuery);
    }
    setIsFeeModalOpen(true);
  };

  // Faculty Authentication Handlers
  const handleFacultyLoginSuccess = (faculty: FacultyMember, token: string) => {
    setActiveFaculty(faculty);
    setFacultyToken(token);
    setIsFacultyLoginOpen(false);
    setIsFacultyDashboardView(true);
  };

  const handleFacultyLogout = async () => {
    if (facultyToken) {
      try {
        await fetch('/api/faculty/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${facultyToken}` }
        });
      } catch (e) {
        console.warn('Logout notification error:', e);
      }
    }
    localStorage.removeItem('sou_faculty_token');
    localStorage.removeItem('sou_faculty_user');
    setActiveFaculty(null);
    setFacultyToken(null);
    setIsFacultyDashboardView(false);
  };

  const handleOpenFacultyDashboard = () => {
    if (!activeFaculty || !facultyToken) {
      setIsFacultyLoginOpen(true);
      return;
    }
    setIsFacultyDashboardView(true);
  };

  const handleReturnToChat = (prefilledQuery?: string) => {
    setIsFacultyDashboardView(false);
    if (prefilledQuery) {
      handleSendMessage(prefilledQuery);
    }
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

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptToSend,
          history
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        timestamp: Date.now(),
        sources: data.sources,
        detectedLanguage: data.detectedLanguage,
        debugInfo: data.debugInfo,
        suggestedPrompts: data.suggestedPrompts
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setApiError('Unable to connect to the live AI service. Please verify your connection.');
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I could not find this information on the official university website. Please contact the Silver Oak University admission helpline at +91 7966046300 or info@silveroakuni.ac.in for official assistance.',
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

  const isDark = theme === 'dark' && !highContrast;

  // If user is currently viewing the protected Faculty Dashboard
  if (isFacultyDashboardView && activeFaculty && facultyToken) {
    return (
      <div className={`min-h-screen ${
        highContrast ? 'bg-black text-white' : isDark ? 'bg-[#060e1d] text-slate-100' : 'bg-slate-50 text-slate-900'
      } flex flex-col font-sans transition-colors duration-200`}>
        <FacultyDashboard
          faculty={activeFaculty}
          token={facultyToken}
          onLogout={handleFacultyLogout}
          onReturnToChat={handleReturnToChat}
          theme={theme}
          highContrast={highContrast}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      highContrast 
        ? 'bg-black text-white' 
        : isDark
          ? 'bg-[#070e1b] text-slate-100'
          : 'bg-slate-50/80 text-slate-900'
    } flex flex-col font-sans transition-colors duration-200`}>
      
      {/* Top Header (PART 25: Redesigned clean header) */}
      <Header
        status={systemStatus}
        totalPrograms={totalPrograms}
        totalColleges={totalColleges}
        debugMode={debugMode}
        onToggleDebug={() => setDebugMode(!debugMode)}
        onOpenExplorer={handleOpenExplorer}
        onOpenFeeExplorer={() => handleOpenFeeExplorer()}
        onClearChat={handleClearChat}
        activeLanguage={activeLanguage}
        onSelectLanguage={setActiveLanguage}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        highContrast={highContrast}
        onToggleHighContrast={() => setHighContrast(!highContrast)}
        fontSize={fontSize}
        onToggleFontSize={() => setFontSize(fontSize === 'normal' ? 'large' : 'normal')}
        activeFaculty={activeFaculty}
        onOpenFacultyLogin={() => setIsFacultyLoginOpen(true)}
        onOpenFacultyDashboard={handleOpenFacultyDashboard}
        onLogoutFaculty={handleFacultyLogout}
        isFacultyView={isFacultyDashboardView}
        onReturnToChat={() => handleReturnToChat()}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-between max-w-7xl w-full mx-auto relative">
        
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center py-4 sm:py-6">
            <QuickPrompts 
              onSelectPrompt={handleSendMessage}
              onOpenExplorer={handleOpenExplorer}
              onOpenFeeExplorer={() => handleOpenFeeExplorer()}
              totalPrograms={totalPrograms}
              totalColleges={totalColleges}
              theme={theme}
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
                onOpenFeeExplorer={handleOpenFeeExplorer}
                onOpenExplorer={handleOpenExplorer}
                theme={theme}
                highContrast={highContrast}
                fontSize={fontSize}
              />
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className={`py-4 px-4 sm:px-6 ${
                highContrast 
                  ? 'bg-zinc-900 border-yellow-400' 
                  : isDark 
                    ? 'bg-slate-900/60 backdrop-blur-md border-y border-white/[0.08]' 
                    : 'bg-white border-slate-200'
              } border-y`}>
                <div className="max-w-4xl mx-auto flex gap-4 items-center">
                  <div className={`w-8 h-8 rounded-lg ${
                    highContrast ? 'bg-yellow-400 text-black' : 'bg-white p-0.5 border border-slate-200 dark:border-white/20'
                  } flex items-center justify-center shadow-xs shrink-0`}>
                    <img src="/sou-emblem.svg" alt="SOU" className="w-full h-full object-contain" />
                  </div>
                  <div className={`flex items-center gap-2 text-xs font-semibold ${
                    highContrast ? 'text-yellow-300' : isDark ? 'text-blue-300' : 'text-slate-600'
                  }`}>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-amber-400" />
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

            {/* Scroll-to-latest button */}
            {showScrollBottom && (
              <button
                onClick={scrollToBottom}
                className="fixed bottom-24 right-6 z-20 p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
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
        theme={theme}
        highContrast={highContrast}
      />

      {/* Programmes Explorer Modal */}
      <ProgramExplorerModal
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        branches={branches}
        colleges={colleges}
        onAskAboutProgram={handleSendMessage}
        initialTab={explorerTab}
        theme={theme}
        highContrast={highContrast}
      />

      {/* Redesigned Clean Fee Structure Explorer Modal (PART 21 & 22) */}
      <FeeStructureModal
        isOpen={isFeeModalOpen}
        onClose={() => {
          setIsFeeModalOpen(false);
          setFeeModalQuery('');
        }}
        branches={branches}
        colleges={colleges}
        onAskAboutProgram={handleSendMessage}
        initialQuery={feeModalQuery}
        theme={theme}
        highContrast={highContrast}
      />

      {/* Faculty Login & Registration Modal */}
      <FacultyLoginModal
        isOpen={isFacultyLoginOpen}
        onClose={() => setIsFacultyLoginOpen(false)}
        onLoginSuccess={handleFacultyLoginSuccess}
        theme={theme}
        highContrast={highContrast}
        colleges={colleges}
      />

    </div>
  );
}
