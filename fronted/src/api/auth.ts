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

export interface ProfileUpdateRequest {
  displayName?: string;
  email?: string;
  avatar?: string;
}

export interface PasswordChangeRequest {
  oldPassword: string;
  newPassword: string;
}

export interface SettingsUpdateRequest {
  background?: string;
  locale?: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data).then((r) => r.data.data),
  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data).then((r) => r.data.data),
  refresh: () =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh').then((r) => r.data.data),
  me: () => apiClient.get<ApiResponse<User>>('/auth/me').then((r) => r.data.data),
  updateProfile: (data: ProfileUpdateRequest) =>
    apiClient.put<ApiResponse<User>>('/auth/profile', data).then((r) => r.data.data),
  changePassword: (data: PasswordChangeRequest) =>
    apiClient.put<ApiResponse<null>>('/auth/password', data).then((r) => r.data),
  updateSettings: (data: SettingsUpdateRequest) =>
    apiClient.put<ApiResponse<User>>('/auth/settings', data).then((r) => r.data.data),
};
