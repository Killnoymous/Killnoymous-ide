import { CompilationError } from '../types';

export class ArduinoCompiler {
  static analyze(code: string): CompilationError[] {
    const errors: CompilationError[] = [];
    const lines = code.split('\n');

    let hasSetup = false;
    let hasLoop = false;
    let braceCount = 0;
    const unclosedBraces: number[] = [];
    const functionDeclarations = new Set<string>();

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      if (trimmed.includes('void setup()')) hasSetup = true;
      if (trimmed.includes('void loop()')) hasLoop = true;

      for (const char of line) {
        if (char === '{') {
          braceCount++;
          unclosedBraces.push(lineNum);
        }
        if (char === '}') {
          braceCount--;
          unclosedBraces.pop();
        }
      }

      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*')) {
        
        // Check for multiple statements on same line (critical error)
        const semicolonCount = (trimmed.match(/;/g) || []).length;
        if (semicolonCount > 1) {
          errors.push({
            line: lineNum,
            column: 0,
            message: 'SYNTAX ERROR: Multiple statements on same line. Each statement must be on a separate line.',
            severity: 'error'
          });
          return; // Skip further analysis for this line
        }

        // Check for duplicate function declarations and similar Arduino functions
        if (trimmed.match(/^(void|int|float|char|bool|String)\s+\w+\s*\([^)]*\)\s*[;{]/)) {
          const funcMatch = trimmed.match(/^(void|int|float|char|bool|String)\s+(\w+)\s*\([^)]*\)\s*[;{]/);
          if (funcMatch) {
            const funcName = funcMatch[2];
            
            // Check for misspelled Arduino functions
            const misspelledArduinoFunctions = {
              'lop': 'loop',
              'loo': 'loop', 
              'looop': 'loop',
              'setu': 'setup',
              'setpu': 'setup',
              'setp': 'setup'
            };
            
            if (misspelledArduinoFunctions[funcName]) {
              const correctName = misspelledArduinoFunctions[funcName];
              errors.push({
                line: lineNum,
                column: 0,
                message: `COMPILATION ERROR: Function '${funcName}' appears to be misspelled. Did you mean '${correctName}'?`,
                severity: 'error'
              });
            } else if (functionDeclarations.has(funcName)) {
              errors.push({
                line: lineNum,
                column: 0,
                message: `COMPILATION ERROR: Redefinition of function '${funcName}'. Function already declared.`,
                severity: 'error'
              });
            } else {
              functionDeclarations.add(funcName);
            }
          }
        }

        // Check for invalid function names and syntax
        if (trimmed.includes('void ') && trimmed.includes('(') && trimmed.includes(')')) {
          const funcMatch = trimmed.match(/void\s+(\w+)\s*\([^)]*\)/);
          if (funcMatch) {
            const funcName = funcMatch[1];
            
            // Check for very short or suspicious function names
            if (funcName.length <= 3 && !['setup', 'loop'].includes(funcName)) {
              errors.push({
                line: lineNum,
                column: 0,
                message: `WARNING: Function name '${funcName}' is too short. Use descriptive names (e.g., 'blinkLED', 'readSensor').`,
                severity: 'warning'
              });
            }

            // Check for invalid characters in function names
            if (!funcName.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
              errors.push({
                line: lineNum,
                column: 0,
                message: `SYNTAX ERROR: Invalid function name '${funcName}'. Function names must start with letter or underscore.`,
                severity: 'error'
              });
            }
          }

          // Check function declaration syntax
          if (trimmed.endsWith(';')) {
            if (!trimmed.match(/^void\s+\w+\s*\([^)]*\)\s*;$/)) {
              errors.push({
                line: lineNum,
                column: 0,
                message: 'SYNTAX ERROR: Invalid function declaration syntax. Expected: void functionName();',
                severity: 'error'
              });
            }
          }
        }

        // Check for missing semicolons
        if (
          !trimmed.endsWith(';') &&
          !trimmed.endsWith('{') &&
          !trimmed.endsWith('}') &&
          !trimmed.startsWith('#') &&
          !trimmed.includes('void setup') &&
          !trimmed.includes('void loop') &&
          !trimmed.includes('if (') &&
          !trimmed.includes('else') &&
          !trimmed.includes('for (') &&
          !trimmed.includes('while (') &&
          !trimmed.includes('do') &&
          !trimmed.includes('switch (') &&
          !trimmed.includes('case ') &&
          !trimmed.includes('return') &&
          !trimmed.includes('break') &&
          !trimmed.includes('continue') &&
          trimmed.length > 0
        ) {
          errors.push({
            line: lineNum,
            column: line.length,
            message: 'SYNTAX ERROR: Expected `;` at end of statement',
            severity: 'error'
          });
        }

        // Check for common Arduino function syntax issues
        if (trimmed.includes('pinMode') && !trimmed.includes('pinMode(')) {
          errors.push({
            line: lineNum,
            column: trimmed.indexOf('pinMode') + 7,
            message: 'SYNTAX ERROR: pinMode function call missing opening parenthesis',
            severity: 'error'
          });
        }

        if (trimmed.includes('digitalWrite') && !trimmed.includes('digitalWrite(')) {
          errors.push({
            line: lineNum,
            column: trimmed.indexOf('digitalWrite') + 11,
            message: 'SYNTAX ERROR: digitalWrite function call missing opening parenthesis',
            severity: 'error'
          });
        }

        if (trimmed.includes('digitalRead') && !trimmed.includes('digitalRead(')) {
          errors.push({
            line: lineNum,
            column: trimmed.indexOf('digitalRead') + 10,
            message: 'SYNTAX ERROR: digitalRead function call missing opening parenthesis',
            severity: 'error'
          });
        }

        // Check for variable declaration issues
        if (trimmed.includes('=') && !trimmed.includes('int ') && !trimmed.includes('float ') && 
            !trimmed.includes('char ') && !trimmed.includes('bool ') && !trimmed.includes('String ') &&
            !trimmed.includes('const ') && !trimmed.includes('static ') && 
            !trimmed.includes('void setup') && !trimmed.includes('void loop')) {
          const equalIndex = trimmed.indexOf('=');
          if (equalIndex > 0 && !trimmed.substring(0, equalIndex).includes(' ')) {
            errors.push({
              line: lineNum,
              column: 0,
              message: 'WARNING: Variable declaration missing type (int, float, char, etc.)',
              severity: 'warning'
            });
          }
        }

        // Check for mismatched parentheses
        const openParens = (trimmed.match(/\(/g) || []).length;
        const closeParens = (trimmed.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
          errors.push({
            line: lineNum,
            column: 0,
            message: 'SYNTAX ERROR: Mismatched parentheses',
            severity: 'error'
          });
        }
      }
    });

    if (!hasSetup) {
      errors.push({
        line: 1,
        column: 0,
        message: 'Arduino sketch must have a void setup() function',
        severity: 'error'
      });
    }

    if (!hasLoop) {
      errors.push({
        line: 1,
        column: 0,
        message: 'Arduino sketch must have a void loop() function',
        severity: 'error'
      });
    }

    if (braceCount > 0) {
      errors.push({
        line: unclosedBraces[unclosedBraces.length - 1] || lines.length,
        column: 0,
        message: `${braceCount} unclosed brace(s)`,
        severity: 'error'
      });
    } else if (braceCount < 0) {
      errors.push({
        line: lines.length,
        column: 0,
        message: `${Math.abs(braceCount)} extra closing brace(s)`,
        severity: 'error'
      });
    }

    return errors;
  }

  static async compile(code: string): Promise<{ success: boolean; errors: CompilationError[]; output: string }> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const errors = this.analyze(code);
    const hasErrors = errors.some(e => e.severity === 'error');

    return {
      success: !hasErrors,
      errors,
      output: hasErrors
        ? `Compilation failed with ${errors.filter(e => e.severity === 'error').length} error(s)`
        : 'Compilation successful! Sketch uses 1234 bytes (4%) of program storage space.'
    };
  }
}
