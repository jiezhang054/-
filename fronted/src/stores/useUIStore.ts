import { create } from 'zustand';
import type { Board, CardItem } from '../types/board';

interface UIState {
  sidebarCollapsed: boolean;
  selectedCardId: number | null;
  cardDrawerOpen: boolean;
  sprintPlanOpen: boolean;
  milestonePlanOpen: boolean;
  language: 'zh-CN' | 'en-US';
  toggleSidebar: () => void;
  openCardDrawer: (cardId: number) => void;
  closeCardDrawer: () => void;
  setSprintPlanOpen: (open: boolean) => void;
  setMilestonePlanOpen: (open: boolean) => void;
  setLanguage: (lang: 'zh-CN' | 'en-US') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  selectedCardId: null,
  cardDrawerOpen: false,
  sprintPlanOpen: false,
  milestonePlanOpen: false,
  language: 'zh-CN',
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openCardDrawer: (cardId) => set({ selectedCardId: cardId, cardDrawerOpen: true }),
  closeCardDrawer: () => set({ selectedCardId: null, cardDrawerOpen: false }),
  setSprintPlanOpen: (open) => set({ sprintPlanOpen: open }),
  setMilestonePlanOpen: (open) => set({ milestonePlanOpen: open }),
  setLanguage: (language) => set({ language }),
}));

interface BoardState {
  board: Board | null;
  activeId: string | null;
  setBoard: (board: Board | null) => void;
  setActiveId: (id: string | null) => void;
  moveCard: (cardId: number, columnId: number, swimlaneId?: number, sortOrder?: number) => void;
  updateCard: (cardId: number, updates: Partial<CardItem>) => void;
  getCard: (cardId: number) => CardItem | undefined;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  board: null,
  activeId: null,
  setBoard: (board) => set({ board: board ? JSON.parse(JSON.stringify(board)) : null }),
  setActiveId: (activeId) => set({ activeId }),
  moveCard: (cardId, columnId, swimlaneId, sortOrder = 0) => {
    const board = get().board;
    if (!board) return;
    const cards = board.cards.map((c) =>
      c.id === cardId ? { ...c, columnId, swimlaneId: swimlaneId ?? c.swimlaneId, sortOrder } : c
    );
    set({ board: { ...board, cards } });
  },
  updateCard: (cardId, updates) => {
    const board = get().board;
    if (!board) return;
    const cards = board.cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c));
    set({ board: { ...board, cards } });
  },
  getCard: (cardId) => get().board?.cards.find((c) => c.id === cardId),
}));
