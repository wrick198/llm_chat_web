
import React from 'react';
import { X, MessageSquare, Database, Cpu } from 'lucide-react';
import { InterfaceType } from '../types';

interface NewChatModalProps {
  onSelect: (type: InterfaceType, url: string, name: string) => void;
  onClose: () => void;
}

const INTERFACES = [
  {
    type: InterfaceType.Semantic,
    name: '语义转换',
    url: 'http://10.17.49.217:28001/v1/query/semantic',
    icon: <MessageSquare className="text-blue-500" size={24} />,
    desc: '将自然语言转换为标准语义结构'
  },
  {
    type: InterfaceType.BSS30,
    name: 'BSS3.0模型问答',
    url: 'http://10.17.49.217:28001/v1/query/rag-knowledge',
    icon: <Database className="text-emerald-500" size={24} />,
    desc: '基于知识库的业务模型深度问答'
  },
  {
    type: InterfaceType.API,
    name: 'API接口查询',
    url: 'http://10.17.49.217:28001/v1/query/interface',
    icon: <Cpu className="text-purple-500" size={24} />,
    desc: '查询系统API定义与接口详情'
  }
];

const NewChatModal: React.FC<NewChatModalProps> = ({ onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">新建对话</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 flex flex-col gap-3">
          <p className="text-sm text-gray-500 px-2 mb-1">请选择此会话要绑定的模型接口：</p>
          {INTERFACES.map((item) => (
            <button
              key={item.type}
              onClick={() => onSelect(item.type, item.url, item.name)}
              className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left group"
            >
              <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-white transition-colors">
                {item.icon}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{item.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
              </div>
            </button>
          ))}
        </div>
        
        <div className="p-4 bg-gray-50 text-center">
          <p className="text-[10px] text-gray-400">选择后该对话将固定使用此接口，不可更改</p>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
