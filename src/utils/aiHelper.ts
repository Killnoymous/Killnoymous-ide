import { CompilationError, AIFixSuggestion } from '../types';
import { FreeAIService } from './freeAIService';

export class AIHelper {
  static async analyzeAndFix(code: string, errors: CompilationError[]): Promise<AIFixSuggestion[]> {
    try {
      // First try to get AI-powered suggestions
      const aiSuggestions = await this.getAIPoweredFixes(code, errors);
      if (aiSuggestions.length > 0) {
        return aiSuggestions;
      }
      
      // Fallback to rule-based fixes
      return this.getRuleBasedFixes(code, errors);
    } catch (error) {
      console.warn('AI analysis failed, falling back to rule-based fixes:', error);
      return this.getRuleBasedFixes(code, errors);
    }
  }

  private static async getAIPoweredFixes(code: string, errors: CompilationError[]): Promise<AIFixSuggestion[]> {
    // Try to use free AI service for better suggestions
    try {
      const aiSuggestions: AIFixSuggestion[] = [];
      
      for (const error of errors) {
        const aiExplanation = await FreeAIService.generateCodeSuggestion(code, error.message);
        const suggestion = this.createSuggestionFromAI(code, error, aiExplanation);
        if (suggestion) {
          aiSuggestions.push(suggestion);
        }
      }
      
      if (aiSuggestions.length > 0) {
        return aiSuggestions;
      }
    } catch (error) {
      console.warn('AI service failed, falling back to rule-based fixes:', error);
    }
    
    // Fallback to enhanced rule-based fixes
    return this.getEnhancedRuleBasedFixes(code, errors);
  }

  private static createSuggestionFromAI(code: string, error: CompilationError, aiExplanation: string): AIFixSuggestion | null {
    const lines = code.split('\n');
    const line = lines[error.line - 1] || '';
    
    // Create suggestion based on AI explanation
    if (error.message.includes('Expected `;`')) {
      return {
        line: error.line,
        original: line,
        fixed: line + ';',
        explanation: aiExplanation
      };
    } else if (error.message.includes('pinMode')) {
      const fixedLine = line.replace('pinMode(', 'pinMode(').replace(' ', ', ');
      return {
        line: error.line,
        original: line,
        fixed: fixedLine,
        explanation: aiExplanation
      };
    } else if (error.message.includes('digitalWrite')) {
      const fixedLine = line.replace('digitalWrite(', 'digitalWrite(').replace(' ', ', ');
      return {
        line: error.line,
        original: line,
        fixed: fixedLine,
        explanation: aiExplanation
      };
    }
    
    return null;
  }

  private static getRuleBasedFixes(code: string, errors: CompilationError[]): AIFixSuggestion[] {
    const suggestions: AIFixSuggestion[] = [];
    const lines = code.split('\n');

    errors.forEach(error => {
      const line = lines[error.line - 1] || '';
      let suggestion: AIFixSuggestion | null = null;

      if (error.message.includes('Expected `;`')) {
        suggestion = {
          line: error.line,
          original: line,
          fixed: line + ';',
          explanation: 'Added missing semicolon at end of statement'
        };
      } else if (error.message.includes('void setup()')) {
        suggestion = {
          line: 1,
          original: '',
          fixed: 'void setup() {\n  // Initialization code here\n  Serial.begin(9600);\n}',
          explanation: 'Added required setup() function'
        };
      } else if (error.message.includes('void loop()')) {
        suggestion = {
          line: 1,
          original: '',
          fixed: '\nvoid loop() {\n  // Main code here\n}',
          explanation: 'Added required loop() function'
        };
      } else if (error.message.includes('unclosed brace')) {
        suggestion = {
          line: error.line,
          original: line,
          fixed: line + '\n}',
          explanation: 'Added missing closing brace'
        };
      }

      if (suggestion) {
        suggestions.push(suggestion);
      }
    });

    return suggestions;
  }

  private static getEnhancedRuleBasedFixes(code: string, errors: CompilationError[]): AIFixSuggestion[] {
    const suggestions: AIFixSuggestion[] = [];
    const lines = code.split('\n');

    errors.forEach(error => {
      const line = lines[error.line - 1] || '';
      let suggestion: AIFixSuggestion | null = null;

      // Enhanced error detection and fixes
      if (error.message.includes('Expected `;`')) {
        suggestion = {
          line: error.line,
          original: line,
          fixed: line + ';',
          explanation: 'Added missing semicolon at end of statement'
        };
      } else if (error.message.includes('void setup()')) {
        const hasSerialBegin = code.includes('Serial.begin');
        const setupCode = hasSerialBegin 
          ? 'void setup() {\n  // Initialization code here\n}'
          : 'void setup() {\n  // Initialization code here\n  Serial.begin(9600);\n}';
        
        suggestion = {
          line: 1,
          original: '',
          fixed: setupCode,
          explanation: 'Added required setup() function with Serial initialization'
        };
      } else if (error.message.includes('void loop()')) {
        suggestion = {
          line: lines.length + 1,
          original: '',
          fixed: '\nvoid loop() {\n  // Main code here\n}',
          explanation: 'Added required loop() function at the end of the sketch'
        };
      } else if (error.message.includes('unclosed brace')) {
        const braceCount = this.countBraces(line);
        if (braceCount > 0) {
          suggestion = {
            line: error.line,
            original: line,
            fixed: line + '\n' + '}'.repeat(braceCount),
            explanation: `Added ${braceCount} missing closing brace(s)`
          };
        }
      } else if (error.message.includes('extra closing brace')) {
        const braceCount = Math.abs(this.countBraces(line));
        if (braceCount > 0) {
          suggestion = {
            line: error.line,
            original: line,
            fixed: line.replace(/}/g, '').replace(/\s*$/, ''),
            explanation: `Removed ${braceCount} extra closing brace(s)`
          };
        }
      } else if (error.message.includes('undefined reference')) {
        // Try to suggest common Arduino function fixes
        if (line.includes('pinMode')) {
          suggestion = {
            line: error.line,
            original: line,
            fixed: line.replace(/pinMode\s*\(/, 'pinMode('),
            explanation: 'Fixed pinMode function call syntax'
          };
        } else if (line.includes('digitalWrite')) {
          suggestion = {
            line: error.line,
            original: line,
            fixed: line.replace(/digitalWrite\s*\(/, 'digitalWrite('),
            explanation: 'Fixed digitalWrite function call syntax'
          };
        } else if (line.includes('digitalRead')) {
          suggestion = {
            line: error.line,
            original: line,
            fixed: line.replace(/digitalRead\s*\(/, 'digitalRead('),
            explanation: 'Fixed digitalRead function call syntax'
          };
        }
      } else if (error.message.includes('expected declaration')) {
        // Suggest adding variable declaration
        const variableMatch = line.match(/(\w+)\s*=/);
        if (variableMatch) {
          const varName = variableMatch[1];
          suggestion = {
            line: error.line,
            original: line,
            fixed: `int ${line}`,
            explanation: `Added variable declaration for ${varName}`
          };
        }
      }

      if (suggestion) {
        suggestions.push(suggestion);
      }
    });

    return suggestions;
  }

  private static countBraces(line: string): number {
    let count = 0;
    for (const char of line) {
      if (char === '{') count++;
      if (char === '}') count--;
    }
    return count;
  }

  // Method to validate and improve suggestions
  static validateSuggestion(code: string, suggestion: AIFixSuggestion): boolean {
    const lines = code.split('\n');
    const targetLine = lines[suggestion.line - 1];
    
    // Basic validation
    if (suggestion.line < 1 || suggestion.line > lines.length + 1) {
      return false;
    }
    
    // Check if the original line matches
    if (suggestion.original && suggestion.original !== targetLine) {
      return false;
    }
    
    return true;
  }

  // Method to get contextual suggestions based on Arduino best practices
  static getContextualSuggestions(code: string): AIFixSuggestion[] {
    const suggestions: AIFixSuggestion[] = [];
    const lines = code.split('\n');
    
    // Check for common Arduino issues
    let hasSetup = false;
    let hasSerialBegin = false;
    
    lines.forEach((line) => {
      if (line.includes('void setup()')) hasSetup = true;
      if (line.includes('Serial.begin')) hasSerialBegin = true;
    });
    
    if (hasSetup && !hasSerialBegin) {
      suggestions.push({
        line: 1,
        original: '',
        fixed: 'void setup() {\n  Serial.begin(9600);\n}',
        explanation: 'Added Serial.begin(9600) for debugging and communication'
      });
    }
    
    return suggestions;
  }
}
