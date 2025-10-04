import { Play, CheckCircle, Wrench, Moon, Sun, Zap, Info, Upload } from 'lucide-react';

interface ToolbarProps {
  onCompile: () => void;
  onVerify: () => void;
  onAutoFix: () => void;
  onUpload: () => void;
  onToggleTheme: () => void;
  theme: 'light' | 'dark';
  isCompiling: boolean;
  isUploading: boolean;
  hasErrors: boolean;
  isConnected: boolean;
}

export function Toolbar({
  onCompile,
  onVerify,
  onAutoFix,
  onUpload,
  onToggleTheme,
  theme,
  isCompiling,
  isUploading,
  hasErrors,
  isConnected
}: ToolbarProps) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 border-b ${
      theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 mr-4">
          <Zap className="w-5 h-5 text-blue-600" />
          <h1 className="text-lg font-bold">Arduino IDE</h1>
        </div>

        <button
          onClick={onVerify}
          disabled={isCompiling}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Verify Code (Ctrl/Cmd + R)"
        >
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Verify</span>
        </button>

        <button
          onClick={onCompile}
          disabled={isCompiling}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Compile"
        >
          <Play className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isCompiling ? 'Compiling...' : 'Compile'}
          </span>
        </button>

        <button
          onClick={onAutoFix}
          disabled={!hasErrors || isCompiling}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="AI Auto-Fix Errors"
        >
          <Wrench className="w-4 h-4" />
          <span className="text-sm font-medium">AI Fix</span>
        </button>

        <button
          onClick={onUpload}
          disabled={isUploading || isCompiling || hasErrors}
          className={`flex items-center gap-2 px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isConnected
              ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
          title="Upload to Arduino Board"
        >
          <Upload className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isUploading ? 'Uploading...' : isConnected ? 'Upload' : 'Connect & Upload'}
          </span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <Info className="w-4 h-4" />
          <span>Ctrl/Cmd + R to verify • Ctrl/Cmd + S to save</span>
        </div>

        <button
          onClick={onToggleTheme}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
