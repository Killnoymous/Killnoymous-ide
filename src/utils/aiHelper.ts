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
      // Validate error line number first
      if (error.line < 1 || error.line > lines.length) {
        console.warn(`Skipping error with invalid line number: ${error.line}. Code has ${lines.length} lines.`);
        return;
      }

      const line = lines[error.line - 1] || '';
      let suggestion: AIFixSuggestion | null = null;

      // Enhanced error detection and fixes
      if (error.message.includes('Expected `;`') || error.message.includes('SYNTAX ERROR: Expected')) {
        // Only suggest semicolon if line doesn't already end with one
        if (!line.trim().endsWith(';')) {
          suggestion = {
            line: error.line,
            original: line,
            fixed: line + ';',
            explanation: 'Added missing semicolon at end of statement'
          };
        }
      } else if (error.message.includes('void setup()') || error.message.includes('Arduino sketch must have a void setup()')) {
        // Find a good place to insert setup function
        let insertLine = 1;
        // Look for includes first, then insert after them
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('#include') || lines[i].trim().startsWith('#define')) {
            insertLine = i + 2;
          } else {
            break;
          }
        }
        
        const hasSerialBegin = code.includes('Serial.begin');
        const setupCode = hasSerialBegin 
          ? 'void setup() {\n  // Initialization code here\n}'
          : 'void setup() {\n  // Initialization code here\n  Serial.begin(9600);\n}';
        
        suggestion = {
          line: insertLine,
          original: '',
          fixed: setupCode,
          explanation: 'Added required setup() function with Serial initialization'
        };
      } else if (error.message.includes('void loop()') || error.message.includes('Arduino sketch must have a void loop()')) {
        // Insert loop function at the end
        suggestion = {
          line: lines.length + 1,
          original: '',
          fixed: '\nvoid loop() {\n  // Main code here\n}',
          explanation: 'Added required loop() function at the end of the sketch'
        };
      } else if (error.message.includes('Multiple statements on same line')) {
        // Split multiple statements into separate lines
        const statements = line.split(';').filter(s => s.trim());
        if (statements.length > 1) {
          const fixedLines = statements.map(s => s.trim() + ';').join('\n');
          suggestion = {
            line: error.line,
            original: line,
            fixed: fixedLines,
            explanation: 'Split multiple statements into separate lines'
          };
        }
      } else if (error.message.includes('Redefinition of function') || error.message.includes('Duplicate function declaration')) {
        // Remove duplicate function declaration
        suggestion = {
          line: error.line,
          original: line,
          fixed: '', // Remove the duplicate line
          explanation: 'Removed duplicate function declaration'
        };
      } else if (error.message.includes('unclosed brace')) {
        const braceCount = this.countBraces(code);
        if (braceCount > 0) {
          suggestion = {
            line: lines.length + 1,
            original: '',
            fixed: '}'.repeat(braceCount),
            explanation: `Added ${braceCount} missing closing brace(s) at end of code`
          };
        }
      } else if (error.message.includes('Mismatched parentheses')) {
        // Try to fix parentheses
        const openParens = (line.match(/\(/g) || []).length;
        const closeParens = (line.match(/\)/g) || []).length;
        const diff = openParens - closeParens;
        
        if (diff > 0) {
          suggestion = {
            line: error.line,
            original: line,
            fixed: line + ')'.repeat(diff),
            explanation: `Added ${diff} missing closing parenthesis/parentheses`
          };
        } else if (diff < 0) {
          // Remove extra closing parentheses
          let fixed = line;
          for (let i = 0; i < Math.abs(diff); i++) {
            const lastParen = fixed.lastIndexOf(')');
            if (lastParen !== -1) {
              fixed = fixed.substring(0, lastParen) + fixed.substring(lastParen + 1);
            }
          }
          suggestion = {
            line: error.line,
            original: line,
            fixed: fixed,
            explanation: `Removed ${Math.abs(diff)} extra closing parenthesis/parentheses`
          };
        }
      } else if (error.message.includes('pinMode') || error.message.includes('digitalWrite') || error.message.includes('analogWrite')) {
        // Fix Arduino function syntax
        let fixed = line;
        
        // Fix pinMode syntax
        if (line.includes('pinMode') && !line.includes(',')) {
          fixed = fixed.replace(/pinMode\s*\(\s*(\d+)\s+(\w+)\s*\)/, 'pinMode($1, $2)');
        }
        
        // Fix digitalWrite syntax  
        if (line.includes('digitalWrite') && !line.includes(',')) {
          fixed = fixed.replace(/digitalWrite\s*\(\s*(\d+)\s+(\w+)\s*\)/, 'digitalWrite($1, $2)');
        }
        
        // Fix analogWrite syntax
        if (line.includes('analogWrite') && !line.includes(',')) {
          fixed = fixed.replace(/analogWrite\s*\(\s*(\d+)\s+(\d+)\s*\)/, 'analogWrite($1, $2)');
        }
        
        if (fixed !== line) {
          suggestion = {
            line: error.line,
            original: line,
            fixed: fixed,
            explanation: 'Fixed Arduino function syntax - added missing comma between parameters'
          };
        }
      }

      // Validate suggestion before adding
      if (suggestion && this.validateSuggestion(code, suggestion)) {
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
    
    // Basic validation - ensure line number is within valid range
    if (suggestion.line < 1 || suggestion.line > lines.length + 2) {
      console.warn(`Invalid line number: ${suggestion.line}. Code has ${lines.length} lines.`);
      return false;
    }
    
    // If line number is beyond current lines, it's for appending (which is valid)
    if (suggestion.line > lines.length) {
      return true; // Allow appending new lines
    }
    
    const targetLine = lines[suggestion.line - 1];
    
    // Check if the original line matches (with some flexibility)
    if (suggestion.original && suggestion.original.trim() !== '') {
      const originalTrimmed = suggestion.original.trim();
      const targetTrimmed = targetLine ? targetLine.trim() : '';
      
      // Allow partial matches or if target line is empty
      if (originalTrimmed !== targetTrimmed && targetTrimmed !== '') {
        // Check if original is a substring of target (for partial matches)
        if (!targetTrimmed.includes(originalTrimmed)) {
          console.warn(`Original line mismatch. Expected: "${originalTrimmed}", Found: "${targetTrimmed}"`);
          return false;
        }
      }
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
