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
  splitCard: (cardId: number, tasks: { title: string; workload?: number }[]) =>
    apiClient.post(`/cards/${cardId}/split`, { tasks }).then((r) => r.data.data),
  createCard: (boardId: number, data: { columnId: number; title: string; type?: string; swimlaneId?: number; workload?: number }) =>
    apiClient.post<ApiResponse<Board['cards'][0]>>(`/boards/${boardId}/cards`, data).then((r) => r.data.data),
  batchCards: (boardId: number, data: { action: string; cardIds: number[]; columnId?: number; memberId?: number }) =>
    apiClient.post(`/boards/${boardId}/cards/batch`, data),
  reorderColumns: (boardId: number, columnIds: number[]) =>
    apiClient.put(`/boards/${boardId}/columns/order`, { columnIds }),
  renameSwimlane: (swimlaneId: number, name: string) =>
    apiClient.patch(`/swimlanes/${swimlaneId}`, { name }),
  deleteSwimlane: (swimlaneId: number) => apiClient.delete(`/swimlanes/${swimlaneId}`),
  reorderSwimlanes: (boardId: number, swimlaneIds: number[]) =>
    apiClient.put(`/boards/${boardId}/swimlanes/order`, { swimlaneIds }),
  addComment: (cardId: number, content: string) =>
    apiClient.post(`/cards/${cardId}/comments`, { content }).then((r) => r.data.data),
  getTrash: (boardId: number) =>
    apiClient.get<ApiResponse<{ id: number; title: string; type: string }[]>>(`/boards/${boardId}/trash`)
      .then((r) => r.data.data),
  restoreTrashCard: (boardId: number, cardId: number) =>
    apiClient.post(`/boards/${boardId}/trash/${cardId}/restore`),
  purgeTrashCard: (boardId: number, cardId: number) =>
    apiClient.delete(`/boards/${boardId}/trash/${cardId}`),
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
    apiClient.post<ApiResponse<Board>>(`/boards/${boardId}/milestone-plan`, data).then((r) => r.data.data),
  sprintPlan: (boardId: number, data: { sprints: { name: string; startDate: string; endDate: string; storyIds: number[] }[] }) =>
    apiClient.post<ApiResponse<Board>>(`/boards/${boardId}/sprint-plan`, data).then((r) => r.data.data),
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


function pickField<T>(row: Record<string, unknown>, key: string): T | undefined {
  if (row[key] !== undefined && row[key] !== null) return row[key] as T;
  const lower = key.toLowerCase();
  if (row[lower] !== undefined && row[lower] !== null) return row[lower] as T;
  return undefined;
}

function normalizeWorkspaceTask(raw: Record<string, unknown>): WorkspaceTask {
  return {
    id: Number(pickField(raw, 'id')),
    title: String(pickField<string>(raw, 'title') ?? ''),
    type: String(pickField<string>(raw, 'type') ?? 'TASK'),
    workload: pickField<number>(raw, 'workload'),
    dueDate: pickField<string>(raw, 'dueDate'),
    startDate: pickField<string>(raw, 'startDate'),
    boardId: Number(pickField(raw, 'boardId')),
    columnId: Number(pickField(raw, 'columnId')),
    boardName: pickField<string>(raw, 'boardName'),
    boardType: pickField<string>(raw, 'boardType'),
    projectName: pickField<string>(raw, 'projectName'),
    projectId: Number(pickField(raw, 'projectId')),
    columnName: pickField<string>(raw, 'columnName'),
    memberIds: (pickField<number[]>(raw, 'memberIds') ?? []) as number[],
  };
}

function normalizeActivity(raw: Record<string, unknown>): ActivityItem {
  return {
    id: Number(pickField(raw, 'id')),
    userId: Number(pickField(raw, 'userId')),
    userName: String(pickField<string>(raw, 'userName') ?? ''),
    action: String(pickField<string>(raw, 'action') ?? ''),
    cardTitle: pickField<string>(raw, 'cardTitle'),
    cardId: pickField<number>(raw, 'cardId'),
    boardId: pickField<number>(raw, 'boardId'),
    createdAt: String(pickField<string>(raw, 'createdAt') ?? ''),
  };
}

function normalizeRecentVisit(raw: Record<string, unknown>): RecentVisit {
  return {
    id: Number(pickField(raw, 'id')),
    type: pickField<RecentVisit['type']>(raw, 'type') ?? 'board',
    targetId: Number(pickField(raw, 'targetId')),
    name: String(pickField<string>(raw, 'name') ?? ''),
    visitedAt: String(pickField<string>(raw, 'visitedAt') ?? ''),
  };
}

export const workspaceApi = {
  dashboard: () =>
    apiClient.get<ApiResponse<{
      recentTasks: Record<string, unknown>[];
      starredBoards: Record<string, unknown>[];
      recentVisits: Record<string, unknown>[];
      activities: Record<string, unknown>[];
    }>>('/workspace/dashboard').then((r) => ({
      recentTasks: (r.data.data.recentTasks ?? []).map(normalizeWorkspaceTask),
      starredBoards: (r.data.data.starredBoards ?? []).map((b) => ({
        id: Number(pickField(b, 'id')),
        name: String(pickField<string>(b, 'name') ?? ''),
        projectName: String(pickField<string>(b, 'projectName') ?? ''),
      })),
      recentVisits: (r.data.data.recentVisits ?? []).map(normalizeRecentVisit),
      activities: (r.data.data.activities ?? []).map(normalizeActivity),
    })),

  activities: (offset = 0, limit = 20) =>
    apiClient.get<ApiResponse<Record<string, unknown>[]>>('/workspace/activities', { params: { offset, limit } })
      .then((r) => (r.data.data ?? []).map(normalizeActivity)),

  removeVisit: (id: number) => apiClient.delete(`/workspace/visits/${id}`),

  quickMoveCard: (cardId: number, columnId: number) =>
    apiClient.patch<ApiResponse<{ id: number; columnId: number; boardId: number }>>(`/cards/${cardId}/column`, { columnId })
      .then((r) => r.data.data),

  getBoardColumns: (boardId: number) =>
    apiClient.get<ApiResponse<Record<string, unknown>[]>>(`/boards/${boardId}/columns`)
      .then((r) => (r.data.data ?? []).map((col) => ({
        id: Number(pickField(col, 'id')),
        name: String(pickField<string>(col, 'name') ?? ''),
        sortOrder: Number(pickField(col, 'sortOrder') ?? 0),
      }))),

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
