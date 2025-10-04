import { useState } from 'react';
import { FileCode, FolderPlus, FilePlus, Trash2, Download, Upload, ChevronRight, ChevronDown } from 'lucide-react';
import { Project, Sketch } from '../types';

interface SidebarProps {
  projects: Project[];
  currentProject: Project | null;
  currentSketch: Sketch | null;
  onProjectSelect: (project: Project) => void;
  onSketchSelect: (sketch: Sketch) => void;
  onNewProject: () => void;
  onNewSketch: () => void;
  onDeleteProject: (projectId: string) => void;
  onDeleteSketch: (sketchId: string) => void;
  onExportSketch: (sketch: Sketch) => void;
  onImportSketch: () => void;
  theme: 'light' | 'dark';
}

export function Sidebar({
  projects,
  currentProject,
  currentSketch,
  onProjectSelect,
  onSketchSelect,
  onNewProject,
  onNewSketch,
  onDeleteProject,
  onDeleteSketch,
  onExportSketch,
  onImportSketch,
  theme
}: SidebarProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(currentProject ? [currentProject.id] : [])
  );

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  return (
    <div className={`flex flex-col h-full border-r ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="text-sm font-semibold mb-3">Projects</h2>
        <div className="flex gap-2">
          <button
            onClick={onNewProject}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            title="New Project"
          >
            <FolderPlus className="w-3 h-3" />
            Project
          </button>
          <button
            onClick={onNewSketch}
            disabled={!currentProject}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="New Sketch"
          >
            <FilePlus className="w-3 h-3" />
            Sketch
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {projects.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            No projects yet.<br />Create one to get started!
          </div>
        ) : (
          projects.map((project) => {
            const isExpanded = expandedProjects.has(project.id);
            const isCurrentProject = currentProject?.id === project.id;

            return (
              <div key={project.id} className="mb-2">
                <div
                  className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 group ${
                    isCurrentProject ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => {
                    onProjectSelect(project);
                    toggleProject(project.id);
                  }}
                >
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 flex-shrink-0" />
                    )}
                    <FileCode className="w-3 h-3 flex-shrink-0" />
                    <span className="text-sm truncate">{project.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(project.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-600"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {project.sketches.map((sketch) => {
                      const isCurrentSketch = currentSketch?.id === sketch.id;

                      return (
                        <div
                          key={sketch.id}
                          className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 group ${
                            isCurrentSketch ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                          onClick={() => onSketchSelect(sketch)}
                        >
                          <span className="text-sm truncate flex-1">{sketch.name}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onExportSketch(sketch);
                              }}
                              className="hover:text-blue-600"
                              title="Export Sketch"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            {project.sketches.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSketch(sketch.id);
                                }}
                                className="hover:text-red-600"
                                title="Delete Sketch"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className={`p-3 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={onImportSketch}
          disabled={!currentProject}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import Sketch
        </button>
      </div>
    </div>
  );
}
