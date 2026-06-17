import { apiClient, type ApiResponse } from './client';
import type { BoardSummary } from '../types/board';
import type { MindmapSummary } from './global';

export interface MyBoardItem extends BoardSummary {
  projectId: number;
  projectName: string;
  lastVisitedAt?: string;
}

export const myApi = {
  listBoards: (params?: { filter?: string; sortBy?: string; sortDir?: string }) =>
    apiClient.get<ApiResponse<MyBoardItem[]>>('/my/boards', { params }).then((r) => r.data.data),

  listArchivedBoards: () =>
    apiClient.get<ApiResponse<{ id: number; name: string; type: string; projectName: string }[]>>('/my/boards/archived')
      .then((r) => r.data.data),

  reorderBoards: (boardIds: number[]) =>
    apiClient.put('/my/boards/order', { boardIds }),

  createBoard: (data: { name: string; template?: string; projectId?: number }) =>
    apiClient.post<ApiResponse<{ id: number; name: string }>>('/my/boards', data).then((r) => r.data.data),

  renameBoard: (boardId: number, name: string) =>
    apiClient.patch(`/boards/${boardId}`, { name }),

  moveBoard: (boardId: number, projectId: number) =>
    apiClient.patch(`/boards/${boardId}/project`, { projectId }),

  copyBoard: (boardId: number) =>
    apiClient.post<ApiResponse<{ id: number; name: string }>>(`/boards/${boardId}/copy`).then((r) => r.data.data),

  deleteBoard: (boardId: number) => apiClient.delete(`/boards/${boardId}`),

  restoreBoard: (boardId: number) => apiClient.post(`/boards/${boardId}/restore`),

  listMindmaps: (params?: { projectId?: number; sortBy?: string; sortDir?: string }) =>
    apiClient.get<ApiResponse<MindmapSummary[]>>('/mindmaps', { params }).then((r) => r.data.data),

  listArchivedMindmaps: () =>
    apiClient.get<ApiResponse<{ id: number; name: string; projectName?: string }[]>>('/mindmaps/archived')
      .then((r) => r.data.data),

  renameMindmap: (id: number, name: string) => apiClient.patch(`/mindmaps/${id}`, { name }),

  moveMindmap: (id: number, projectId?: number) =>
    apiClient.patch(`/mindmaps/${id}/project`, { projectId }),

  archiveMindmap: (id: number) => apiClient.post(`/mindmaps/${id}/archive`),

  copyMindmap: (id: number) =>
    apiClient.post<ApiResponse<{ id: number; name: string }>>(`/mindmaps/${id}/copy`).then((r) => r.data.data),

  deleteMindmap: (id: number) => apiClient.delete(`/mindmaps/${id}`),

  exportMindmap: (id: number) =>
    apiClient.get<ApiResponse<{ id: number; name: string; content?: string }>>(`/mindmaps/${id}`)
      .then((r) => r.data.data),
};
