import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { CompilationError } from '../types';
import type { editor } from 'monaco-editor';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  errors: CompilationError[];
  theme: 'light' | 'dark';
  onCompile: () => void;
  onRealTimeError?: (errors: CompilationError[]) => void;
}

export function CodeEditor({ value, onChange, errors, theme, onCompile, onRealTimeError }: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [realTimeErrors, setRealTimeErrors] = useState<CompilationError[]>([]);

  // Real-time error detection
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value.length > 0) {
        const detectedErrors = analyzeCodeRealTime(value);
        setRealTimeErrors(detectedErrors);
        if (onRealTimeError) {
          onRealTimeError(detectedErrors);
        }
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timer);
  }, [value, onRealTimeError]);

  const analyzeCodeRealTime = (code: string): CompilationError[] => {
    const errors: CompilationError[] = [];
    const lines = code.split('\n');
    const functionDeclarations = new Set<string>();

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();
      const original = line;

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        return;
      }

      // Check for multiple statements on same line (like void oop();void oop();)
      const semicolonCount = (trimmed.match(/;/g) || []).length;
      if (semicolonCount > 1) {
        errors.push({
          line: lineNum,
          column: 0,
          message: 'Multiple statements on same line. Each statement should be on a separate line.',
          severity: 'error'
        });
      }

      // Check for duplicate function declarations
      if (trimmed.match(/^(void|int|float|char|bool|String)\s+\w+\s*\([^)]*\)\s*;/)) {
        const funcMatch = trimmed.match(/^(void|int|float|char|bool|String)\s+(\w+)\s*\([^)]*\)\s*;/);
        if (funcMatch) {
          const funcName = funcMatch[2];
          if (functionDeclarations.has(funcName)) {
            errors.push({
              line: lineNum,
              column: 0,
              message: `Duplicate function declaration: '${funcName}' is already declared`,
              severity: 'error'
            });
          } else {
            functionDeclarations.add(funcName);
          }
        }
      }

      // Check for invalid function names (Arduino specific)
      if (trimmed.match(/^void\s+\w+\s*\([^)]*\)\s*;/)) {
        const funcMatch = trimmed.match(/^void\s+(\w+)\s*\([^)]*\)\s*;/);
        if (funcMatch) {
          const funcName = funcMatch[1];
          const validArduinoFunctions = ['setup', 'loop'];
          const commonFunctions = ['digitalWrite', 'digitalRead', 'analogWrite', 'analogRead', 'pinMode', 'delay'];
          
          // Check if it's not a valid Arduino function and looks suspicious
          if (!validArduinoFunctions.includes(funcName) && 
              !commonFunctions.includes(funcName) && 
              funcName.length < 4 && 
              !funcName.match(/^[a-zA-Z][a-zA-Z0-9_]*$/)) {
            errors.push({
              line: lineNum,
              column: 0,
              message: `Suspicious function name '${funcName}'. Arduino functions should have descriptive names.`,
              severity: 'warning'
            });
          }
        }
      }

      // Check for missing semicolons (more comprehensive)
      const needsSemicolon = trimmed && 
        !trimmed.endsWith(';') && 
        !trimmed.endsWith('{') && 
        !trimmed.endsWith('}') &&
        !trimmed.includes('void setup') && 
        !trimmed.includes('void loop') &&
        !trimmed.includes('if (') && 
        !trimmed.includes('else if') &&
        !trimmed.includes('else') && 
        !trimmed.includes('for (') &&
        !trimmed.includes('while (') && 
        !trimmed.includes('do') && 
        !trimmed.includes('switch (') &&
        !trimmed.includes('case ') && 
        !trimmed.includes('default:') &&
        !trimmed.includes('#include') &&
        !trimmed.includes('#define') &&
        !trimmed.startsWith('}') &&
        (trimmed.includes('=') || 
         trimmed.includes('pinMode') || 
         trimmed.includes('digitalWrite') || 
         trimmed.includes('analogWrite') ||
         trimmed.includes('Serial.') ||
         trimmed.includes('delay(') ||
         trimmed.includes('return '));

      if (needsSemicolon) {
        errors.push({
          line: lineNum,
          column: original.length,
          message: 'Expected `;` at end of statement',
          severity: 'error'
        });
      }

      // Check for syntax errors in function declarations
      if (trimmed.includes('void ') && trimmed.includes('(') && trimmed.includes(')')) {
        // Check if it's a proper function declaration or definition
        if (trimmed.endsWith(';')) {
          // Function declaration - check syntax
          if (!trimmed.match(/^void\s+\w+\s*\([^)]*\)\s*;$/)) {
            errors.push({
              line: lineNum,
              column: 0,
              message: 'Invalid function declaration syntax',
              severity: 'error'
            });
          }
        } else if (trimmed.endsWith('{')) {
          // Function definition - check syntax
          if (!trimmed.match(/^void\s+\w+\s*\([^)]*\)\s*\{$/)) {
            errors.push({
              line: lineNum,
              column: 0,
              message: 'Invalid function definition syntax',
              severity: 'error'
            });
          }
        }
      }

      // Check pinMode syntax
      if (trimmed.includes('pinMode')) {
        if (!trimmed.includes('(') || !trimmed.includes(')')) {
          errors.push({
            line: lineNum,
            column: trimmed.indexOf('pinMode'),
            message: 'pinMode function call missing parentheses',
            severity: 'error'
          });
        } else if (trimmed.includes('pinMode(') && !trimmed.includes(',')) {
          const openParen = trimmed.indexOf('pinMode(') + 8;
          const closeParen = trimmed.indexOf(')', openParen);
          if (closeParen > openParen) {
            const params = trimmed.substring(openParen, closeParen).trim();
            if (params && !params.includes(',')) {
              errors.push({
                line: lineNum,
                column: openParen,
                message: 'pinMode requires two parameters separated by comma: pinMode(pin, mode)',
                severity: 'error'
              });
            }
          }
        }
      }

      // Check digitalWrite syntax
      if (trimmed.includes('digitalWrite')) {
        if (!trimmed.includes('(') || !trimmed.includes(')')) {
          errors.push({
            line: lineNum,
            column: trimmed.indexOf('digitalWrite'),
            message: 'digitalWrite function call missing parentheses',
            severity: 'error'
          });
        } else if (trimmed.includes('digitalWrite(') && !trimmed.includes(',')) {
          const openParen = trimmed.indexOf('digitalWrite(') + 12;
          const closeParen = trimmed.indexOf(')', openParen);
          if (closeParen > openParen) {
            const params = trimmed.substring(openParen, closeParen).trim();
            if (params && !params.includes(',')) {
              errors.push({
                line: lineNum,
                column: openParen,
                message: 'digitalWrite requires two parameters: digitalWrite(pin, value)',
                severity: 'error'
              });
            }
          }
        }
      }

      // Check analogWrite syntax
      if (trimmed.includes('analogWrite')) {
        if (!trimmed.includes('(') || !trimmed.includes(')')) {
          errors.push({
            line: lineNum,
            column: trimmed.indexOf('analogWrite'),
            message: 'analogWrite function call missing parentheses',
            severity: 'error'
          });
        } else if (trimmed.includes('analogWrite(') && !trimmed.includes(',')) {
          const openParen = trimmed.indexOf('analogWrite(') + 11;
          const closeParen = trimmed.indexOf(')', openParen);
          if (closeParen > openParen) {
            const params = trimmed.substring(openParen, closeParen).trim();
            if (params && !params.includes(',')) {
              errors.push({
                line: lineNum,
                column: openParen,
                message: 'analogWrite requires two parameters: analogWrite(pin, value)',
                severity: 'error'
              });
            }
          }
        }
      }

      // Check for missing variable types
      if (trimmed.includes('=') && !trimmed.includes('==') && !trimmed.includes('!=') && 
          !trimmed.includes('<=') && !trimmed.includes('>=')) {
        const equalIndex = trimmed.indexOf('=');
        const beforeEqual = trimmed.substring(0, equalIndex).trim();
        
        // Check if it's a variable declaration without type
        if (beforeEqual && !beforeEqual.includes(' ') && 
            !trimmed.includes('int ') && !trimmed.includes('float ') && 
            !trimmed.includes('char ') && !trimmed.includes('bool ') && 
            !trimmed.includes('String ') && !trimmed.includes('const ') && 
            !trimmed.includes('static ') && !trimmed.includes('unsigned ') &&
            !beforeEqual.includes('.') && !beforeEqual.includes('[') &&
            !trimmed.includes('void setup') && !trimmed.includes('void loop')) {
          
          errors.push({
            line: lineNum,
            column: 0,
            message: `Variable '${beforeEqual}' declaration missing type (int, float, char, etc.)`,
            severity: 'warning'
          });
        }
      }

      // Check for missing brackets
      const openBrackets = (trimmed.match(/\(/g) || []).length;
      const closeBrackets = (trimmed.match(/\)/g) || []).length;
      if (openBrackets !== closeBrackets) {
        errors.push({
          line: lineNum,
          column: trimmed.length,
          message: 'Mismatched parentheses',
          severity: 'error'
        });
      }

      // Check for missing braces in control structures
      if ((trimmed.includes('if (') || trimmed.includes('for (') || trimmed.includes('while (')) && 
          !trimmed.includes('{') && !trimmed.endsWith(')')) {
        errors.push({
          line: lineNum,
          column: trimmed.length,
          message: 'Control structure missing opening brace {',
          severity: 'warning'
        });
      }
    });

    return errors;
  };

  useEffect(() => {
    if (editorRef.current) {
      const monaco = (window as any).monaco;
      if (monaco) {
        const model = editorRef.current.getModel();
        if (model) {
          // Combine real-time errors with compilation errors
          const allErrors = [...realTimeErrors, ...errors];
          const markers = allErrors.map(err => ({
            severity: err.severity === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
            startLineNumber: err.line,
            startColumn: err.column || 1,
            endLineNumber: err.line,
            endColumn: err.column + 10 || 100,
            message: err.message
          }));
          monaco.editor.setModelMarkers(model, 'arduino', markers);
        }
      }
    }
  }, [errors, realTimeErrors]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    editor.addCommand((window as any).monaco.KeyMod.CtrlCmd | (window as any).monaco.KeyCode.KeyS, () => {
      const currentValue = editor.getValue();
      onChange(currentValue);
    });

    editor.addCommand((window as any).monaco.KeyMod.CtrlCmd | (window as any).monaco.KeyCode.KeyR, () => {
      onCompile();
    });

    // Add AI completion suggestions
    const monaco = (window as any).monaco;
    if (monaco) {
      monaco.languages.registerCompletionItemProvider('cpp', {
        provideCompletionItems: (_model: any, _position: any) => {
          const suggestions = [
            {
              label: 'pinMode',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'pinMode(${1:pin}, ${2:mode});',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Sets the mode of a pin (INPUT, OUTPUT, INPUT_PULLUP)'
            },
            {
              label: 'digitalWrite',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'digitalWrite(${1:pin}, ${2:value});',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Writes a HIGH or LOW value to a digital pin'
            },
            {
              label: 'digitalRead',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'digitalRead(${1:pin});',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Reads the value from a digital pin'
            },
            {
              label: 'analogWrite',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'analogWrite(${1:pin}, ${2:value});',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Writes an analog value to a pin'
            },
            {
              label: 'analogRead',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'analogRead(${1:pin});',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Reads the value from an analog pin'
            },
            {
              label: 'Serial.begin',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'Serial.begin(${1:9600});',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Initializes serial communication'
            },
            {
              label: 'Serial.println',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'Serial.println(${1:value});',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Prints data to serial port'
            },
            {
              label: 'delay',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'delay(${1:1000});',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Pauses the program for specified milliseconds'
            }
          ];

          return { suggestions };
        }
      });
    }
  };

  return (
    <Editor
      height="100%"
      defaultLanguage="cpp"
      value={value}
      onChange={(val) => onChange(val || '')}
      onMount={handleEditorDidMount}
      theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
      options={{
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        folding: true,
        foldingStrategy: 'indentation',
        showFoldingControls: 'always',
        matchBrackets: 'always',
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        formatOnPaste: true,
        formatOnType: true,
        // Enhanced options for better experience
        renderLineHighlight: 'all',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        mouseWheelZoom: true,
        // Real-time error highlighting
        renderValidationDecorations: 'on',
        showUnused: true,
        showDeprecated: true,
      }}
    />
  );
}
