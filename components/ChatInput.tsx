import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string, enableOriginExplanation: boolean) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');
  const [enableExplanation, setEnableExplanation] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSend(input, enableExplanation);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-4">
      <div className="md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem] mx-auto w-full">
        
        {/* Controls Bar */}
        <div className="flex justify-between items-center mb-2 px-2">
             <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={enableExplanation}
                        onChange={(e) => setEnableExplanation(e.target.checked)}
                        disabled={isLoading}
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </div>
                <span className={`text-xs font-medium ${enableExplanation ? 'text-emerald-600' : 'text-gray-500'} group-hover:text-gray-800 transition-colors`}>
                    进一步解释
                </span>
            </label>
        </div>

        {/* Input Box */}
        <div className="relative flex items-end w-full p-3 bg-white rounded-xl border border-gray-300 shadow-lg focus-within:border-gray-400 focus-within:shadow-xl transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            className="w-full max-h-[200px] bg-transparent border-0 focus:ring-0 resize-none py-3 pr-10 text-gray-900 placeholder-gray-400 scrollbar-hide outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() && !isLoading}
            className={`absolute right-3 bottom-3 p-2 rounded-lg transition-colors ${
              input.trim() || isLoading
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? <Square size={16} className="animate-pulse" fill="currentColor" /> : <Send size={16} />}
          </button>
        </div>
        <div className="text-center pt-2">
           <span className="text-xs text-gray-400">模型可能会犯错，请核查重要信息。</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;