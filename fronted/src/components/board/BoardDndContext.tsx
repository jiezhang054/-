import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import type { Board } from '../../types/board';
import { useBoardStore } from '../../stores/useUIStore';
import { BoardCard } from './BoardCard';

interface Props {
  board: Board;
  children: React.ReactNode;
  onMoveCard?: (cardId: number, columnId: number, swimlaneId?: number) => void;
}

export function BoardDndContext({ board, children, onMoveCard }: Props) {
  const { setActiveId, moveCard } = useBoardStore();
  const [activeCard, setActiveCard] = useState<Board['cards'][0] | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    setActiveId(id);
    const cardId = parseInt(id.replace('card-', ''), 10);
    const card = board.cards.find((c) => c.id === cardId);
    setActiveCard(card || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const cardId = parseInt(String(active.id).replace('card-', ''), 10);
    const overId = String(over.id);

    let columnId: number | undefined;
    let swimlaneId: number | undefined;

    if (overId.startsWith('column-')) {
      columnId = parseInt(overId.replace('column-', ''), 10);
    } else if (overId.startsWith('card-')) {
      const overCard = board.cards.find((c) => c.id === parseInt(overId.replace('card-', ''), 10));
      if (overCard) {
        columnId = overCard.columnId;
        swimlaneId = overCard.swimlaneId;
      }
    }

    if (columnId !== undefined) {
      moveCard(cardId, columnId, swimlaneId);
      onMoveCard?.(cardId, columnId, swimlaneId);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {children}
      <DragOverlay>
        {activeCard ? <BoardCard card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
