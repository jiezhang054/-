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

export interface BoardSummary {
  id: number;
  name: string;
  type: BoardType;
  cardCount: number;
  starred?: boolean;
  startDate?: string;
  endDate?: string;
  completed?: boolean;
  sortOrder?: number;
}

export interface ProjectTab {
  key: string;
  boardId: number;
  label: string;
  type: BoardType;
}

export interface ProjectMember {
  id: number;
  username: string;
  displayName: string;
  email?: string;
  avatar?: string;
  role: ProjectRole;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  template?: string;
  archived?: boolean;
  role?: ProjectRole;
  boards: BoardSummary[];
  tabs?: ProjectTab[];
  mindmapId?: number;
  mindmapName?: string;
}

export interface ProjectStats {
  backlogProgress: { boardId: number; boardName: string; columns: { name: string; count: number }[] }[];
  sprintStats: { boardId: number; boardName: string; planned: number; completed: number; rate: number }[];
  defectDistribution: { boardId: number; boardName: string; columns: { name: string; count: number }[] }[];
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
