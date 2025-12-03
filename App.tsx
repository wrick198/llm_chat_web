import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Menu } from 'lucide-react';
import ChatInput from './components/ChatInput';
import MessageBubble from './components/MessageBubble';
import Sidebar from './components/Sidebar';
import { Message, Role, ChatSession, AppConfig } from './types';
import { streamChatResponse } from './services/apiService';

const App: React.FC = () => {
  // State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Configuration State
  const [config, setConfig] = useState<AppConfig>({
    useCustomBackend: false,
    backendUrl: 'http://localhost:8000/chat',
    apiKey: '' // User needs to input this in settings
  });

  // Initialize new chat on mount if none exists
  useEffect(() => {
    const savedSessions = localStorage.getItem('chat_sessions');
    const savedConfig = localStorage.getItem('chat_config');
    
    if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
    }

    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) {
        setCurrentSessionId(parsed[0].id);
      } else {
        createNewChat();
      }
    } else {
      createNewChat();
    }
  }, []);

  // Save to local storage whenever sessions change
  useEffect(() => {
    if(sessions.length > 0) {
        localStorage.setItem('chat_sessions', JSON.stringify(sessions));
    }
    localStorage.setItem('chat_config', JSON.stringify(config));
  }, [sessions, config]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, currentSessionId]);

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: '新对话',
      messages: [],
      updatedAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    return newSession.id;
  };

  const getCurrentSession = () => sessions.find(s => s.id === currentSessionId);

  const updateCurrentSessionMessages = (newMessages: Message[]) => {
    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        // Update title based on first message if it's generic
        let title = session.title;
        if ((session.title === 'New Chat' || session.title === '新对话') && newMessages.length > 0) {
            const firstUserMsg = newMessages.find(m => m.role === Role.User);
            if(firstUserMsg) {
                title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
            }
        }
        return { ...session, messages: newMessages, title, updatedAt: Date.now() };
      }
      return session;
    }));
  };

  const handleSend = async (text: string, enableOriginExplanation: boolean) => {
    if (!currentSessionId) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: Role.User,
      content: text,
      timestamp: Date.now(),
    };

    const currentMessages = getCurrentSession()?.messages || [];
    const updatedMessages = [...currentMessages, userMessage];
    
    // Optimistic update
    updateCurrentSessionMessages(updatedMessages);
    setIsLoading(true);

    // Create placeholder for AI response
    const botMessageId = uuidv4();
    const botMessage: Message = {
      id: botMessageId,
      role: Role.Assistant,
      content: '', // Start empty
      timestamp: Date.now(),
    };

    updateCurrentSessionMessages([...updatedMessages, botMessage]);

    let accumulatedText = '';

    await streamChatResponse(
        { text, enable_origin_explanation: enableOriginExplanation },
        config,
        (chunk) => {
            accumulatedText += chunk;
            setSessions(prev => prev.map(s => {
                if (s.id === currentSessionId) {
                    const msgs = s.messages.map(m => 
                        m.id === botMessageId ? { ...m, content: accumulatedText } : m
                    );
                    return { ...s, messages: msgs };
                }
                return s;
            }));
        },
        () => {
            setIsLoading(false);
        },
        (errorMsg) => {
            setSessions(prev => prev.map(s => {
                if (s.id === currentSessionId) {
                    const msgs = s.messages.map(m => 
                        m.id === botMessageId ? { ...m, content: errorMsg, isError: true } : m
                    );
                    return { ...s, messages: msgs };
                }
                return s;
            }));
            setIsLoading(false);
        }
    );
  };

  const handleDownload = () => {
    const session = getCurrentSession();
    if (!session) return;
    
    const content = session.messages.map(m => `## ${m.role.toUpperCase()}\n\n${m.content}\n`).join('\n---\n\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const deleteChat = (id: string) => {
    setSessions(prev => {
        const newSessions = prev.filter(s => s.id !== id);
        if (currentSessionId === id) {
            setCurrentSessionId(newSessions.length > 0 ? newSessions[0].id : null);
        }
        return newSessions;
    });
    if (sessions.length <= 1) {
        // If we deleted the last one, create a new blank one immediately after state update cycle
        setTimeout(createNewChat, 0);
    }
  };

  const currentSession = getCurrentSession();

  return (
    <div className="flex h-screen w-full bg-white text-gray-900 font-sans">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={createNewChat}
        onSelectChat={setCurrentSessionId}
        onDeleteChat={deleteChat}
        onDownload={handleDownload}
        config={config}
        onUpdateConfig={setConfig}
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white z-10">
             <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-gray-900">
                <Menu />
             </button>
             <span className="font-semibold text-sm text-gray-800">{currentSession?.title || '新对话'}</span>
             <div className="w-6"></div> {/* Spacer */}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin pb-40">
           {currentSession?.messages.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-70 select-none">
                    <div className="bg-gray-100 p-4 rounded-full mb-4 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-900">九鼎IT大模型语义层</h2>
                    <p className="text-sm text-gray-500">开启“进一步解释”以获取详细来源。</p>
               </div>
           ) : (
               <div className="flex flex-col pt-4">
                 {currentSession?.messages.map((msg) => (
                   <MessageBubble key={msg.id} message={msg} />
                 ))}
                 {/* Invisible element to scroll to */}
                 <div ref={messagesEndRef} className="h-4" />
               </div>
           )}
        </div>
        
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </main>
    </div>
  );
};

export default App;