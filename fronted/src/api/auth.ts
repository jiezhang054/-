import { apiClient, type ApiResponse } from './client';
import type { User } from '../types/board';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  displayName: string;
  email?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data).then((r) => r.data.data),
  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data).then((r) => r.data.data),
  me: () => apiClient.get<ApiResponse<User>>('/auth/me').then((r) => r.data.data),
};
