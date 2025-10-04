import { useState } from 'react';
import { Sparkles, X, Check, Copy } from 'lucide-react';
import { AIFixSuggestion } from '../types';

interface AIPanelProps {
  suggestions: AIFixSuggestion[];
  onApplyFix: (suggestion: AIFixSuggestion) => void;
  onClose: () => void;
  theme: 'light' | 'dark';
}

export function AIPanel({ suggestions, onApplyFix, onClose, theme }: AIPanelProps) {
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<number>>(new Set());
  const [isApplying, setIsApplying] = useState<Set<number>>(new Set());

  const handleApply = async (index: number, suggestion: AIFixSuggestion) => {
    setIsApplying(new Set([index]));
    try {
      await onApplyFix(suggestion);
      setAppliedSuggestions(new Set(appliedSuggestions).add(index));
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
    } finally {
      setIsApplying(new Set());
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <div className={`absolute right-4 top-20 w-96 max-h-[600px] rounded-lg shadow-xl border overflow-hidden z-10 ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-blue-50'
      }`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-sm">AI Suggestions</h3>
        </div>
        <button
          onClick={onClose}
          className="hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-y-auto max-h-[520px] p-4 space-y-4">
        {suggestions.map((suggestion, index) => {
          const isApplied = appliedSuggestions.has(index);
          const isApplyingFix = isApplying.has(index);

          return (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
              } ${isApplied ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-medium text-blue-600">Line {suggestion.line}</span>
                <button
                  onClick={() => handleApply(index, suggestion)}
                  disabled={isApplied || isApplyingFix}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                    isApplied
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : isApplyingFix
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isApplied ? (
                    <>
                      <Check className="w-3 h-3" />
                      Applied
                    </>
                  ) : isApplyingFix ? (
                    <>
                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Apply Fix
                    </>
                  )}
                </button>
              </div>

              <p className="text-sm mb-3">{suggestion.explanation}</p>

              {suggestion.original && (
                <div className="mb-2">
                  <div className="text-xs text-gray-500 mb-1">Original:</div>
                  <pre className={`text-xs p-2 rounded overflow-x-auto ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                  }`}>
                    <code className="text-red-600 dark:text-red-400">{suggestion.original}</code>
                  </pre>
                </div>
              )}

              <div>
                <div className="text-xs text-gray-500 mb-1">Fixed:</div>
                <pre className={`text-xs p-2 rounded overflow-x-auto ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <code className="text-green-600 dark:text-green-400">{suggestion.fixed}</code>
                </pre>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
