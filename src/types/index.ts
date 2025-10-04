export interface Sketch {
  id: string;
  name: string;
  content: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  sketches: Sketch[];
  createdAt: string;
  updatedAt: string;
}

export interface CompilationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface AIFixSuggestion {
  line: number;
  original: string;
  fixed: string;
  explanation: string;
}

export interface ConsoleMessage {
  id: string;
  type: 'info' | 'error' | 'warning' | 'success' | 'ai';
  message: string;
  timestamp: number;
}

export type Theme = 'light' | 'dark';
