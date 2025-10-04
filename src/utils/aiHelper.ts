import { CompilationError, AIFixSuggestion } from '../types';

export class AIHelper {
  static async analyzeAndFix(code: string, errors: CompilationError[]): Promise<AIFixSuggestion[]> {
    return this.getRuleBasedFixes(code, errors);
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
}
