import { CompilationError } from '../types';

export class ArduinoCompiler {
  static analyze(code: string): CompilationError[] {
    const errors: CompilationError[] = [];
    const lines = code.split('\n');

    let hasSetup = false;
    let hasLoop = false;
    let braceCount = 0;
    const unclosedBraces: number[] = [];

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
          trimmed.length > 0
        ) {
          errors.push({
            line: lineNum,
            column: line.length,
            message: 'Expected `;` at end of statement',
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
