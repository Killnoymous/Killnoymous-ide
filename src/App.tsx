import { useState, useEffect, useRef, useCallback } from 'react';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { CodeEditor } from './components/CodeEditor';
import { Console } from './components/Console';
import { AIPanel } from './components/AIPanel';
import { AIAssistant } from './components/AIAssistant';
import { storage } from './utils/storage';
import { ArduinoCompiler } from './utils/arduinoCompiler';
import { AIHelper } from './utils/aiHelper';
import { SerialUploader } from './utils/serialUpload';
import { Project, Sketch, ConsoleMessage, CompilationError, AIFixSuggestion, Theme } from './types';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentSketch, setCurrentSketch] = useState<Sketch | null>(null);
  const [code, setCode] = useState('');
  const [theme, setTheme] = useState<Theme>('dark');
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [errors, setErrors] = useState<CompilationError[]>([]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AIFixSuggestion[]>([]);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(true);
  const [realTimeErrors, setRealTimeErrors] = useState<CompilationError[]>([]);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const serialUploader = useRef<SerialUploader>(new SerialUploader());

  const addConsoleMessage = useCallback((type: ConsoleMessage['type'], message: string) => {
    const newMessage: ConsoleMessage = {
      id: crypto.randomUUID(),
      type,
      message,
      timestamp: Date.now()
    };
    setConsoleMessages(prev => [...prev, newMessage]);
  }, []);

  useEffect(() => {
    const loadedProjects = storage.getProjects();
    setProjects(loadedProjects);

    if (loadedProjects.length === 0) {
      const defaultProject = storage.createProject('MyFirstProject', 'A simple Arduino project');
      setProjects([defaultProject]);
      setCurrentProject(defaultProject);
      setCurrentSketch(defaultProject.sketches[0]);
      setCode(defaultProject.sketches[0].content);
    } else {
      const currentId = storage.getCurrentProjectId();
      const project = currentId ? loadedProjects.find(p => p.id === currentId) : loadedProjects[0];
      if (project) {
        setCurrentProject(project);
        setCurrentSketch(project.sketches[0]);
        setCode(project.sketches[0].content);
      }
    }

    addConsoleMessage('info', 'Arduino IDE ready. Start coding!');
  }, [addConsoleMessage]);

  useEffect(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    if (currentProject && currentSketch && code !== currentSketch.content) {
      autoSaveTimer.current = setTimeout(() => {
        storage.updateSketch(currentProject.id, currentSketch.id, code);
        const updatedProjects = storage.getProjects();
        setProjects(updatedProjects);
        const updatedProject = updatedProjects.find(p => p.id === currentProject.id);
        if (updatedProject) {
          setCurrentProject(updatedProject);
        }
      }, 1000);
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [code, currentProject, currentSketch]);

  useEffect(() => {
    if (code) {
      const analysisTimer = setTimeout(() => {
        const detectedErrors = ArduinoCompiler.analyze(code);
        setErrors(detectedErrors);
      }, 2000);

      return () => clearTimeout(analysisTimer);
    }
  }, [code]);

  const handleNewProject = () => {
    const name = prompt('Enter project name:');
    if (name) {
      const newProject = storage.createProject(name);
      const updatedProjects = storage.getProjects();
      setProjects(updatedProjects);
      setCurrentProject(newProject);
      setCurrentSketch(newProject.sketches[0]);
      setCode(newProject.sketches[0].content);
      addConsoleMessage('success', `Created project: ${name}`);
    }
  };

  const handleNewSketch = () => {
    if (!currentProject) return;
    const name = prompt('Enter sketch name (e.g., sketch.ino):');
    if (name) {
      const newSketch = storage.addSketch(currentProject.id, name);
      const updatedProjects = storage.getProjects();
      setProjects(updatedProjects);
      const updatedProject = updatedProjects.find(p => p.id === currentProject.id);
      if (updatedProject) {
        setCurrentProject(updatedProject);
        setCurrentSketch(newSketch);
        setCode(newSketch.content);
        addConsoleMessage('success', `Created sketch: ${name}`);
      }
    }
  };

  const handleProjectSelect = (project: Project) => {
    setCurrentProject(project);
    setCurrentSketch(project.sketches[0]);
    setCode(project.sketches[0].content);
    storage.setCurrentProjectId(project.id);
    addConsoleMessage('info', `Opened project: ${project.name}`);
  };

  const handleSketchSelect = (sketch: Sketch) => {
    if (currentProject && currentSketch) {
      storage.updateSketch(currentProject.id, currentSketch.id, code);
    }
    setCurrentSketch(sketch);
    setCode(sketch.content);
    addConsoleMessage('info', `Opened sketch: ${sketch.name}`);
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      storage.deleteProject(projectId);
      const updatedProjects = storage.getProjects();
      setProjects(updatedProjects);
      if (currentProject?.id === projectId) {
        if (updatedProjects.length > 0) {
          setCurrentProject(updatedProjects[0]);
          setCurrentSketch(updatedProjects[0].sketches[0]);
          setCode(updatedProjects[0].sketches[0].content);
        } else {
          setCurrentProject(null);
          setCurrentSketch(null);
          setCode('');
        }
      }
      addConsoleMessage('info', 'Project deleted');
    }
  };

  const handleDeleteSketch = (sketchId: string) => {
    if (!currentProject) return;
    if (confirm('Are you sure you want to delete this sketch?')) {
      storage.deleteSketch(currentProject.id, sketchId);
      const updatedProjects = storage.getProjects();
      setProjects(updatedProjects);
      const updatedProject = updatedProjects.find(p => p.id === currentProject.id);
      if (updatedProject) {
        setCurrentProject(updatedProject);
        if (currentSketch?.id === sketchId) {
          setCurrentSketch(updatedProject.sketches[0]);
          setCode(updatedProject.sketches[0].content);
        }
      }
      addConsoleMessage('info', 'Sketch deleted');
    }
  };

  const handleExportSketch = (sketch: Sketch) => {
    storage.exportSketch(sketch);
    addConsoleMessage('success', `Exported ${sketch.name}`);
  };

  const handleImportSketch = async () => {
    if (!currentProject) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ino,.cpp,.h';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const { name, content } = await storage.importSketch(file);
        storage.addSketch(currentProject.id, name);
        const updatedProjects = storage.getProjects();
        setProjects(updatedProjects);
        const updatedProject = updatedProjects.find(p => p.id === currentProject.id);
        if (updatedProject) {
          setCurrentProject(updatedProject);
          const newSketch = updatedProject.sketches.find(s => s.name === name);
          if (newSketch) {
            storage.updateSketch(currentProject.id, newSketch.id, content);
            setCurrentSketch(newSketch);
            setCode(content);
            addConsoleMessage('success', `Imported ${name}`);
          }
        }
      }
    };
    input.click();
  };

  const handleCompile = async () => {
    setIsCompiling(true);
    addConsoleMessage('info', 'Compiling sketch...');

    try {
      const result = await ArduinoCompiler.compile(code);
      setErrors(result.errors);

      if (result.success) {
        addConsoleMessage('success', result.output);
      } else {
        addConsoleMessage('error', result.output);
        result.errors.forEach(err => {
          addConsoleMessage('error', `Line ${err.line}: ${err.message}`);
        });
      }
    } catch (error) {
      addConsoleMessage('error', 'Compilation failed');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleVerify = async () => {
    addConsoleMessage('info', 'Verifying code...');
    
    // Combine real-time errors with compiler analysis
    const compilerErrors = ArduinoCompiler.analyze(code);
    const allErrors = [...realTimeErrors, ...compilerErrors];
    
    // Remove duplicates based on line and message
    const uniqueErrors = allErrors.filter((error, index, self) => 
      index === self.findIndex(e => e.line === error.line && e.message === error.message)
    );
    
    setErrors(uniqueErrors);

    if (uniqueErrors.length === 0) {
      addConsoleMessage('success', '✅ Code verification passed! No errors found.');
    } else {
      const errorCount = uniqueErrors.filter(e => e.severity === 'error').length;
      const warningCount = uniqueErrors.filter(e => e.severity === 'warning').length;
      
      if (errorCount > 0) {
        addConsoleMessage('error', `❌ Found ${errorCount} error(s) and ${warningCount} warning(s)`);
      } else {
        addConsoleMessage('warning', `⚠️ Found ${warningCount} warning(s)`);
      }
      
      // Group errors by type for better reporting
      const errorsByType = uniqueErrors.reduce((acc, err) => {
        const key = err.severity;
        if (!acc[key]) acc[key] = [];
        acc[key].push(err);
        return acc;
      }, {} as Record<string, CompilationError[]>);
      
      // Report errors first, then warnings
      if (errorsByType.error) {
        addConsoleMessage('error', '🔴 ERRORS:');
        errorsByType.error.forEach(err => {
          addConsoleMessage('error', `  Line ${err.line}: ${err.message}`);
        });
      }
      
      if (errorsByType.warning) {
        addConsoleMessage('warning', '🟡 WARNINGS:');
        errorsByType.warning.forEach(err => {
          addConsoleMessage('warning', `  Line ${err.line}: ${err.message}`);
        });
      }
      
      addConsoleMessage('info', '💡 Tip: Use "Auto Fix" to get AI suggestions for fixing these issues.');
    }
  };

  const handleAutoFix = async () => {
    if (errors.length === 0) {
      addConsoleMessage('warning', 'No errors found to fix. Try compiling first to detect issues.');
      return;
    }

    addConsoleMessage('ai', 'AI analyzing errors and generating fixes...');
    setShowAIPanel(true);

    try {
      const suggestions = await AIHelper.analyzeAndFix(code, errors);
      
      if (suggestions.length === 0) {
        addConsoleMessage('warning', 'No automatic fixes available for these errors. Manual intervention required.');
        setShowAIPanel(false);
        return;
      }

      // Validate suggestions before showing them
      const validSuggestions = suggestions.filter(suggestion => 
        AIHelper.validateSuggestion(code, suggestion)
      );

      if (validSuggestions.length === 0) {
        addConsoleMessage('warning', 'Generated suggestions are not applicable to current code. Please check your code manually.');
        setShowAIPanel(false);
        return;
      }

      setAiSuggestions(validSuggestions);
      addConsoleMessage('ai', `Generated ${validSuggestions.length} fix suggestion(s). Click "Apply Fix" to use them.`);
      
      // Also get contextual suggestions
      const contextualSuggestions = AIHelper.getContextualSuggestions(code);
      const smartSuggestions = AIHelper.getSmartArduinoSuggestions(code);
      
      const allContextualSuggestions = [...contextualSuggestions, ...smartSuggestions];
      if (allContextualSuggestions.length > 0) {
        setAiSuggestions(prev => [...prev, ...allContextualSuggestions]);
        addConsoleMessage('ai', `Also found ${allContextualSuggestions.length} Arduino-specific suggestion(s) for best practices.`);
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      addConsoleMessage('error', 'Failed to generate AI suggestions. Please try again or fix errors manually.');
      setShowAIPanel(false);
    }
  };

  const handleApplyFix = (suggestion: AIFixSuggestion) => {
    try {
      console.log('🔧 Applying fix:', suggestion);
      const lines = code.split('\n');
      const targetLineIndex = suggestion.line - 1;
      
      console.log(`📍 Target line ${suggestion.line} (index ${targetLineIndex})`);
      console.log(`📝 Current code has ${lines.length} lines`);
      console.log(`🎯 Current line content: "${lines[targetLineIndex] || 'UNDEFINED'}"`);
      console.log(`✨ Suggestion fixed: "${suggestion.fixed}"`);
      console.log(`📋 Suggestion original: "${suggestion.original}"`);
      
      // Handle different cases for line numbers
      if (suggestion.line < 1) {
        addConsoleMessage('error', `Invalid line number: ${suggestion.line}. Line numbers start from 1.`);
        return;
      }
      
      // If line number is beyond current lines, we're appending
      if (suggestion.line > lines.length) {
        console.log('📌 Appending new content beyond current lines');
        // Append new lines
        const newLines = [...lines];
        
        // Add empty lines if needed to reach the target line
        while (newLines.length < suggestion.line - 1) {
          newLines.push('');
        }
        
        // Add the fixed content
        if (suggestion.fixed.includes('\n')) {
          // Multi-line content
          const fixedLines = suggestion.fixed.split('\n');
          newLines.push(...fixedLines);
        } else {
          newLines.push(suggestion.fixed);
        }
        
        const newCode = newLines.join('\n');
        setCode(newCode);
        addConsoleMessage('success', `Added code at end: "${suggestion.fixed.replace(/\n/g, ' ')}"`);
        
      } else {
        // Line exists, replace or modify it
        const currentLine = lines[targetLineIndex] || '';
        console.log('🔄 Replacing existing line');
        
        // Handle empty fixed content (deletion)
        if (suggestion.fixed.trim() === '') {
          console.log('🗑️ Deleting line');
          lines.splice(targetLineIndex, 1);
          addConsoleMessage('success', `Removed line ${suggestion.line}: "${currentLine}"`);
        } else {
          // Handle multi-line fixes
          if (suggestion.fixed.includes('\n')) {
            console.log('📄 Multi-line replacement');
            const fixedLines = suggestion.fixed.split('\n');
            lines.splice(targetLineIndex, 1, ...fixedLines);
            addConsoleMessage('success', `Replaced line ${suggestion.line} with ${fixedLines.length} lines`);
          } else {
            // Single line replacement - THIS IS THE KEY PART
            console.log(`🎯 Single line replacement: "${currentLine}" → "${suggestion.fixed}"`);
            lines[targetLineIndex] = suggestion.fixed;
            addConsoleMessage('success', `Fixed line ${suggestion.line}: "${suggestion.fixed}"`);
          }
        }
        
        const newCode = lines.join('\n');
        console.log('✅ Setting new code');
        setCode(newCode);
      }
      
      // Remove applied suggestion from the list
      setAiSuggestions(prev => prev.filter(s => s !== suggestion));
      
      // If no more suggestions, close the panel
      if (aiSuggestions.length <= 1) {
        setTimeout(() => {
          setShowAIPanel(false);
          setAiSuggestions([]);
        }, 500);
      }
      
    } catch (error) {
      console.error('Error applying fix:', error);
      addConsoleMessage('error', 'Failed to apply fix. Please try again or fix manually.');
    }
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleRealTimeError = (errors: CompilationError[]) => {
    setRealTimeErrors(errors);
  };

  const handleUpload = async () => {
    if (errors.some(e => e.severity === 'error')) {
      addConsoleMessage('error', 'Cannot upload: Fix compilation errors first');
      return;
    }

    setIsUploading(true);

    try {
      if (!serialUploader.current.isConnected()) {
        addConsoleMessage('info', 'Requesting connection to Arduino board...');
        const connected = await serialUploader.current.connect();

        if (!connected) {
          addConsoleMessage('error', 'Failed to connect to Arduino board');
          setIsUploading(false);
          return;
        }

        setIsConnected(true);
        addConsoleMessage('success', 'Connected to Arduino board!');
      }

      const success = await serialUploader.current.upload(code, (message) => {
        addConsoleMessage('info', message);
      });

      if (success) {
        addConsoleMessage('success', 'Sketch uploaded successfully to Arduino!');
      } else {
        addConsoleMessage('error', 'Upload failed');
      }
    } catch (error) {
      addConsoleMessage('error', `Upload error: ${error}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`h-screen flex flex-col ${theme === 'dark' ? 'dark bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <Toolbar
        onCompile={handleCompile}
        onVerify={handleVerify}
        onAutoFix={handleAutoFix}
        onUpload={handleUpload}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onToggleAI={() => setShowAIAssistant(!showAIAssistant)}
        theme={theme}
        isCompiling={isCompiling}
        isUploading={isUploading}
        hasErrors={errors.some(e => e.severity === 'error')}
        isConnected={isConnected}
        showAI={showAIAssistant}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <div className="w-64">
          <Sidebar
            projects={projects}
            currentProject={currentProject}
            currentSketch={currentSketch}
            onProjectSelect={handleProjectSelect}
            onSketchSelect={handleSketchSelect}
            onNewProject={handleNewProject}
            onNewSketch={handleNewSketch}
            onDeleteProject={handleDeleteProject}
            onDeleteSketch={handleDeleteSketch}
            onExportSketch={handleExportSketch}
            onImportSketch={handleImportSketch}
            theme={theme}
          />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <CodeEditor
              value={code}
              onChange={handleCodeChange}
              errors={errors}
              theme={theme}
              onCompile={handleCompile}
              onRealTimeError={handleRealTimeError}
            />
          </div>

          <div className="h-64 border-t dark:border-gray-700">
            <Console
              messages={consoleMessages}
              theme={theme}
              onClear={() => setConsoleMessages([])}
            />
          </div>
        </div>

        {showAIPanel && (
          <AIPanel
            suggestions={aiSuggestions}
            onApplyFix={handleApplyFix}
            onClose={() => setShowAIPanel(false)}
            theme={theme}
          />
        )}

        {showAIAssistant && (
          <AIAssistant
            code={code}
            errors={[...errors, ...realTimeErrors]}
            theme={theme}
            onApplySuggestion={handleApplyFix}
          />
        )}
      </div>
    </div>
  );
}

export default App;
