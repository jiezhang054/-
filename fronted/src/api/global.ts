import { apiClient, type ApiResponse } from './client';
import type { Project } from '../types/board';

export interface BoardNavItem {
  id: number;
  name: string;
  type: string;
}

export interface BoardNavTree {
  projectId: number;
  projectName: string;
  boards: BoardNavItem[];
}

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  content: string;
  linkType?: string;
  linkId?: number;
  read: boolean;
  createdAt: string;
}

export interface MindmapSummary {
  id: number;
  name: string;
  projectId?: number;
  projectName?: string;
  updatedAt?: string;
}

export const globalApi = {
  navigation: (keyword?: string) =>
    apiClient.get<ApiResponse<{
      recentVisits: { id: number; type: string; targetId: number; name: string; visitedAt: string }[];
      boardTree: BoardNavTree[];
      archivedBoards: { id: number; name: string; projectName: string }[];
      archivedProjects: { id: number; name: string }[];
    }>>('/navigation', { params: keyword ? { keyword } : {} }).then((r) => r.data.data),

  recordVisit: (type: string, targetId: number, name: string) =>
    apiClient.post('/navigation/visits', { type, targetId, name }),

  notifications: () =>
    apiClient.get<ApiResponse<{ items: NotificationItem[]; unreadCount: number }>>('/notifications')
      .then((r) => r.data.data),

  markNotificationRead: (id: number) =>
    apiClient.patch(`/notifications/${id}/read`),

  markAllNotificationsRead: () =>
    apiClient.post('/notifications/read-all'),

  createBoard: (data: { name: string; projectId: number; type?: string; template?: string }) =>
    apiClient.post<ApiResponse<{ id: number; name: string }>>('/boards', data).then((r) => r.data.data),

  createMindmap: (data: { name: string; projectId?: number; content?: string }) =>
    apiClient.post<ApiResponse<{ id: number; name: string }>>('/mindmaps', data).then((r) => r.data.data),

  listMindmaps: () =>
    apiClient.get<ApiResponse<MindmapSummary[]>>('/mindmaps').then((r) => r.data.data),
};

export const projectsApi = {
  list: () => apiClient.get<ApiResponse<Project[]>>('/projects').then((r) => r.data.data),
  getById: (id: number) => apiClient.get<ApiResponse<Project>>(`/projects/${id}`).then((r) => r.data.data),
  create: (data: { name: string; description?: string; template?: string }) =>
    apiClient.post<ApiResponse<Project>>('/projects', data).then((r) => r.data.data),
};
