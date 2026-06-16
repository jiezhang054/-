import type { Board, CardItem } from '../types/board';

export function normalizeCard(card: Partial<CardItem> & { id: number; title: string }): CardItem {
  return {
    id: card.id,
    title: card.title,
    description: card.description ?? '',
    type: card.type ?? 'TASK',
    columnId: card.columnId ?? 0,
    swimlaneId: card.swimlaneId,
    sortOrder: card.sortOrder ?? 0,
    workload: card.workload ?? 1,
    dueDate: card.dueDate,
    startDate: card.startDate,
    memberIds: card.memberIds ?? [],
    labels: card.labels ?? [],
    checklist: card.checklist ?? [],
    comments: card.comments ?? [],
    isReference: card.isReference,
    sourceCardId: card.sourceCardId,
    sourceBoardName: card.sourceBoardName,
    version: card.version,
  };
}

export function normalizeBoard(data: Partial<Board> & { id: number; name: string }): Board {
  return {
    id: data.id,
    name: data.name,
    type: data.type ?? 'NORMAL',
    projectId: data.projectId ?? 0,
    projectName: data.projectName,
    parentBoardId: data.parentBoardId,
    swimlanesEnabled: data.swimlanesEnabled ?? false,
    startDate: data.startDate,
    endDate: data.endDate,
    starred: data.starred,
    columns: data.columns ?? [],
    swimlanes: data.swimlanes ?? [],
    cards: (data.cards ?? []).map((c) => normalizeCard(c)),
  };
}

export function getStoriesFromDoneColumn(board: Board): CardItem[] {
  const doneCol = board.columns.find((c) => c.name.includes('梳理完成'));
  if (doneCol) {
    return board.cards.filter((c) => c.type === 'USER_STORY' && c.columnId === doneCol.id);
  }
  return board.cards.filter((c) => c.type === 'USER_STORY');
}
