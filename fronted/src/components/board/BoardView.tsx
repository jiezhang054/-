import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { Board, Swimlane } from '../../types/board';
import { BoardColumnView } from './BoardColumn';
import { boardsApi } from '../../api/boards';
import { useBoardStore } from '../../stores/useUIStore';

interface Props {
  board: Board;
  onCardClick: (cardId: number) => void;
  onRefresh?: () => void;
}

export function BoardView({ board, onCardClick, onRefresh }: Props) {
  const { addColumn } = useBoardStore();
  const columns = board.columns ?? [];
  const swimlanes = board.swimlanes ?? [];
  const cards = board.cards ?? [];

  const getCards = (columnId: number, swimlaneId?: number) =>
    cards.filter(
      (c) => c.columnId === columnId && (swimlaneId === undefined || c.swimlaneId === swimlaneId)
    );

  const handleAddColumn = async () => {
    const name = `新列 ${columns.length + 1}`;
    try {
      const col = await boardsApi.addColumn(board.id, name);
      addColumn(col);
      onRefresh?.();
    } catch {
      message.error('添加列失败');
    }
  };

  if (!board.swimlanesEnabled || swimlanes.length === 0) {
    return (
      <div className="board-canvas">
        <div className="board-grid">
          {columns.map((col) => (
            <BoardColumnView
              key={col.id}
              column={col}
              cards={getCards(col.id)}
              boardId={board.id}
              onCardClick={onCardClick}
              onRefresh={onRefresh}
            />
          ))}
          <div className="board-column board-column--add">
            <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddColumn} block>
              添加列
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const lanes: (Swimlane | { id: 0; name: string })[] = swimlanes.length
    ? swimlanes
    : [{ id: 0, name: '' }];

  return (
    <div className="board-canvas">
      <div style={{ marginBottom: 8 }}>
        <div className="board-swimlane-row">
          <div className="board-swimlane-label" />
          {columns.map((col) => (
            <div key={col.id} className="board-column-header" style={{ width: 300 }}>
              {col.name} ({getCards(col.id).length})
            </div>
          ))}
        </div>
      </div>
      {lanes.map((lane) => (
        <div key={lane.id} className="board-swimlane-row">
          <div className="board-swimlane-label">{lane.name}</div>
          {columns.map((col) => (
            <BoardColumnView
              key={`${lane.id}-${col.id}`}
              column={col}
              cards={getCards(col.id, lane.id || undefined)}
              boardId={board.id}
              swimlaneId={lane.id || undefined}
              onCardClick={onCardClick}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
