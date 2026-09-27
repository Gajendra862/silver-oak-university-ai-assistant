import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { 
  Bot, 
  User, 
  Copy, 
  Check, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Calendar, 
  BookOpen, 
  Sparkles,
  Clock,
  Search,
  Volume2,
  VolumeX,
  ArrowRight
} from 'lucide-react';
import { ChatMessage as ChatMessageType, SourceCitation } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
  debugMode: boolean;
  onAskQuestion?: (query: string) => void;
  highContrast?: boolean;
  fontSize?: 'normal' | 'large';
}

export const ChatMessageItem: React.FC<ChatMessageProps> = ({
  message,
  debugMode,
  onAskQuestion,
  highContrast = false,
  fontSize = 'normal'
}) => {
  const [copied, setCopied] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(true);
  const [debugOpen, setDebugOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for cleaner speech
    const cleanSpeechText = message.content
      .replace(/[#*`_\[\]()]/g, ' ')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    if (message.detectedLanguage === 'Hindi') {
      utterance.lang = 'hi-IN';
    } else if (message.detectedLanguage === 'Gujarati') {
      utterance.lang = 'gu-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const getSourceIcon = (type: SourceCitation['type']) => {
    switch (type) {
      case 'exam_timetable':
        return <Calendar className="w-3.5 h-3.5 text-amber-600" />;
      case 'curriculum_pdf':
        return <BookOpen className="w-3.5 h-3.5 text-blue-600" />;
      case 'circular':
        return <FileText className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <ExternalLink className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getSourceBadge = (type: SourceCitation['type']) => {
    switch (type) {
      case 'exam_timetable':
        return <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">Exam Timetable</span>;
      case 'curriculum_pdf':
        return <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">Syllabus PDF</span>;
      case 'circular':
        return <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">Circular</span>;
      case 'official_contact':
        return <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">Contact / Campus</span>;
      default:
        return <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">Official Webpage</span>;
    }
  };

  return (
    <div className={`py-4 px-4 sm:px-6 transition-colors ${
      isAssistant 
        ? (highContrast ? 'bg-zinc-900 border-b border-yellow-400 text-white' : 'bg-slate-50/80 border-y border-slate-200/70') 
        : (highContrast ? 'bg-black text-white' : 'bg-white')
    }`}>
      <div className="max-w-4xl mx-auto flex gap-3.5 sm:gap-4 items-start">
        
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isAssistant ? (
            <div className={`w-8 h-8 rounded-lg ${
              highContrast ? 'bg-yellow-400 text-black' : 'bg-[#062051] text-amber-400 border border-amber-500/30'
            } flex items-center justify-center font-serif font-bold text-xs shadow-xs`}>
              SOU
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-medium text-xs">
              <User className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="flex-1 min-w-0">
          
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold ${highContrast ? 'text-yellow-300' : 'text-slate-900'}`}>
                {isAssistant ? 'Silver Oak University AI' : 'You'}
              </span>
              
              {isAssistant && message.detectedLanguage && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  {message.detectedLanguage}
                </span>
              )}

              {isAssistant && message.debugInfo?.executionTimeMs && (
                <span className="text-[10px] text-slate-400 inline-flex items-center gap-1 font-mono">
                  <Clock className="w-2.5 h-2.5" />
                  {message.debugInfo.executionTimeMs}ms
                </span>
              )}
            </div>

            {/* Action buttons (Copy & TTS) */}
            {isAssistant && (
              <div className="flex items-center gap-1">
                {'speechSynthesis' in window && (
                  <button
                    onClick={handleToggleSpeak}
                    className={`p-1.5 rounded transition-colors cursor-pointer ${
                      isSpeaking ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                    title={isSpeaking ? 'Stop audio playback' : 'Read answer aloud'}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                )}

                <button
                  onClick={handleCopy}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                  title="Copy response"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Text Message with Markdown */}
          <div className={`${highContrast ? 'text-slate-100' : 'text-slate-800'} ${
            fontSize === 'large' ? 'text-base sm:text-lg' : 'text-[14.5px]'
          } leading-relaxed break-words`}>
            <div className="prose prose-slate max-w-none prose-p:my-2 prose-headings:font-bold prose-headings:text-[#062051] prose-h2:text-base prose-h3:text-sm prose-ul:my-2 prose-li:my-0.5 prose-table:my-3 prose-th:bg-slate-100 prose-th:p-2 prose-th:text-xs prose-td:p-2 prose-td:text-xs prose-td:border-b prose-td:border-slate-200 prose-a:text-blue-700 prose-a:font-medium hover:prose-a:underline">
              <Markdown>{message.content}</Markdown>
            </div>
          </div>

          {/* Suggested Follow-up Prompts (Section 12) */}
          {isAssistant && message.suggestedPrompts && message.suggestedPrompts.length > 0 && onAskQuestion && (
            <div className="mt-3.5 pt-2.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mr-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Follow-up questions:
              </span>
              {message.suggestedPrompts.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => onAskQuestion(sug)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-xs text-blue-900 font-medium transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <span>{sug}</span>
                  <ArrowRight className="w-3 h-3 text-blue-600" />
                </button>
              ))}
            </div>
          )}

          {/* Official Grounded Sources Accordion */}
          {isAssistant && message.sources && message.sources.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-slate-200/80">
              <button
                onClick={() => setSourcesOpen(!sourcesOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-900 transition-colors w-full text-left cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Verified Official Sources ({message.sources.length})</span>
                {sourcesOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 ml-auto text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 ml-auto text-slate-400" />
                )}
              </button>

              {sourcesOpen && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {message.sources.map((source, sIdx) => (
                    <a
                      key={sIdx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col p-2.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all text-left"
                    >
                      <div className="flex items-start justify-between gap-1.5 mb-1">
                        <div className="flex items-center gap-1.5">
                          {getSourceIcon(source.type)}
                          {getSourceBadge(source.type)}
                        </div>
                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0 mt-0.5" />
                      </div>
                      <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 line-clamp-1">
                        {source.title}
                      </div>
                      {source.snippet && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                          {source.snippet}
                        </p>
                      )}
                      <div className="text-[10px] text-blue-600/80 font-mono mt-1 truncate">
                        {source.url.replace(/^https?:\/\//, '')}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Developer Debug Panel */}
          {isAssistant && debugMode && message.debugInfo && (
            <div className="mt-3 p-3 rounded-lg bg-slate-900 text-slate-200 text-xs font-mono">
              <button
                onClick={() => setDebugOpen(!debugOpen)}
                className="flex items-center justify-between w-full text-amber-400 font-semibold cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Search className="w-3 h-3" />
                  Developer Retrieval Trace ({message.debugInfo.executionTimeMs}ms)
                </span>
                {debugOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {debugOpen && (
                <div className="mt-2.5 space-y-2 pt-2 border-t border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400">Raw Query:</span>{' '}
                    <span className="text-emerald-400">{message.debugInfo.query}</span>
                  </div>
                  {message.debugInfo.expandedQueries && (
                    <div>
                      <span className="text-slate-400">Expanded Queries:</span>
                      <ul className="list-disc list-inside text-blue-300 pl-1 mt-0.5">
                        {message.debugInfo.expandedQueries.map((eq, i) => (
                          <li key={i}>{eq}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400">Retrieved Docs Count:</span>{' '}
                    <span className="text-amber-300">{message.debugInfo.retrievedDocsCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Sources Scored:</span>
                    <ul className="list-decimal list-inside text-slate-300 pl-1 mt-0.5 space-y-0.5">
                      {message.debugInfo.sourcesUsed.map((su, idx) => (
                        <li key={idx} className="truncate">
                          [{su.type}] {su.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {message.debugInfo.failedSources && message.debugInfo.failedSources.length > 0 && (
                    <div>
                      <span className="text-red-400">Failed Sources:</span>{' '}
                      {message.debugInfo.failedSources.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
