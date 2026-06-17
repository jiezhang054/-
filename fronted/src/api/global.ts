import { apiClient, type ApiResponse } from './client';
import type { Project, ProjectMember, ProjectStats } from '../types/board';

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

  listMindmaps: (params?: { projectId?: number; sortBy?: string; sortDir?: string }) =>
    apiClient.get<ApiResponse<MindmapSummary[]>>('/mindmaps', { params }).then((r) => r.data.data),
};

export const projectsApi = {
  list: () => apiClient.get<ApiResponse<Project[]>>('/projects').then((r) => r.data.data),
  getById: (id: number) => apiClient.get<ApiResponse<Project>>(`/projects/${id}`).then((r) => r.data.data),
  create: (data: { name: string; description?: string; template?: string }) =>
    apiClient.post<ApiResponse<Project>>('/projects', data).then((r) => r.data.data),
  update: (id: number, data: { name?: string; description?: string }) =>
    apiClient.patch<ApiResponse<Project>>(`/projects/${id}`, data).then((r) => r.data.data),
  archive: (id: number) => apiClient.post(`/projects/${id}/archive`),
  restore: (id: number) => apiClient.post(`/projects/${id}/restore`),
  delete: (id: number) => apiClient.delete(`/projects/${id}`),
  listArchived: () =>
    apiClient.get<ApiResponse<{ id: number; name: string; description?: string }[]>>('/projects/archived')
      .then((r) => r.data.data),
  listMembers: (id: number) =>
    apiClient.get<ApiResponse<ProjectMember[]>>(`/projects/${id}/members`).then((r) => r.data.data),
  inviteMember: (id: number, data: { identifier: string; role?: string }) =>
    apiClient.post<ApiResponse<ProjectMember>>(`/projects/${id}/members`, data).then((r) => r.data.data),
  updateMemberRole: (id: number, memberId: number, role: string) =>
    apiClient.patch(`/projects/${id}/members/${memberId}`, { role }),
  removeMember: (id: number, memberId: number) =>
    apiClient.delete(`/projects/${id}/members/${memberId}`),
  reorderBoards: (id: number, boardIds: number[]) =>
    apiClient.put(`/projects/${id}/boards/order`, { boardIds }),
  getStats: (id: number) =>
    apiClient.get<ApiResponse<ProjectStats>>(`/projects/${id}/stats`).then((r) => r.data.data),
};
