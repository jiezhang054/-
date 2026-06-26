import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Board, CardItem, BoardMember } from '../types/board';

export interface BoardFilter {
  keyword: string;
  label?: string;
  memberId?: number;
}

interface UIState {
  sidebarCollapsed: boolean;
  selectedCardId: number | null;
  cardDrawerOpen: boolean;
  sprintPlanOpen: boolean;
  milestonePlanOpen: boolean;
  membersModalOpen: boolean;
  activityDrawerOpen: boolean;
  settingsModalOpen: boolean;
  boardFilter: BoardFilter;
  batchMode: boolean;
  selectedCardIds: number[];
  language: 'zh-CN' | 'en-US';
  toggleSidebar: () => void;
  openCardDrawer: (cardId: number) => void;
  closeCardDrawer: () => void;
  setSprintPlanOpen: (open: boolean) => void;
  setMilestonePlanOpen: (open: boolean) => void;
  setMembersModalOpen: (open: boolean) => void;
  setActivityDrawerOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setBoardFilter: (filter: Partial<BoardFilter>) => void;
  clearBoardFilter: () => void;
  setBatchMode: (on: boolean) => void;
  toggleCardSelection: (cardId: number) => void;
  clearCardSelection: () => void;
  setLanguage: (lang: 'zh-CN' | 'en-US') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      selectedCardId: null,
      cardDrawerOpen: false,
      sprintPlanOpen: false,
      milestonePlanOpen: false,
      membersModalOpen: false,
      activityDrawerOpen: false,
      settingsModalOpen: false,
      boardFilter: { keyword: '' },
      batchMode: false,
      selectedCardIds: [],
      language: 'zh-CN',
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      openCardDrawer: (cardId) => set({ selectedCardId: cardId, cardDrawerOpen: true }),
      closeCardDrawer: () => set({ selectedCardId: null, cardDrawerOpen: false }),
      setSprintPlanOpen: (open) => set({ sprintPlanOpen: open }),
      setMilestonePlanOpen: (open) => set({ milestonePlanOpen: open }),
      setMembersModalOpen: (open) => set({ membersModalOpen: open }),
      setActivityDrawerOpen: (open) => set({ activityDrawerOpen: open }),
      setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),
      setBoardFilter: (filter) => set((s) => ({ boardFilter: { ...s.boardFilter, ...filter } })),
      clearBoardFilter: () => set({ boardFilter: { keyword: '' } }),
      setBatchMode: (batchMode) => set({ batchMode, selectedCardIds: batchMode ? [] : [] }),
      toggleCardSelection: (cardId) => set((s) => ({
        selectedCardIds: s.selectedCardIds.includes(cardId)
          ? s.selectedCardIds.filter((id) => id !== cardId)
          : [...s.selectedCardIds, cardId],
      })),
      clearCardSelection: () => set({ selectedCardIds: [], batchMode: false }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'scrum-ui',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, language: s.language }),
    },
  ),
);

interface BoardState {
  board: Board | null;
  members: BoardMember[];
  activeId: string | null;
  setBoard: (board: Board | null) => void;
  setMembers: (members: BoardMember[]) => void;
  setActiveId: (id: string | null) => void;
  moveCard: (cardId: number, columnId: number, swimlaneId?: number, sortOrder?: number) => void;
  updateCard: (cardId: number, updates: Partial<CardItem>) => void;
  addCard: (card: CardItem) => void;
  removeCard: (cardId: number) => void;
  addColumn: (column: Board['columns'][0]) => void;
  updateColumn: (columnId: number, name: string) => void;
  removeColumn: (columnId: number) => void;
  getCard: (cardId: number) => CardItem | undefined;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  board: null,
  members: [],
  activeId: null,
  setBoard: (board) => set({ board: board ? JSON.parse(JSON.stringify(board)) : null }),
  setMembers: (members) => set({ members }),
  setActiveId: (activeId) => set({ activeId }),
  moveCard: (cardId, columnId, swimlaneId, sortOrder = 0) => {
    const board = get().board;
    if (!board) return;
    const cards = board.cards.map((c) =>
      c.id === cardId ? { ...c, columnId, swimlaneId: swimlaneId ?? c.swimlaneId, sortOrder } : c,
    );
    set({ board: { ...board, cards } });
  },
  updateCard: (cardId, updates) => {
    const board = get().board;
    if (!board) return;
    const cards = board.cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c));
    set({ board: { ...board, cards } });
  },
  addCard: (card) => {
    const board = get().board;
    if (!board) return;
    set({ board: { ...board, cards: [...board.cards, card] } });
  },
  removeCard: (cardId) => {
    const board = get().board;
    if (!board) return;
    set({ board: { ...board, cards: board.cards.filter((c) => c.id !== cardId) } });
  },
  addColumn: (column) => {
    const board = get().board;
    if (!board) return;
    set({ board: { ...board, columns: [...board.columns, column] } });
  },
  updateColumn: (columnId, name) => {
    const board = get().board;
    if (!board) return;
    const columns = board.columns.map((c) => (c.id === columnId ? { ...c, name } : c));
    set({ board: { ...board, columns } });
  },
  removeColumn: (columnId) => {
    const board = get().board;
    if (!board) return;
    set({ board: { ...board, columns: board.columns.filter((c) => c.id !== columnId) } });
  },
  getCard: (cardId) => get().board?.cards.find((c) => c.id === cardId),
}));
