import { apiRequest } from './api-client';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ChatSession,
  ChatMessage,
  SendMessageRequest,
  SendMessageResponse,
  SearchResult,
  UserProfile,
  UpdateProfileRequest,
  User,
} from '@/types/api';

// Auth API
export const authApi = {
  login: (data: LoginRequest) =>
    apiRequest<AuthResponse>({
      method: 'POST',
      url: '/auth/login',
      data,
    }),

  register: (data: RegisterRequest) =>
    apiRequest<AuthResponse>({
      method: 'POST',
      url: '/auth/register',
      data,
    }),

  logout: () =>
    apiRequest<void>({
      method: 'POST',
      url: '/auth/logout',
    }),

  me: () =>
    apiRequest<User>({
      method: 'GET',
      url: '/auth/me',
    }),
};

// Chat API
export const chatApi = {
  createSession: () =>
    apiRequest<ChatSession>({
      method: 'POST',
      url: '/chat/sessions',
    }),

  getSessions: () =>
    apiRequest<ChatSession[]>({
      method: 'GET',
      url: '/chat/sessions',
    }),

  getSession: (sessionId: string) =>
    apiRequest<ChatSession>({
      method: 'GET',
      url: `/chat/sessions/${sessionId}`,
    }),

  getMessages: (sessionId: string) =>
    apiRequest<ChatMessage[]>({
      method: 'GET',
      url: `/chat/sessions/${sessionId}/messages`,
    }),

  sendMessage: (sessionId: string, data: SendMessageRequest) =>
    apiRequest<SendMessageResponse>({
      method: 'POST',
      url: `/chat/sessions/${sessionId}/messages`,
      data,
    }),

  deleteSession: (sessionId: string) =>
    apiRequest<void>({
      method: 'DELETE',
      url: `/chat/sessions/${sessionId}`,
    }),

  clearMessages: (sessionId: string) =>
    apiRequest<void>({
      method: 'DELETE',
      url: `/chat/sessions/${sessionId}/messages`,
    }),
};

// LLM API (direct call to orchestrator via nginx)
export const llmApi = {
  getWelcome: () =>
    apiRequest<{ role: string; content: string }>({
      method: 'GET',
      url: '/llm/welcome',
    }),
};

// Search Results API
export const searchApi = {
  saveResult: (resultId: string) =>
    apiRequest<SearchResult>({
      method: 'POST',
      url: `/chat/search-results/${resultId}/save`,
    }),

  getSavedResults: () =>
    apiRequest<SearchResult[]>({
      method: 'GET',
      url: '/chat/search-results/saved',
    }),

  deleteResult: (resultId: string) =>
    apiRequest<void>({
      method: 'DELETE',
      url: `/chat/search-results/${resultId}`,
    }),
};

// Profile API
export const profileApi = {
  getProfile: () =>
    apiRequest<UserProfile>({
      method: 'GET',
      url: '/users/profile',
    }),

  updateProfile: (data: UpdateProfileRequest) =>
    apiRequest<UserProfile>({
      method: 'PUT',
      url: '/users/profile',
      data,
    }),
};
