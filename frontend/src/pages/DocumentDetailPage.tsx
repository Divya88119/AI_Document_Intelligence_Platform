import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { docsApi, chatApi } from '../services/api';
import { DocumentDetail, DocumentChatMessage } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import {
  ArrowLeft,
  Download,
  RotateCw,
  Trash2,
  Sparkles,
  MessageSquare,
  Copy,
  Check,
  Send,
  Loader2,
  CheckCircle2,
  Layers,
  Key,
  ShieldCheck,
  ListTodo,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Quote,
  DollarSign,
  Calendar,
  Users,
  ShieldAlert,
  CheckSquare,
  Search,
  Eraser,
  Bot,
  User,
  ChevronRight,
  FileText,
  Lightbulb,
} from 'lucide-react';

const QUICK_ACTIONS = [
  {
    category: 'Summary',
    icon: Sparkles,
    label: 'Overview',
    prompt: 'Provide a concise executive summary and the core purpose of this document.',
  },
  {
    category: 'Financials',
    icon: DollarSign,
    label: 'Financials',
    prompt: 'What are all the monetary amounts, fees, invoices, prices, totals, or financial figures in this document?',
  },
  {
    category: 'Dates',
    icon: Calendar,
    label: 'Key Dates',
    prompt: 'Extract all dates, deadlines, milestones, and timelines found in this document.',
  },
  {
    category: 'Parties',
    icon: Users,
    label: 'Parties & Names',
    prompt: 'Who are all the individuals, companies, signatories, and contact details mentioned in this document?',
  },
  {
    category: 'Risks',
    icon: ShieldAlert,
    label: 'Risks & Terms',
    prompt: 'What are the main contractual obligations, risks, liabilities, or special terms in this document?',
  },
  {
    category: 'Actions',
    icon: CheckSquare,
    label: 'Action Items',
    prompt: 'What are the recommended action items, next steps, and deliverables identified in this document?',
  },
];

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const documentId = parseInt(id || '0', 10);
  const navigate = useNavigate();

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [chatMessages, setChatMessages] = useState<DocumentChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedText, setCopiedText] = useState(false);
  const [leftTab, setLeftTab] = useState<'text' | 'meta'>('text');
  const [rightTab, setRightTab] = useState<'insights' | 'chat'>('chat');
  const [actionLoading, setActionLoading] = useState(false);

  // Enhanced Interactive Chat State
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const fetchDocumentData = async () => {
    try {
      const data = await docsApi.getById(documentId);
      setDocument(data);
    } catch (err) {
      console.error('Failed to load document details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChat = async () => {
    try {
      const history = await chatApi.getHistory(documentId);
      setChatMessages(history);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    fetchDocumentData();
    fetchChat();

    const interval = setInterval(() => {
      if (document?.processingStatus === 'Processing' || document?.processingStatus === 'Queued') {
        fetchDocumentData();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [documentId, document?.processingStatus]);

  useEffect(() => {
    if (rightTab === 'chat' && !searchQuery) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, rightTab, isSendingChat, searchQuery]);

  // Clean up SpeechSynthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSendMessage = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const query = customPrompt || chatInput;
    if (!query.trim() || isSendingChat) return;

    setIsSendingChat(true);
    setChatInput('');

    // Optimistic user message
    const tempUserMsg: DocumentChatMessage = {
      id: Date.now(),
      documentId,
      userId: 0,
      userName: 'You',
      role: 'user',
      message: query,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, tempUserMsg]);

    try {
      const aiResponse = await chatApi.askQuestion(documentId, query);
      setChatMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      const errorMsg: DocumentChatMessage = {
        id: Date.now() + 1,
        documentId,
        userId: 0,
        userName: 'AI Assistant',
        role: 'assistant',
        message: 'Sorry, I encountered an error while analyzing this document. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Copy Single Message
  const handleCopyMessage = (msgId: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Text-To-Speech (Read Aloud)
  const handleToggleSpeak = (msgId: number, text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*`_>]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Voice Input (Speech-to-Text Dictation)
  const handleToggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
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
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setChatInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
        chatInputRef.current?.focus();
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (err) {
      console.error('Voice recognition error:', err);
      setIsListening(false);
    }
  };

  // Quote Message into Input Field
  const handleQuotePrompt = (text: string) => {
    const snippet = text.slice(0, 80).replace(/\n/g, ' ');
    setChatInput(`Regarding "${snippet}...": `);
    chatInputRef.current?.focus();
  };

  // Export Chat Transcript
  const handleExportChat = () => {
    if (chatMessages.length === 0) return;
    let md = `# AI Document Chat Transcript\n`;
    md += `**Document**: ${document?.fileName || 'Document'}\n`;
    md += `**Exported At**: ${new Date().toLocaleString()}\n`;
    md += `**Total Messages**: ${chatMessages.length}\n\n---\n\n`;

    chatMessages.forEach((msg) => {
      const role = msg.role === 'user' ? '👤 User' : '🤖 AI Assistant';
      const time = new Date(msg.timestamp).toLocaleString();
      md += `### ${role} (${time})\n\n${msg.message}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document?.fileName || 'document'}_chat_transcript.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear Chat History on Client
  const handleClearChat = () => {
    if (window.confirm('Clear all conversation messages on screen?')) {
      setChatMessages([]);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setSpeakingMessageId(null);
      }
    }
  };

  const handleCopyText = () => {
    if (document?.extractedContent?.rawText) {
      navigator.clipboard.writeText(document.extractedContent.rawText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const handleDownload = async () => {
    if (!document) return;
    try {
      await docsApi.download(document.id, document.fileName);
    } catch (err) {
      alert('Failed to download file.');
    }
  };

  const handleReprocess = async () => {
    if (!document) return;
    try {
      setActionLoading(true);
      await docsApi.reprocess(document.id);
      await fetchDocumentData();
    } catch (err) {
      alert('Failed to trigger reprocessing.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!document) return;
    if (!window.confirm('Delete this document and all AI extracted records permanently?')) return;
    try {
      await docsApi.delete(document.id);
      navigate('/documents');
    } catch (err) {
      alert('Failed to delete document.');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format Bold & Inline Tokens
  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-bold text-white bg-indigo-950/60 px-1 py-0.5 rounded text-indigo-200">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // Rich Markdown Renderer for AI Bubbles
  const renderFormattedMessage = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} className="h-1.5" />;

      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={i} className="text-xs font-bold text-cyan-300 mt-2 mb-1 flex items-center gap-1.5 border-b border-slate-800 pb-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            {trimmed.replace(/^###\s*/, '')}
          </h4>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h3 key={i} className="text-sm font-extrabold text-white mt-2.5 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-400" />
            {trimmed.replace(/^##\s*/, '')}
          </h3>
        );
      }

      if (trimmed.startsWith('> ')) {
        return (
          <div key={i} className="my-1.5 pl-3 py-1 bg-slate-900/90 border-l-2 border-cyan-400 rounded-r-lg text-slate-300 text-[11px] italic font-sans">
            {trimmed.replace(/^>\s*/, '')}
          </div>
        );
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = trimmed.substring(2);
        return (
          <div key={i} className="flex items-start gap-2 my-1 text-slate-200 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
            <span>{renderInlineFormatting(content)}</span>
          </div>
        );
      }

      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={i} className="flex items-start gap-2 my-1 text-slate-200 text-xs">
            <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50 text-[10px] font-mono font-bold flex-shrink-0">
              {numMatch[1]}
            </span>
            <span>{renderInlineFormatting(numMatch[2])}</span>
          </div>
        );
      }

      return (
        <p key={i} className="my-1 text-slate-200 text-xs leading-relaxed">
          {renderInlineFormatting(trimmed)}
        </p>
      );
    });
  };

  // Get Dynamic Context Follow-Ups
  const getFollowUpSuggestions = (lastMsgText: string) => {
    const lower = lastMsgText.toLowerCase();
    if (lower.includes('overview') || lower.includes('summary')) {
      return [
        'What are the key financial amounts or figures?',
        'Who are all the individuals & signatories?',
        'What are the critical dates and deadlines?',
      ];
    }
    if (lower.includes('financial') || lower.includes('amount') || lower.includes('$')) {
      return [
        'Are there any payment deadlines mentioned?',
        'What are the billing or remittance parties?',
        'What are the top action items for this?',
      ];
    }
    return [
      'Summarize this in 3 quick bullet points',
      'What are the critical dates or milestones?',
      'What are the recommended action items?',
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-24 space-y-4">
        <p className="text-slate-400">Document not found or you do not have permission to view it.</p>
        <Link
          to="/documents"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Documents
        </Link>
      </div>
    );
  }

  const insight = document.insight;
  const content = document.extractedContent;

  const filteredMessages = searchQuery.trim()
    ? chatMessages.filter((m) => m.message.toLowerCase().includes(searchQuery.toLowerCase()))
    : chatMessages;

  const lastAssistantMessage = [...chatMessages].reverse().find((m) => m.role === 'assistant');

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link
            to="/documents"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-extrabold text-white truncate max-w-lg">
                {document.fileName}
              </h1>
              <StatusBadge status={document.processingStatus} />
              {insight && <CategoryBadge category={insight.category} />}
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
              <span>Size: {formatBytes(document.fileSizeBytes)}</span>
              <span>Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}</span>
              {content && <span>Pages: {content.pageCount} | Words: {content.wordCount}</span>}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>

          <button
            onClick={handleReprocess}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
            Reprocess AI
          </button>

          <button
            onClick={handleDelete}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-400 hover:border-rose-800 border border-slate-700 transition-colors cursor-pointer"
            title="Delete document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Split View Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Extracted Content (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden flex flex-col h-[750px]">
          {/* Tab Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-950/40">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLeftTab('text')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  leftTab === 'text'
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Extracted Text
              </button>
              <button
                onClick={() => setLeftTab('meta')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  leftTab === 'meta'
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                File Metadata
              </button>
            </div>

            {leftTab === 'text' && content && (
              <button
                onClick={handleCopyText}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedText ? 'Copied' : 'Copy All'}
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300 leading-relaxed bg-slate-950/30">
            {leftTab === 'text' ? (
              content?.rawText ? (
                <pre className="whitespace-pre-wrap font-sans text-xs text-slate-300 select-text">
                  {content.rawText}
                </pre>
              ) : (
                <div className="text-center py-20 text-slate-500">
                  <p>No extracted text available yet.</p>
                </div>
              )
            ) : (
              <div className="space-y-4 font-sans text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Document Name & ID</span>
                  <p className="text-slate-200 font-mono text-[11px] break-all">{document.fileName} (ID: #{document.id})</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">MIME Content-Type</span>
                  <p className="text-slate-200 font-mono">{document.contentType}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Extraction Timestamp</span>
                  <p className="text-slate-200">
                    {content?.extractedAt ? new Date(content.extractedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Insights & Interactive Chat Studio (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden flex flex-col h-[750px]">
          {/* Right Header Navigation Tabs */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/80 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRightTab('chat')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  rightTab === 'chat'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat with Document</span>
                {chatMessages.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-indigo-900/80 border border-indigo-400/30 text-indigo-200 text-[10px]">
                    {chatMessages.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setRightTab('insights')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  rightTab === 'insights'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Insights</span>
              </button>
            </div>

            {/* Right Header Utilities */}
            <div className="flex items-center gap-2">
              {rightTab === 'chat' && chatMessages.length > 0 && (
                <>
                  <button
                    onClick={() => setShowSearch(!showSearch)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      showSearch
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-900 border-slate-800'
                    }`}
                    title="Search messages"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleExportChat}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-colors cursor-pointer"
                    title="Export conversation transcript (.md)"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleClearChat}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-800 transition-colors cursor-pointer"
                    title="Clear screen chat"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {insight && (
                <span className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {insight.aiModelUsed || 'AI Engine'}
                </span>
              )}
            </div>
          </div>

          {/* Search Filter Bar (When Active) */}
          {rightTab === 'chat' && showSearch && (
            <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search within this chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Right Area Body */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col justify-between">
            {rightTab === 'insights' ? (
              /* Insights View */
              insight ? (
                <div className="space-y-6">
                  {/* Category & Confidence */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/20 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">
                        Document Classification
                      </div>
                      <div className="text-lg font-bold text-white mt-0.5">{insight.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Confidence</div>
                      <div className="text-base font-extrabold text-emerald-400">
                        {Math.round(insight.confidenceScore * 100)}%
                      </div>
                    </div>
                  </div>

                  {/* Executive Summary */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Executive Summary
                    </h3>
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                      {insight.executiveSummary}
                    </div>
                  </div>

                  {/* Key Highlights */}
                  {insight.keyHighlights && insight.keyHighlights.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        Key Highlights
                      </h3>
                      <div className="space-y-2">
                        {insight.keyHighlights.map((highlight, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                            <span>{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Structured Key-Value Pairs */}
                  {insight.keyValues && Object.keys(insight.keyValues).length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-indigo-400" />
                        Extracted Attributes & Key-Values
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {Object.entries(insight.keyValues).map(([k, v]) => (
                          <div
                            key={k}
                            className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between"
                          >
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                              {k}
                            </span>
                            <span className="text-xs font-semibold text-slate-100 mt-1 break-words">
                              {v}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Identified Entities */}
                  {insight.entities && insight.entities.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        Recognized Entities ({insight.entities.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {insight.entities.map((entity, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs"
                          >
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                              {entity.type}
                            </span>
                            <span className="font-medium text-slate-200">{entity.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Items */}
                  {insight.actionItems && insight.actionItems.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                        <ListTodo className="w-3.5 h-3.5 text-indigo-400" />
                        Recommended Action Items
                      </h3>
                      <div className="space-y-2">
                        {insight.actionItems.map((action, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-300 flex items-center gap-2.5"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <p className="text-xs">AI Extraction in progress... this usually takes just a few seconds.</p>
                </div>
              )
            ) : (
              /* Interactive Chat with Document View */
              <div className="flex flex-col h-full justify-between gap-3">
                {/* Categorized Quick Action Carousel (Interactive Pills) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800/60 flex-shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-500 whitespace-nowrap pl-1">
                    Quick Ask:
                  </span>
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.category}
                        onClick={() => handleSendMessage(undefined, action.prompt)}
                        disabled={isSendingChat}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/80 hover:border-indigo-500/50 text-[11px] text-slate-300 hover:text-white transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
                      >
                        <Icon className="w-3 h-3 text-indigo-400" />
                        <span>{action.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Messages Stream */}
                <div className="space-y-4 flex-1 overflow-y-auto pr-1 pb-2">
                  {filteredMessages.length === 0 ? (
                    /* Interactive Empty State with Cards */
                    <div className="text-center py-6 space-y-5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600/20 to-cyan-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/10">
                        <Sparkles className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">
                          Interactive Document Q&A Intelligence
                        </h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                          Ask free-form questions or click any smart prompt below to extract insights grounded strictly in this document.
                        </p>
                      </div>

                      {/* Interactive Category Starter Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg mx-auto text-left pt-2">
                        {QUICK_ACTIONS.slice(0, 4).map((action) => {
                          const Icon = action.icon;
                          return (
                            <button
                              key={action.category}
                              onClick={() => handleSendMessage(undefined, action.prompt)}
                              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/60 text-left transition-all hover:scale-[1.02] cursor-pointer group"
                            >
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-200 group-hover:text-indigo-300">
                                <Icon className="w-3.5 h-3.5 text-indigo-400" />
                                {action.label}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                                {action.prompt}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    filteredMessages.map((msg) => {
                      const isUser = msg.role === 'user';
                      const isSpeaking = speakingMessageId === msg.id;
                      const isCopied = copiedMessageId === msg.id;

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 group ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isUser && (
                            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white flex-shrink-0 mt-1 shadow-md shadow-indigo-600/20">
                              <Bot className="w-4 h-4" />
                            </div>
                          )}

                          <div
                            className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed transition-all ${
                              isUser
                                ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-none shadow-md shadow-indigo-600/25'
                                : 'bg-slate-950/90 border border-slate-800/90 text-slate-200 rounded-bl-none shadow-lg'
                            }`}
                          >
                            {/* Message Content */}
                            {isUser ? (
                              <div className="whitespace-pre-wrap font-sans">{msg.message}</div>
                            ) : (
                              <div className="space-y-1 font-sans">{renderFormattedMessage(msg.message)}</div>
                            )}

                            {/* Message Footer Actions */}
                            <div className="flex items-center justify-between gap-3 pt-2 mt-2 border-t border-slate-800/50 text-[10px]">
                              <span className={isUser ? 'text-indigo-200' : 'text-slate-500 font-mono'}>
                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>

                              {!isUser && (
                                <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                  {/* Copy Button */}
                                  <button
                                    onClick={() => handleCopyMessage(msg.id, msg.message)}
                                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                    title="Copy answer"
                                  >
                                    {isCopied ? (
                                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                                        <Check className="w-3 h-3" /> Copied
                                      </span>
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>

                                  {/* Speak / Read Aloud Button */}
                                  <button
                                    onClick={() => handleToggleSpeak(msg.id, msg.message)}
                                    className={`p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
                                      isSpeaking ? 'text-cyan-400 animate-pulse font-bold' : 'text-slate-400 hover:text-cyan-300'
                                    }`}
                                    title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                                  >
                                    {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                                  </button>

                                  {/* Quote Follow-Up */}
                                  <button
                                    onClick={() => handleQuotePrompt(msg.message)}
                                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
                                    title="Ask follow-up regarding this answer"
                                  >
                                    <Quote className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {isUser && (
                            <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-1">
                              <User className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* Thinking / Analyzing Animation */}
                  {isSendingChat && (
                    <div className="flex gap-3 justify-start items-start">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white flex-shrink-0 mt-1 animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/90 text-slate-300 text-xs rounded-bl-none flex items-center gap-2.5 shadow-lg">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-slate-400 font-medium">Extracting facts & synthesizing answer...</span>
                      </div>
                    </div>
                  )}

                  {/* Contextual Smart Follow-Up Suggestions */}
                  {!isSendingChat && lastAssistantMessage && (
                    <div className="pt-2">
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3 text-amber-400" />
                        Suggested Follow-Up Questions:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {getFollowUpSuggestions(lastAssistantMessage.message).map((sug, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(undefined, sug)}
                            className="px-2.5 py-1 rounded-lg bg-slate-950/90 hover:bg-slate-800 border border-slate-800/80 hover:border-cyan-500/40 text-[11px] text-slate-300 hover:text-cyan-300 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <ChevronRight className="w-3 h-3 text-cyan-400" />
                            <span>{sug}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Bottom Input Field & Voice Controls */}
                <form
                  onSubmit={handleSendMessage}
                  className="pt-2 border-t border-slate-800/80 flex items-center gap-2 relative"
                >
                  {/* Voice Dictation Button */}
                  <button
                    type="button"
                    onClick={handleToggleVoiceInput}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isListening
                        ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-lg shadow-rose-600/30'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                    }`}
                    title={isListening ? 'Listening... click to stop' : 'Voice Dictate'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {/* Text Input */}
                  <div className="relative flex-1">
                    <input
                      ref={chatInputRef}
                      type="text"
                      placeholder={isListening ? 'Listening to your voice...' : 'Ask anything about this document...'}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={isSendingChat}
                      className="w-full px-4 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={isSendingChat || !chatInput.trim()}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
