import { apiClient, type ApiResponse } from './client';
import type { Board, ActivityItem, RecentVisit, BurndownPoint, BurndownConfig } from '../types/board';
export { projectsApi, globalApi } from './global';
import { projectsApi } from './global';

export const boardsApi = {
  getById: (id: number) =>
    apiClient.get<ApiResponse<Board>>(`/boards/${id}`).then((r) => r.data.data),
  updateCardPosition: (boardId: number, updates: { cardId: number; columnId: number; swimlaneId?: number; sortOrder: number }[]) =>
    apiClient.patch(`/boards/${boardId}/cards/position`, updates),
  updateCard: (cardId: number, data: Partial<Board['cards'][0]>) =>
    apiClient.put(`/cards/${cardId}`, data).then((r) => r.data.data),
  createReference: (cardId: number, targetBoardId: number) =>
    apiClient.post(`/cards/${cardId}/reference`, { targetBoardId }).then((r) => r.data.data),
  milestonePlan: (boardId: number, data: { name: string; startDate: string; endDate: string; epicIds: number[] }) =>
    apiClient.post(`/boards/${boardId}/milestone-plan`, data).then((r) => r.data.data),
  sprintPlan: (boardId: number, data: { sprints: { name: string; startDate: string; endDate: string; storyIds: number[] }[] }) =>
    apiClient.post(`/boards/${boardId}/sprint-plan`, data).then((r) => r.data.data),
  getBurndown: (boardId: number, config: BurndownConfig) =>
    apiClient.post<ApiResponse<BurndownPoint[]>>(`/boards/${boardId}/burndown`, config).then((r) => r.data.data),
  exportJson: (boardId: number) =>
    apiClient.get(`/boards/${boardId}/export/json`, { responseType: 'blob' }),
  importJson: (boardId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post(`/boards/${boardId}/import/json`, form);
  },
  createSnapshot: (boardId: number) =>
    apiClient.post<ApiResponse<{ url: string }>>(`/boards/${boardId}/snapshot`).then((r) => r.data.data),
};


export const workspaceApi = {
  dashboard: () =>
    apiClient.get<ApiResponse<{
      recentTasks: Board['cards'];
      starredBoards: { id: number; name: string; projectName: string }[];
      recentVisits: RecentVisit[];
      activities: ActivityItem[];
    }>>('/workspace/dashboard').then((r) => r.data.data),
};
