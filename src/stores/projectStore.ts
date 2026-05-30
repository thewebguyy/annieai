// Architectural Layer: Store
// Dependencies: zustand, immer

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface Project {
  id: string;
  user_id: string;
  title: string;
  genre?: string | null;
  logline?: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  lastSavedAt: string | null;
  setProjects: (projects: Project[]) => void;
  setActiveProject: (project: Project | null) => void;
  setLastSavedAt: (timestamp: string | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
}

export const useProjectStore = create<ProjectState>()(
  immer((set) => ({
    projects: [],
    activeProject: null,
    lastSavedAt: null,
    setProjects: (projects) =>
      set((state) => {
        state.projects = projects;
      }),
    setActiveProject: (project) =>
      set((state) => {
        state.activeProject = project;
      }),
    setLastSavedAt: (timestamp) =>
      set((state) => {
        state.lastSavedAt = timestamp;
      }),
    addProject: (project) =>
      set((state) => {
        state.projects.unshift(project);
      }),
    updateProject: (id, updates) =>
      set((state) => {
        const idx = state.projects.findIndex((p) => p.id === id);
        if (idx !== -1) {
          state.projects[idx] = { ...state.projects[idx], ...updates };
        }
        if (state.activeProject?.id === id) {
          state.activeProject = { ...state.activeProject, ...updates };
        }
      }),
  }))
);
