import { create } from 'zustand';
import type { ChatSession, ChatMessage } from '@/types/api';

interface ChatStore {
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  isAssistantTyping: boolean;

  setCurrentSession: (session: ChatSession | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  setIsAssistantTyping: (isTyping: boolean) => void;
  clearMessages: () => void;
  reset: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  currentSession: null,
  messages: [],
  isAssistantTyping: false,

  setCurrentSession: (session) => set({ currentSession: session }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),

  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    })),

  setIsAssistantTyping: (isTyping) => set({ isAssistantTyping: isTyping }),

  clearMessages: () => set({ messages: [] }),

  reset: () =>
    set({
      currentSession: null,
      messages: [],
      isAssistantTyping: false,
    }),
}));
