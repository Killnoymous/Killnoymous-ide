import { useState, useEffect } from 'react';
import { Bot, Send, Sparkles, Code, Lightbulb, Zap } from 'lucide-react';
import { AIFixSuggestion } from '../types';
import { FreeAIService } from '../utils/freeAIService';

interface AIAssistantProps {
  code: string;
  errors: any[];
  theme: 'light' | 'dark';
  onApplySuggestion: (suggestion: AIFixSuggestion) => void;
}

interface AISuggestion {
  id: string;
  type: 'completion' | 'fix' | 'optimization' | 'explanation';
  title: string;
  description: string;
  code?: string;
  line?: number;
  confidence: number;
}

export function AIAssistant({ code, errors, theme, onApplySuggestion }: AIAssistantProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Real-time code analysis
  useEffect(() => {
    if (code.length > 10) {
      analyzeCode();
    }
  }, [code]);

  const analyzeCode = async () => {
    setIsLoading(true);
    try {
      // Simulate AI analysis with enhanced suggestions
      const newSuggestions = await generateSmartSuggestions(code, errors);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSmartSuggestions = async (code: string, _errors: any[]): Promise<AISuggestion[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const suggestions: AISuggestion[] = [];
        const lines = code.split('\n');

        // Analyze each line for improvements
        lines.forEach((line, index) => {
          const lineNum = index + 1;
          const trimmed = line.trim();

          // Suggest variable declarations
          if (trimmed.includes('=') && !trimmed.includes('int ') && !trimmed.includes('float ') && 
              !trimmed.includes('bool ') && !trimmed.includes('char ') && !trimmed.includes('String ')) {
            const varName = trimmed.split('=')[0].trim();
            if (varName && !varName.includes(' ') && !varName.includes('void') && !varName.includes('(')) {
              const indentation = line.match(/^\s*/)?.[0] || '';
              const fixedLine = indentation + `int ${trimmed}`;
              
              suggestions.push({
                id: `var-${lineNum}`,
                type: 'fix',
                title: `Add variable type for ${varName}`,
                description: `Declare ${varName} with proper data type`,
                code: fixedLine,
                line: lineNum,
                confidence: 0.9
              });
            }
          }

          // Suggest missing semicolons (more accurate)
          const needsSemicolon = trimmed && 
            !trimmed.endsWith(';') && 
            !trimmed.endsWith('{') && 
            !trimmed.endsWith('}') &&
            !trimmed.startsWith('//') && 
            !trimmed.startsWith('/*') && 
            !trimmed.includes('void setup') &&
            !trimmed.includes('void loop') && 
            !trimmed.includes('if (') && 
            !trimmed.includes('else') &&
            !trimmed.includes('for (') && 
            !trimmed.includes('while (') &&
            !trimmed.includes('#include') && 
            !trimmed.includes('#define') &&
            (trimmed.includes('=') || 
             trimmed.includes('pinMode') || 
             trimmed.includes('digitalWrite') || 
             trimmed.includes('Serial.') ||
             trimmed.includes('delay('));

          if (needsSemicolon) {
            // Preserve original indentation
            const indentation = line.match(/^\s*/)?.[0] || '';
            const fixedLine = indentation + trimmed + ';';
            
            suggestions.push({
              id: `semicolon-${lineNum}`,
              type: 'fix',
              title: 'Add missing semicolon',
              description: 'Statement should end with semicolon',
              code: fixedLine,
              line: lineNum,
              confidence: 0.95
            });
          }

          // Suggest Arduino function fixes
          if (trimmed.includes('pinMode')) {
            if (!trimmed.includes('(') || !trimmed.includes(')')) {
              suggestions.push({
                id: `pinmode-paren-${lineNum}`,
                type: 'fix',
                title: 'Fix pinMode syntax - add parentheses',
                description: 'pinMode function needs parentheses',
                code: trimmed.replace('pinMode', 'pinMode(pin, mode)'),
                line: lineNum,
                confidence: 0.9
              });
            } else if (trimmed.includes('pinMode(') && !trimmed.includes(',')) {
              // Try to fix common pinMode patterns
              if (trimmed.match(/pinMode\(\s*\d+\s+\w+\s*\)/)) {
                const indentation = line.match(/^\s*/)?.[0] || '';
                const fixed = trimmed.replace(/pinMode\((\s*\d+)\s+(\w+)\s*\)/, 'pinMode($1, $2)');
                const fixedLine = indentation + fixed;
                
                suggestions.push({
                  id: `pinmode-comma-${lineNum}`,
                  type: 'fix',
                  title: 'Fix pinMode syntax - add comma',
                  description: 'pinMode requires comma between pin and mode',
                  code: fixedLine,
                  line: lineNum,
                  confidence: 0.95
                });
              } else {
                suggestions.push({
                  id: `pinmode-comma-${lineNum}`,
                  type: 'fix',
                  title: 'Fix pinMode syntax',
                  description: 'pinMode requires two parameters: pinMode(pin, mode)',
                  code: 'pinMode(pin, OUTPUT); // Example: replace with actual pin number',
                  line: lineNum,
                  confidence: 0.8
                });
              }
            }
          }

          if (trimmed.includes('digitalWrite')) {
            if (!trimmed.includes('(') || !trimmed.includes(')')) {
              suggestions.push({
                id: `digitalwrite-paren-${lineNum}`,
                type: 'fix',
                title: 'Fix digitalWrite syntax - add parentheses',
                description: 'digitalWrite function needs parentheses',
                code: trimmed.replace('digitalWrite', 'digitalWrite(pin, value)'),
                line: lineNum,
                confidence: 0.9
              });
            } else if (trimmed.includes('digitalWrite(') && !trimmed.includes(',')) {
              // Try to fix common digitalWrite patterns
              if (trimmed.match(/digitalWrite\(\s*\d+\s+\w+\s*\)/)) {
                const indentation = line.match(/^\s*/)?.[0] || '';
                const fixed = trimmed.replace(/digitalWrite\((\s*\d+)\s+(\w+)\s*\)/, 'digitalWrite($1, $2)');
                const fixedLine = indentation + fixed;
                
                suggestions.push({
                  id: `digitalwrite-comma-${lineNum}`,
                  type: 'fix',
                  title: 'Fix digitalWrite syntax - add comma',
                  description: 'digitalWrite requires comma between pin and value',
                  code: fixedLine,
                  line: lineNum,
                  confidence: 0.95
                });
              } else {
                suggestions.push({
                  id: `digitalwrite-comma-${lineNum}`,
                  type: 'fix',
                  title: 'Fix digitalWrite syntax',
                  description: 'digitalWrite requires two parameters: digitalWrite(pin, value)',
                  code: 'digitalWrite(pin, HIGH); // Example: replace with actual pin number',
                  line: lineNum,
                  confidence: 0.8
                });
              }
            }
          }

          // Suggest Serial.begin if missing
          if (trimmed.includes('void setup()') && !code.includes('Serial.begin')) {
            // Insert Serial.begin inside the setup function, not after it
            const nextLineIndex = lineNum; // lineNum is already 1-based, so this points to next line
            if (nextLineIndex <= lines.length) {
              suggestions.push({
                id: 'serial-begin',
                type: 'optimization',
                title: 'Add Serial.begin for debugging',
                description: 'Enable serial communication for debugging',
                code: '  Serial.begin(9600);',
                line: nextLineIndex,
                confidence: 0.8
              });
            }
          }
        });

        // Add contextual suggestions
        if (!code.includes('void setup()')) {
          suggestions.push({
            id: 'setup-function',
            type: 'completion',
            title: 'Add setup() function',
            description: 'Arduino sketches require setup() function',
            code: 'void setup() {\n  // Initialization code here\n  Serial.begin(9600);\n}',
            line: 1,
            confidence: 0.95
          });
        }

        if (!code.includes('void loop()')) {
          const insertLine = lines.length > 0 ? lines.length : 1;
          suggestions.push({
            id: 'loop-function',
            type: 'completion',
            title: 'Add loop() function',
            description: 'Arduino sketches require loop() function',
            code: '\nvoid loop() {\n  // Main code here\n}',
            line: insertLine,
            confidence: 0.95
          });
        }

        resolve(suggestions.slice(0, 5)); // Limit to 5 suggestions
      }, 500);
    });
  };

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    if (suggestion.code) {
      console.log('🤖 AI Assistant applying suggestion:', suggestion);
      const lines = code.split('\n');
      const targetLineIndex = (suggestion.line || 1) - 1;
      
      // Get the original line content if it exists
      let originalContent = '';
      if (targetLineIndex >= 0 && targetLineIndex < lines.length) {
        originalContent = lines[targetLineIndex];
      }
      
      console.log(`🎯 AI Assistant - Line ${suggestion.line}: "${originalContent}" → "${suggestion.code}"`);
      
      const aiSuggestion: AIFixSuggestion = {
        line: suggestion.line || 1,
        original: originalContent,
        fixed: suggestion.code,
        explanation: suggestion.description
      };
      
      console.log('📤 AI Assistant sending suggestion to App:', aiSuggestion);
      onApplySuggestion(aiSuggestion);
    }
  };

  const handleUserQuery = async () => {
    if (!userQuery.trim()) return;
    
    setIsLoading(true);
    try {
      // Simulate AI response to user query
      const response = await generateResponseToQuery(userQuery, code);
      setSuggestions(prev => [response, ...prev.slice(0, 4)]);
      setUserQuery('');
    } catch (error) {
      console.error('Query processing failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateResponseToQuery = async (query: string, code: string): Promise<AISuggestion> => {
    try {
      // Try to use free AI service for better responses
      const aiResponse = await FreeAIService.explainCode(code);
      
      return {
        id: 'ai-response',
        type: 'explanation',
        title: 'AI Explanation',
        description: aiResponse,
        confidence: 0.9
      };
    } catch (error) {
      // Fallback to simple responses
      let response: AISuggestion;
      
      if (query.toLowerCase().includes('led')) {
        response = {
          id: 'led-help',
          type: 'explanation',
          title: 'LED Control Help',
          description: 'Here\'s how to control LEDs in Arduino',
          code: 'digitalWrite(ledPin, HIGH); // Turn LED ON\ndigitalWrite(ledPin, LOW); // Turn LED OFF',
          confidence: 0.9
        };
      } else if (query.toLowerCase().includes('sensor')) {
        response = {
          id: 'sensor-help',
          type: 'explanation',
          title: 'Sensor Reading Help',
          description: 'Here\'s how to read sensors in Arduino',
          code: 'int sensorValue = analogRead(sensorPin);\nSerial.println(sensorValue);',
          confidence: 0.9
        };
      } else {
        response = {
          id: 'general-help',
          type: 'explanation',
          title: 'Arduino Help',
          description: 'I can help you with Arduino code. Try asking about LEDs, sensors, motors, or specific functions.',
          confidence: 0.7
        };
      }
      
      return response;
    }
  };

  return (
    <div className={`fixed right-4 top-20 w-80 max-h-[600px] rounded-lg shadow-xl border overflow-hidden z-20 ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-blue-50'
      }`}>
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-sm">AI Assistant</h3>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded transition-colors"
        >
          <Zap className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Input */}
      <div className={`p-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex gap-2">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleUserQuery()}
            placeholder="Ask AI anything about your code..."
            className={`flex-1 px-3 py-2 text-sm rounded border ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
          <button
            onClick={handleUserQuery}
            disabled={isLoading || !userQuery.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggestions */}
      <div className="overflow-y-auto max-h-[400px] p-3 space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-500">Analyzing code...</span>
          </div>
        )}

        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={`p-3 rounded-lg border ${
              theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {suggestion.type === 'fix' && <Code className="w-3 h-3 text-red-500" />}
                {suggestion.type === 'completion' && <Sparkles className="w-3 h-3 text-blue-500" />}
                {suggestion.type === 'optimization' && <Lightbulb className="w-3 h-3 text-yellow-500" />}
                {suggestion.type === 'explanation' && <Bot className="w-3 h-3 text-green-500" />}
                <span className="text-xs font-medium text-blue-600">
                  {suggestion.type === 'fix' ? 'Fix' : 
                   suggestion.type === 'completion' ? 'Complete' :
                   suggestion.type === 'optimization' ? 'Optimize' : 'Explain'}
                </span>
                {suggestion.line && (
                  <span className="text-xs text-gray-500">Line {suggestion.line}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  suggestion.confidence > 0.8 ? 'bg-green-500' : 
                  suggestion.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-xs text-gray-500">
                  {Math.round(suggestion.confidence * 100)}%
                </span>
              </div>
            </div>

            <h4 className="text-sm font-medium mb-1">{suggestion.title}</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {suggestion.description}
            </p>

            {suggestion.code && (
              <div className="mb-2">
                <pre className={`text-xs p-2 rounded overflow-x-auto ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <code className="text-green-600 dark:text-green-400">{suggestion.code}</code>
                </pre>
              </div>
            )}

            <button
              onClick={() => handleApplySuggestion(suggestion)}
              className="w-full px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Apply Suggestion
            </button>
          </div>
        ))}

        {suggestions.length === 0 && !isLoading && (
          <div className="text-center py-4 text-gray-500 text-sm">
            <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>AI is analyzing your code...</p>
            <p className="text-xs">Ask me anything about Arduino!</p>
          </div>
        )}
      </div>
    </div>
  );
}
