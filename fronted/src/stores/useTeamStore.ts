import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Team } from '../api/teams';
import { teamsApi } from '../api/teams';

interface TeamState {
  teams: Team[];
  currentTeamId: number | null;
  loaded: boolean;
  setTeams: (teams: Team[]) => void;
  setCurrentTeamId: (id: number | null) => void;
  loadContext: () => Promise<void>;
  switchTeam: (teamId: number | null) => Promise<void>;
  currentTeam: () => Team | null;
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      teams: [],
      currentTeamId: null,
      loaded: false,
      setTeams: (teams) => set({ teams }),
      setCurrentTeamId: (currentTeamId) => set({ currentTeamId }),
      loadContext: async () => {
        const ctx = await teamsApi.context();
        set({ teams: ctx.teams, currentTeamId: ctx.currentTeamId, loaded: true });
      },
      switchTeam: async (teamId) => {
        await teamsApi.switchContext(teamId);
        set({ currentTeamId: teamId });
      },
      currentTeam: () => {
        const { teams, currentTeamId } = get();
        if (currentTeamId == null) return null;
        return teams.find((t) => t.id === currentTeamId) ?? null;
      },
    }),
    {
      name: 'scrum-team',
      partialize: (s) => ({ currentTeamId: s.currentTeamId }),
    },
  ),
);
