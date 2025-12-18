
import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Sparkles } from 'lucide-react';
import { InterfaceType } from '../types';

interface ChatInputProps {
  onSend: (text: string, enableSemanticThinking: boolean) => void;
  isLoading: boolean;
  interfaceType: InterfaceType | undefined;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, interfaceType }) => {
  const [input, setInput] = useState('');
  const [enableThinking, setEnableThinking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSend(input, enableThinking);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Only show buttons for Semantic Translation interface
  const showToggles = interfaceType === InterfaceType.Semantic;

  return (
    <div className="absolute bottom-0 left-0 w-full bg-white pt-2 pb-6 px-4 z-20">
      <div className="md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem] mx-auto w-full flex flex-col gap-3">
        
        <div className="relative flex flex-col w-full bg-[#f0f4f9] rounded-[2rem] hover:bg-[#e9eef6] focus-within:bg-[#e9eef6] transition-colors border border-transparent focus-within:border-gray-200">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="请输入..."
            className="w-full max-h-[200px] bg-transparent border-0 focus:ring-0 resize-none py-4 pl-6 pr-14 text-gray-900 placeholder-gray-500 outline-none text-[16px]"
            disabled={isLoading}
          />
          
          <div className="absolute right-2 bottom-2">
            <button
                onClick={handleSubmit}
                disabled={!input.trim() && !isLoading}
                className={`p-2 rounded-full transition-all flex items-center justify-center ${
                input.trim() || isLoading
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                    : 'bg-transparent text-gray-400 cursor-not-allowed'
                }`}
            >
                {isLoading ? <Square size={18} className="animate-pulse" fill="currentColor" /> : <Send size={18} />}
            </button>
          </div>
        </div>

        {showToggles && (
            <div className="flex items-center gap-3 px-2 overflow-x-auto scrollbar-hide animate-in slide-in-from-bottom-2 duration-300">
                <button
                    onClick={() => setEnableThinking(!enableThinking)}
                    disabled={isLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border select-none whitespace-nowrap ${
                        enableThinking 
                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <Sparkles size={16} className={enableThinking ? "fill-blue-200" : ""} />
                    语义规范
                </button>
            </div>
        )}
        
        <div className="text-center">
           <span className="text-[10px] text-gray-400">内容由AI生成，请核查其给出的回答。</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
