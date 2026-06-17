import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import type { User } from '../types/board';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry && !String(original.url).includes('/auth/refresh')) {
      original._retry = true;
      if (!refreshing) {
        refreshing = apiClient
          .post<{ data: { token: string; user: User } }>('/auth/refresh')
          .then((res) => {
            const { token, user } = res.data.data;
            useAuthStore.getState().setAuth(token, user);
            return token;
          })
          .catch(() => {
            useAuthStore.getState().logout();
            window.location.href = '/login';
            return null;
          })
          .finally(() => {
            refreshing = null;
          });
      }
      const newToken = await refreshing;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
    }
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
