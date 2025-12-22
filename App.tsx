
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Menu, MessageSquare } from 'lucide-react';
import ChatInput from './components/ChatInput';
import MessageBubble from './components/MessageBubble';
import Sidebar from './components/Sidebar';
import NewChatModal from './components/NewChatModal';
import { Message, Role, ChatSession, AppConfig, InterfaceType } from './types';
import { streamChatResponse } from './services/apiService';

const App: React.FC = () => {
  // Lazy initialize sessions from localStorage to prevent overwriting on initial render
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('chat_sessions_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load sessions:", e);
      return [];
    }
  });

  // Initialize currentSessionId based on the loaded sessions
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    try {
        const saved = localStorage.getItem('chat_sessions_v2');
        const parsed = saved ? JSON.parse(saved) : [];
        return parsed.length > 0 ? parsed[0].id : null;
    } catch {
        return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Lazy initialize config
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
        const saved = localStorage.getItem('chat_config_v2');
        return saved ? JSON.parse(saved) : {
            useCustomBackend: true,
            backendUrl: '',
            apiKey: ''
        };
    } catch {
        return {
            useCustomBackend: true,
            backendUrl: '',
            apiKey: ''
        };
    }
  });

  // Save to localStorage whenever sessions or config change
  useEffect(() => {
    localStorage.setItem('chat_sessions_v2', JSON.stringify(sessions));
    localStorage.setItem('chat_config_v2', JSON.stringify(config));
  }, [sessions, config]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, currentSessionId]);

  const handleCreateNewChat = (type: InterfaceType, url: string, name: string) => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: `${name} 对话`,
      messages: [],
      updatedAt: Date.now(),
      interfaceType: type,
      backendUrl: url
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setShowNewChatModal(false);
  };

  const updateSessionTitle = (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  const getCurrentSession = () => sessions.find(s => s.id === currentSessionId);

  const updateMessages = (newMessages: Message[]) => {
    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        return { ...session, messages: newMessages, updatedAt: Date.now() };
      }
      return session;
    }));
  };

  const handleSend = async (text: string, enableSemanticThinking: boolean) => {
    const session = getCurrentSession();
    if (!session) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: Role.User,
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...session.messages, userMessage];
    updateMessages(updatedMessages);
    setIsLoading(true);

    const botMessageId = uuidv4();
    const botMessage: Message = {
      id: botMessageId,
      role: Role.Assistant,
      content: '',
      timestamp: Date.now(),
    };

    updateMessages([...updatedMessages, botMessage]);

    let accumulatedText = '';

    await streamChatResponse(
        { 
          text, 
          enable_semantic_thinking: session.interfaceType === InterfaceType.Semantic ? enableSemanticThinking : false,
          stream: true
        },
        config,
        session.backendUrl,
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
        () => setIsLoading(false),
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

  const currentSession = getCurrentSession();

  return (
    <div className="flex h-screen w-full bg-white text-gray-900 font-sans">
      {showNewChatModal && (
        <NewChatModal 
          onSelect={handleCreateNewChat} 
          onClose={() => setShowNewChatModal(false)} 
        />
      )}

      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChatClick={() => setShowNewChatModal(true)}
        onSelectChat={setCurrentSessionId}
        onDeleteChat={(id) => setSessions(prev => prev.filter(s => s.id !== id))}
        onUpdateTitle={updateSessionTitle}
        onDownload={() => {}}
        config={config}
        onUpdateConfig={setConfig}
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white z-10">
             <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-600">
                <Menu />
             </button>
             <div className="flex flex-col items-center md:items-start">
                <span className="font-semibold text-sm text-gray-800">{currentSession?.title || '九鼎IT大模型'}</span>
                {currentSession && (
                   <span className="text-[10px] text-gray-400">接口: {currentSession.backendUrl}</span>
                )}
             </div>
             <div className="w-6"></div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin pb-48">
           {!currentSession ? (
               <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-70 select-none">
                    <div className="bg-blue-50 p-6 rounded-full mb-6 text-blue-500">
                        <MessageSquare size={48} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">欢迎使用九鼎IT大模型</h2>
                    <p className="text-sm text-gray-500">点击左侧“新建对话”开始体验不同模型接口</p>
               </div>
           ) : currentSession.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <h2 className="text-xl font-bold text-gray-400 mb-2">{currentSession.title}</h2>
                    <p className="text-xs text-gray-400">当前对话已绑定特定接口，请在下方开始输入</p>
                </div>
           ) : (
               <div className="flex flex-col pt-4">
                 {currentSession.messages.map((msg) => (
                   <MessageBubble key={msg.id} message={msg} />
                 ))}
                 <div ref={messagesEndRef} className="h-4" />
               </div>
           )}
        </div>
        
        <ChatInput 
          onSend={handleSend} 
          isLoading={isLoading} 
          interfaceType={currentSession?.interfaceType} 
        />
      </main>
    </div>
  );
};

export default App;
