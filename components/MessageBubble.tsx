import React from 'react';
import { Message, Role } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { User, Bot, AlertCircle } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.User;

  return (
    <div className={`group w-full text-gray-900 border-b border-gray-100 ${isUser ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="flex gap-4 p-4 md:gap-6 md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem] m-auto">
        <div className="flex-shrink-0 flex flex-col relative items-end">
          <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${isUser ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
            {isUser ? <User size={20} color="white" /> : <Bot size={20} color="white" />}
          </div>
        </div>
        <div className="relative flex-1 overflow-hidden break-words">
          <div className="min-h-[20px] flex flex-col items-start gap-4">
            <div className="w-full">
              {message.isError ? (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded border border-red-200">
                    <AlertCircle size={18} />
                    <span>{message.content}</span>
                </div>
              ) : (
                <MarkdownRenderer content={message.content} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;