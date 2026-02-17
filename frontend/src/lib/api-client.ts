import axios from 'axios';
import type { ApiResponse } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    // Add auth token from localStorage if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }

    const errorMessage =
      error.response?.data?.error?.message || 'Произошла ошибка';
    return Promise.reject(new Error(errorMessage));
  }
);

// Typed request wrapper
export async function apiRequest<T>(
  config: Parameters<typeof apiClient.request>[0]
): Promise<T> {
  const response = (await apiClient.request(config)) as ApiResponse<T>;

  if (!response.success) {
    throw new Error(response.error?.message || 'API Error');
  }

  return response.data as T;
}
