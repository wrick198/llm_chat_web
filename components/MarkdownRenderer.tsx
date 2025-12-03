import React, { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

// 提取代码块组件以处理复制状态
const CodeBlock = ({ language, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = String(children).replace(/\n$/, '');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-gray-200/20 bg-[#0d0d0d] shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] text-xs text-gray-200 select-none">
        <span className="font-sans text-gray-400">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
          title="Copy code"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy code'}</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: '1rem',
            backgroundColor: 'transparent',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            borderRadius: 0,
          }}
          wrapLongLines={true}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    // 使用 Tailwind Typography 插件的 prose 类，并进行定制覆盖
    <div className="prose prose-slate max-w-none 
      prose-p:leading-7 prose-p:mb-4 prose-p:text-gray-800 
      prose-headings:text-gray-900 prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-4
      prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
      prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
      prose-li:my-1 prose-li:text-gray-800
      prose-strong:font-bold prose-strong:text-gray-900
      prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
      text-[15px] leading-relaxed text-gray-800"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');

            return !isInline && match ? (
              <CodeBlock language={match[1]} {...props}>
                {children}
              </CodeBlock>
            ) : (
              <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-[0.85em] font-mono border border-gray-200" {...props}>
                {children}
              </code>
            );
          },
          // 表格样式优化
          table: ({ node, ...props }) => (
            <div className="my-6 w-full overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-left text-sm" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-50 border-b border-gray-200" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-gray-100 bg-white" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-gray-50/50 transition-colors" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-3 font-semibold text-gray-900 border-r border-gray-200 last:border-r-0 whitespace-nowrap" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-3 text-gray-700 border-r border-gray-100 last:border-r-0 align-top" {...props} />
          ),
          // 引用块样式
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 py-1 my-4 text-gray-600 bg-transparent italic" {...props} />
          ),
          // 链接样式
          a: ({ node, ...props }) => (
             <a target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors" {...props} />
          ),
          // 列表样式
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default memo(MarkdownRenderer);