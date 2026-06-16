import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { BoardColumn, CardItem } from '../../types/board';
import { BoardCard } from './BoardCard';

interface Props {
  column: BoardColumn;
  cards: CardItem[];
  onCardClick: (cardId: number) => void;
}

export function BoardColumnView({ column, cards, onCardClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: 'column', columnId: column.id },
  });

  const sorted = [...cards].sort((a, b) => a.sortOrder - b.sortOrder);
  const ids = sorted.map((c) => `card-${c.id}`);

  return (
    <div className="board-column">
      <div className="board-column-header">
        <span>{column.name}</span>
        <span style={{ color: '#8f959e', fontWeight: 400 }}>({cards.length})</span>
      </div>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className={`board-column-body ${isOver ? 'board-column-body--drop-active' : ''}`}>
          {sorted.length === 0 ? (
            <div className="board-empty-drop">拖拽卡片到此处</div>
          ) : (
            sorted.map((card) => (
              <BoardCard key={card.id} card={card} onClick={() => onCardClick(card.id)} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
