import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/board';

interface AuthState {
  token: string | null;
  user: User | null;
  authReady: boolean;
  setAuth: (token: string, user: User) => void;
  setToken: (token: string) => void;
  updateUser: (user: User) => void;
  setAuthReady: (ready: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      authReady: false,
      setAuth: (token, user) => set({ token, user }),
      setToken: (token) => set({ token }),
      updateUser: (user) => set({ user }),
      setAuthReady: (authReady) => set({ authReady }),
      logout: () => set({ token: null, user: null, authReady: true }),
    }),
    {
      name: 'scrum-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
