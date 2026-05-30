// Architectural Layer: Store
// Dependencies: zustand, immer

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export type ScreenplayNodeType =
  | "scene_heading"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical";

export type EditorView = "editor" | "compliance";

interface EditorState {
  wordCount: number;
  sceneCount: number;
  activeNodeType: ScreenplayNodeType | null;
  isDirty: boolean;
  activeView: EditorView;
  setStats: (wordCount: number, sceneCount: number) => void;
  setActiveNodeType: (type: ScreenplayNodeType | null) => void;
  setIsDirty: (isDirty: boolean) => void;
  setActiveView: (view: EditorView) => void;
}

export const useEditorStore = create<EditorState>()(
  immer((set) => ({
    wordCount: 0,
    sceneCount: 0,
    activeNodeType: null,
    isDirty: false,
    activeView: "editor",
    setStats: (wordCount, sceneCount) =>
      set((state) => {
        state.wordCount = wordCount;
        state.sceneCount = sceneCount;
      }),
    setActiveNodeType: (type) =>
      set((state) => {
        state.activeNodeType = type;
      }),
    setIsDirty: (isDirty) =>
      set((state) => {
        state.isDirty = isDirty;
      }),
    setActiveView: (view) =>
      set((state) => {
        state.activeView = view;
      }),
  }))
);
