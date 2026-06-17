export type BoardType = 'NORMAL' | 'ROADMAP' | 'MILESTONE' | 'SPRINT';
export type CardType = 'EPIC' | 'USER_STORY' | 'TASK' | 'BUG' | 'OTHER';
export type ProjectRole = 'OWNER' | 'MEMBER' | 'READONLY';
export type BoardRole = 'ADMIN' | 'MEMBER' | 'READONLY';

export interface User {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
  email?: string;
  background?: string;
  locale?: string;
}

export interface Label {
  id: number;
  name: string;
  color: string;
}

export interface ChecklistItem {
  id: number;
  text: string;
  done: boolean;
}

export interface Comment {
  id: number;
  userId: number;
  userName: string;
  content: string;
  createdAt: string;
}

export interface CardItem {
  id: number;
  title: string;
  description?: string;
  type: CardType;
  columnId: number;
  swimlaneId?: number;
  sortOrder: number;
  workload: number;
  dueDate?: string;
  startDate?: string;
  memberIds: number[];
  labels: Label[];
  checklist: ChecklistItem[];
  comments: Comment[];
  isReference?: boolean;
  sourceCardId?: number;
  sourceBoardName?: string;
  version?: number;
}

export interface BoardColumn {
  id: number;
  name: string;
  sortOrder: number;
}

export interface Swimlane {
  id: number;
  name: string;
  sortOrder: number;
}

export interface Board {
  id: number;
  name: string;
  type: BoardType;
  projectId: number;
  projectName?: string;
  parentBoardId?: number;
  swimlanesEnabled: boolean;
  startDate?: string;
  endDate?: string;
  columns: BoardColumn[];
  swimlanes: Swimlane[];
  cards: CardItem[];
  starred?: boolean;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  boards: BoardSummary[];
}

export interface BoardSummary {
  id: number;
  name: string;
  type: BoardType;
  cardCount: number;
  starred?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface ActivityItem {
  id: number;
  userId: number;
  userName: string;
  action: string;
  cardTitle?: string;
  cardId?: number;
  boardId?: number;
  createdAt: string;
}

export interface RecentVisit {
  id: number;
  type: 'board' | 'mindmap' | 'project';
  targetId: number;
  name: string;
  visitedAt: string;
}

export interface BurndownPoint {
  date: string;
  remaining: number;
  completed: number;
  added: number;
  reference?: number;
}

export interface BurndownConfig {
  mode: 'workload' | 'count';
  method: 'cumulative' | 'snapshot';
  workdaysOnly: boolean;
  todoColumnIds: number[];
  doneColumnIds: number[];
}
