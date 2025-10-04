import { useEffect, useRef } from 'react';
import { Terminal, AlertCircle, CheckCircle, Info, Sparkles } from 'lucide-react';
import { ConsoleMessage } from '../types';

interface ConsoleProps {
  messages: ConsoleMessage[];
  theme: 'light' | 'dark';
  onClear: () => void;
}

export function Console({ messages, theme, onClear }: ConsoleProps) {
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [messages]);

  const getIcon = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'ai':
        return <Sparkles className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTextColor = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'ai':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`flex items-center justify-between px-4 py-2 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <span className="text-sm font-medium">Console</span>
        </div>
        <button
          onClick={onClear}
          className={`text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
        >
          Clear
        </button>
      </div>
      <div
        ref={consoleRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-2"
      >
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            Console output will appear here
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-2">
              {getIcon(msg.type)}
              <div className="flex-1">
                <span className={getTextColor(msg.type)}>{msg.message}</span>
                <span className="text-gray-400 text-xs ml-2">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
