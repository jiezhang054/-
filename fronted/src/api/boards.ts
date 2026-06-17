import { apiClient, type ApiResponse } from './client';
import type { Board, ActivityItem, RecentVisit, BurndownPoint, BurndownConfig, BoardMember } from '../types/board';
export { projectsApi, globalApi } from './global';
import { projectsApi } from './global';

export const boardsApi = {
  getById: (id: number) =>
    apiClient.get<ApiResponse<Board>>(`/boards/${id}`).then((r) => r.data.data),
  updateCardPosition: (boardId: number, updates: { cardId: number; columnId: number; swimlaneId?: number; sortOrder: number }[]) =>
    apiClient.patch(`/boards/${boardId}/cards/position`, updates),
  updateCard: (cardId: number, data: Partial<Board['cards'][0]>) =>
    apiClient.put(`/cards/${cardId}`, data).then((r) => r.data.data),
  deleteCard: (cardId: number) => apiClient.delete(`/cards/${cardId}`),
  createCard: (boardId: number, data: { columnId: number; title: string; type?: string; swimlaneId?: number; workload?: number }) =>
    apiClient.post<ApiResponse<Board['cards'][0]>>(`/boards/${boardId}/cards`, data).then((r) => r.data.data),
  batchCards: (boardId: number, data: { action: string; cardIds: number[]; columnId?: number; memberId?: number }) =>
    apiClient.post(`/boards/${boardId}/cards/batch`, data),
  addColumn: (boardId: number, name: string) =>
    apiClient.post<ApiResponse<{ id: number; name: string; sortOrder: number }>>(`/boards/${boardId}/columns`, { name }).then((r) => r.data.data),
  renameColumn: (columnId: number, name: string) =>
    apiClient.patch(`/columns/${columnId}`, { name }),
  deleteColumn: (columnId: number, moveToColumnId?: number) =>
    apiClient.delete(`/columns/${columnId}`, { params: moveToColumnId ? { moveToColumnId } : {} }),
  addSwimlane: (boardId: number, name: string) =>
    apiClient.post(`/boards/${boardId}/swimlanes`, { name }).then((r) => r.data.data),
  updateSettings: (boardId: number, data: Record<string, unknown>) =>
    apiClient.patch<ApiResponse<Board>>(`/boards/${boardId}/settings`, data).then((r) => r.data.data),
  getActivities: (boardId: number, limit = 30) =>
    apiClient.get<ApiResponse<ActivityItem[]>>(`/boards/${boardId}/activities`, { params: { limit } }).then((r) => r.data.data),
  getMembers: (boardId: number) =>
    apiClient.get<ApiResponse<BoardMember[]>>(`/boards/${boardId}/members`).then((r) => r.data.data),
  inviteMember: (boardId: number, identifier: string, role?: string) =>
    apiClient.post(`/boards/${boardId}/members`, { identifier, role }),
  getLabels: (boardId: number) =>
    apiClient.get<ApiResponse<{ name: string; color: string }[]>>(`/boards/${boardId}/labels`).then((r) => r.data.data),
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
      recentTasks: WorkspaceTask[];
      starredBoards: { id: number; name: string; projectName: string }[];
      recentVisits: RecentVisit[];
      activities: ActivityItem[];
    }>>('/workspace/dashboard').then((r) => r.data.data),

  activities: (offset = 0, limit = 20) =>
    apiClient.get<ApiResponse<ActivityItem[]>>('/workspace/activities', { params: { offset, limit } })
      .then((r) => r.data.data),

  removeVisit: (id: number) => apiClient.delete(`/workspace/visits/${id}`),

  quickMoveCard: (cardId: number, columnId: number) =>
    apiClient.patch<ApiResponse<{ id: number; columnId: number; boardId: number }>>(`/cards/${cardId}/column`, { columnId })
      .then((r) => r.data.data),

  getBoardColumns: (boardId: number) =>
    apiClient.get<ApiResponse<{ id: number; name: string; sortOrder: number }[]>>(`/boards/${boardId}/columns`)
      .then((r) => r.data.data),

  starBoard: (boardId: number) => apiClient.post(`/boards/${boardId}/star`),
  unstarBoard: (boardId: number) => apiClient.delete(`/boards/${boardId}/star`),
  archiveBoard: (boardId: number) => apiClient.post(`/boards/${boardId}/archive`),
};

export interface WorkspaceTask {
  id: number;
  title: string;
  type: string;
  workload?: number;
  dueDate?: string;
  startDate?: string;
  boardId: number;
  columnId: number;
  boardName?: string;
  boardType?: string;
  projectName?: string;
  projectId?: number;
  columnName?: string;
  memberIds: number[];
}
