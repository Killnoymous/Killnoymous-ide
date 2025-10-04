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

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // Check for missing semicolons
      if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') &&
          !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*') &&
          !trimmed.includes('void setup') && !trimmed.includes('void loop') &&
          !trimmed.includes('if (') && !trimmed.includes('else') && !trimmed.includes('for (') &&
          !trimmed.includes('while (') && !trimmed.includes('do') && !trimmed.includes('switch (') &&
          !trimmed.includes('case ') && !trimmed.includes('return') && !trimmed.includes('break') &&
          !trimmed.includes('continue') && trimmed.length > 0) {
        errors.push({
          line: lineNum,
          column: line.length,
          message: 'Expected `;` at end of statement',
          severity: 'error'
        });
      }

      // Check for missing commas in function calls
      if (trimmed.includes('pinMode') && !trimmed.includes('pinMode(')) {
        errors.push({
          line: lineNum,
          column: trimmed.indexOf('pinMode') + 7,
          message: 'pinMode function call missing opening parenthesis',
          severity: 'error'
        });
      } else if (trimmed.includes('pinMode(') && !trimmed.includes(',')) {
        errors.push({
          line: lineNum,
          column: trimmed.indexOf('pinMode(') + 7,
          message: 'pinMode function call missing comma between parameters',
          severity: 'error'
        });
      }

      if (trimmed.includes('digitalWrite') && !trimmed.includes('digitalWrite(')) {
        errors.push({
          line: lineNum,
          column: trimmed.indexOf('digitalWrite') + 11,
          message: 'digitalWrite function call missing opening parenthesis',
          severity: 'error'
        });
      } else if (trimmed.includes('digitalWrite(') && !trimmed.includes(',')) {
        errors.push({
          line: lineNum,
          column: trimmed.indexOf('digitalWrite(') + 11,
          message: 'digitalWrite function call missing comma between parameters',
          severity: 'error'
        });
      }

      if (trimmed.includes('analogWrite') && !trimmed.includes('analogWrite(')) {
        errors.push({
          line: lineNum,
          column: trimmed.indexOf('analogWrite') + 10,
          message: 'analogWrite function call missing opening parenthesis',
          severity: 'error'
        });
      } else if (trimmed.includes('analogWrite(') && !trimmed.includes(',')) {
        errors.push({
          line: lineNum,
          column: trimmed.indexOf('analogWrite(') + 10,
          message: 'analogWrite function call missing comma between parameters',
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
            message: 'Variable declaration missing type (int, float, char, etc.)',
            severity: 'warning'
          });
        }
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
        provideCompletionItems: (model: any, position: any) => {
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
        cursorSmoothCaretAnimation: true,
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
