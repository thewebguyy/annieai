// Architectural Layer: Store
// Dependencies: zustand, immer

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
}

interface MuseState {
  messages: ChatMessage[];
  isLoading: boolean;
  activeModel: "Auto" | "Claude" | "GPT" | "Grok" | "Gemini";
  lastRouting: string | null;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setIsLoading: (isLoading: boolean) => void;
  setActiveModel: (model: "Auto" | "Claude" | "GPT" | "Grok" | "Gemini") => void;
  setLastRouting: (reasoning: string | null) => void;
  clearChat: () => void;
}

export const useMuseStore = create<MuseState>()(
  immer((set) => ({
    messages: [],
    isLoading: false,
    activeModel: "Auto",
    lastRouting: null,
    setMessages: (messages) =>
      set((state) => {
        state.messages = messages;
      }),
    addMessage: (message) =>
      set((state) => {
        state.messages.push(message);
      }),
    setIsLoading: (isLoading) =>
      set((state) => {
        state.isLoading = isLoading;
      }),
    setActiveModel: (model) =>
      set((state) => {
        state.activeModel = model;
      }),
    setLastRouting: (reasoning) =>
      set((state) => {
        state.lastRouting = reasoning;
      }),
    clearChat: () =>
      set((state) => {
        state.messages = [];
        state.lastRouting = null;
      }),
  }))
);
