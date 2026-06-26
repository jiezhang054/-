import { apiClient, type ApiResponse } from './client';

export type TeamRole = 'ADMIN' | 'OWNER' | 'MEMBER';

export interface Team {
  id: number;
  name: string;
  description?: string;
  avatar?: string;
  ownerId?: number;
  role?: TeamRole;
  memberCount?: number;
}

export interface TeamMember {
  id: number;
  username: string;
  displayName: string;
  email?: string;
  avatar?: string;
  role: TeamRole;
}

export interface TeamContext {
  teams: Team[];
  currentTeamId: number | null;
}

export const teamsApi = {
  list: () => apiClient.get<ApiResponse<Team[]>>('/teams').then((r) => r.data.data),
  context: () => apiClient.get<ApiResponse<TeamContext>>('/teams/context').then((r) => r.data.data),
  getById: (id: number) => apiClient.get<ApiResponse<Team>>(`/teams/${id}`).then((r) => r.data.data),
  create: (data: { name: string; description?: string }) =>
    apiClient.post<ApiResponse<Team>>('/teams', data).then((r) => r.data.data),
  update: (id: number, data: { name?: string; description?: string }) =>
    apiClient.patch<ApiResponse<Team>>(`/teams/${id}`, data).then((r) => r.data.data),
  delete: (id: number) => apiClient.delete(`/teams/${id}`),
  listMembers: (id: number) =>
    apiClient.get<ApiResponse<TeamMember[]>>(`/teams/${id}/members`).then((r) => r.data.data),
  inviteMember: (id: number, data: { identifier: string; role?: TeamRole }) =>
    apiClient.post<ApiResponse<TeamMember>>(`/teams/${id}/members`, data).then((r) => r.data.data),
  updateMemberRole: (id: number, memberId: number, role: TeamRole) =>
    apiClient.patch(`/teams/${id}/members/${memberId}`, { role }),
  removeMember: (id: number, memberId: number) =>
    apiClient.delete(`/teams/${id}/members/${memberId}`),
  switchContext: (teamId: number | null) =>
    apiClient.put('/teams/context', { teamId }),
};
