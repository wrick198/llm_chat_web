
import React, { useState } from 'react';
import { MessageSquare, Plus, Trash2, Download, Settings, X, Edit3, Check } from 'lucide-react';
import { ChatSession, AppConfig } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChatClick: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onUpdateTitle: (id: string, newTitle: string) => void;
  onDownload: () => void;
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onNewChatClick,
  onSelectChat,
  onDeleteChat,
  onUpdateTitle,
  onDownload,
  config,
  onUpdateConfig,
  isOpen,
  toggleSidebar
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleStartEdit = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditValue(session.title);
  };

  const handleSaveEdit = (id: string) => {
    if (editValue.trim()) {
      onUpdateTitle(id, editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <>
     {isOpen && (
        <div className="fixed inset-0 bg-gray-900/50 z-40 md:hidden" onClick={toggleSidebar} />
     )}

    <div className={`fixed md:static inset-y-0 left-0 z-50 w-[260px] bg-gray-50 border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col shadow-sm md:shadow-none`}>
      <div className="p-3">
        <button
          onClick={onNewChatClick}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-md border border-gray-300 hover:bg-gray-200 transition-colors text-sm text-gray-800 font-medium text-left mb-2 shadow-sm bg-white"
        >
          <Plus size={16} />
          新建对话
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3">
        <div className="flex flex-col gap-2 pb-2 text-gray-700 text-sm">
          {sessions.length === 0 && (
            <div className="text-gray-400 text-center mt-4 text-xs">暂无历史记录</div>
          )}
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group relative flex items-center gap-3 px-3 py-3 rounded-md cursor-pointer hover:bg-gray-200 transition-colors overflow-hidden ${
                currentSessionId === session.id ? 'bg-gray-200 font-medium text-gray-900' : ''
              }`}
              onClick={() => {
                  onSelectChat(session.id);
                  if(window.innerWidth < 768) toggleSidebar();
              }}
            >
              <MessageSquare size={16} className={`shrink-0 ${currentSessionId === session.id ? 'text-gray-800' : 'text-gray-400'}`} />
              
              <div className="flex-1 truncate relative z-10 pr-10">
                {editingId === session.id ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleSaveEdit(session.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(session.id)}
                    className="w-full bg-white border border-blue-400 rounded px-1 outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    {session.title}
                    <div className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 via-transparent to-transparent group-hover:from-gray-200 ${currentSessionId === session.id ? 'from-gray-200' : ''}`}></div>
                  </>
                )}
              </div>
              
              <div className="absolute right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {editingId !== session.id ? (
                  <>
                    <button 
                        className="text-gray-400 hover:text-blue-600"
                        onClick={(e) => handleStartEdit(e, session)}
                    >
                        <Edit3 size={14} />
                    </button>
                    <button 
                        className="text-gray-400 hover:text-red-500"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(session.id);
                        }}
                    >
                        <Trash2 size={14} />
                    </button>
                  </>
                ) : (
                  <button className="text-blue-600"><Check size={14}/></button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <button onClick={onDownload} className="flex items-center gap-3 w-full px-3 py-3 rounded-md hover:bg-gray-200 transition-colors text-sm text-gray-700 text-left">
            <Download size={16} />
            下载对话
        </button>
        <button onClick={() => setShowSettings(!showSettings)} className="flex items-center gap-3 w-full px-3 py-3 rounded-md hover:bg-gray-200 transition-colors text-sm text-gray-700 text-left mt-1">
            <Settings size={16} />
            设置
        </button>
      </div>

      {showSettings && (
        <div className="absolute bottom-14 left-2 right-2 bg-white p-4 rounded-lg border border-gray-200 shadow-xl z-50">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-gray-800">全局配置</h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600"><X size={14}/></button>
            </div>
            <div className="space-y-3">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">后端开关</label>
                    <select 
                        className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-sm text-gray-800"
                        value={config.useCustomBackend ? 'custom' : 'gemini'}
                        onChange={(e) => onUpdateConfig({...config, useCustomBackend: e.target.value === 'custom'})}
                    >
                        <option value="gemini">Gemini API (Demo)</option>
                        <option value="custom">启用私有后端</option>
                    </select>
                </div>
            </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Sidebar;
