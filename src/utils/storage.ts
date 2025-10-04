import { Project, Sketch } from '../types';

const PROJECTS_KEY = 'arduino_ide_projects';
const CURRENT_PROJECT_KEY = 'arduino_ide_current_project';

export const storage = {
  getProjects(): Project[] {
    const data = localStorage.getItem(PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveProjects(projects: Project[]): void {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  },

  getCurrentProjectId(): string | null {
    return localStorage.getItem(CURRENT_PROJECT_KEY);
  },

  setCurrentProjectId(id: string): void {
    localStorage.setItem(CURRENT_PROJECT_KEY, id);
  },

  createProject(name: string, description: string = ''): Project {
    const projects = this.getProjects();
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      sketches: [{
        id: crypto.randomUUID(),
        name: `${name}.ino`,
        content: `void setup() {\n  // put your setup code here, to run once:\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  // put your main code here, to run repeatedly:\n  \n}`
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    projects.push(newProject);
    this.saveProjects(projects);
    this.setCurrentProjectId(newProject.id);
    return newProject;
  },

  updateProject(id: string, updates: Partial<Project>): void {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = {
        ...projects[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveProjects(projects);
    }
  },

  deleteProject(id: string): void {
    const projects = this.getProjects();
    this.saveProjects(projects.filter(p => p.id !== id));
    if (this.getCurrentProjectId() === id) {
      localStorage.removeItem(CURRENT_PROJECT_KEY);
    }
  },

  addSketch(projectId: string, name: string): Sketch {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const newSketch: Sketch = {
        id: crypto.randomUUID(),
        name,
        content: ''
      };
      project.sketches.push(newSketch);
      project.updatedAt = new Date().toISOString();
      this.saveProjects(projects);
      return newSketch;
    }
    throw new Error('Project not found');
  },

  updateSketch(projectId: string, sketchId: string, content: string): void {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const sketch = project.sketches.find(s => s.id === sketchId);
      if (sketch) {
        sketch.content = content;
        project.updatedAt = new Date().toISOString();
        this.saveProjects(projects);
      }
    }
  },

  deleteSketch(projectId: string, sketchId: string): void {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (project && project.sketches.length > 1) {
      project.sketches = project.sketches.filter(s => s.id !== sketchId);
      project.updatedAt = new Date().toISOString();
      this.saveProjects(projects);
    }
  },

  exportSketch(sketch: Sketch): void {
    const blob = new Blob([sketch.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sketch.name;
    a.click();
    URL.revokeObjectURL(url);
  },

  importSketch(file: File): Promise<{ name: string; content: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          name: file.name,
          content: e.target?.result as string
        });
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
};
