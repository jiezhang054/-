import { Button, Dropdown, Input, Modal, message } from 'antd';
import { PlusOutlined, MoreOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useState } from 'react';
import type { Board, Swimlane } from '../../types/board';
import { BoardColumnView } from './BoardColumn';
import { boardsApi } from '../../api/boards';
import { useBoardStore } from '../../stores/useUIStore';

interface Props {
  board: Board;
  canWrite?: boolean;
  onCardClick: (cardId: number) => void;
  onCardContextMenu?: (card: import('../../types/board').CardItem, e: React.MouseEvent) => void;
  onRefresh?: () => void;
}

export function BoardView({ board, canWrite = true, onCardClick, onCardContextMenu, onRefresh }: Props) {
  const { addColumn } = useBoardStore();
  const columns = [...(board.columns ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const swimlanes = [...(board.swimlanes ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const cards = board.cards ?? [];
  const columnIds = columns.map((c) => c.id);

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

  const handleAddSwimlane = async () => {
    const name = `泳道 ${swimlanes.length + 1}`;
    try {
      await boardsApi.addSwimlane(board.id, name);
      message.success('泳道已添加');
      onRefresh?.();
    } catch {
      message.error('添加泳道失败');
    }
  };

  const swimlaneMenu = (lane: Swimlane): MenuProps['items'] => [
    {
      key: 'rename',
      label: '重命名',
      onClick: () => {
        Modal.confirm({
          title: '重命名泳道',
          content: <Input id="swimlane-rename" defaultValue={lane.name} />,
          onOk: async () => {
            const input = document.getElementById('swimlane-rename') as HTMLInputElement;
            await boardsApi.renameSwimlane(lane.id, input.value);
            onRefresh?.();
          },
        });
      },
    },
    {
      key: 'delete',
      label: '删除泳道',
      danger: true,
      onClick: async () => {
        await boardsApi.deleteSwimlane(lane.id);
        onRefresh?.();
      },
    },
  ];

  const columnProps = (col: typeof columns[0], idx: number, swimlaneId?: number) => ({
    column: col,
    cards: getCards(col.id, swimlaneId),
    boardId: board.id,
    swimlaneId,
    columnIndex: idx,
    columnIds,
    canWrite,
    onCardClick,
    onRefresh,
    onCardContextMenu,
  });

  if (!board.swimlanesEnabled || swimlanes.length === 0) {
    return (
      <div className="board-canvas">
        <div className="board-grid">
          {columns.map((col, idx) => (
            <BoardColumnView key={col.id} {...columnProps(col, idx)} />
          ))}
          {canWrite && (
            <div className="board-column board-column--add">
              <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddColumn} block>
                添加列
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="board-canvas">
      <div style={{ marginBottom: 8 }}>
        <div className="board-swimlane-row">
          <div className="board-swimlane-label">
            {canWrite && (
              <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={handleAddSwimlane}>
                泳道
              </Button>
            )}
          </div>
          {columns.map((col) => (
            <div key={col.id} className="board-column-header" style={{ width: 300 }}>
              {col.name} ({getCards(col.id).length})
            </div>
          ))}
        </div>
      </div>
      {swimlanes.map((lane) => (
        <div key={lane.id} className="board-swimlane-row">
          <div className="board-swimlane-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>{lane.name}</span>
            {canWrite && (
              <Dropdown menu={{ items: swimlaneMenu(lane) }} trigger={['click']}>
                <Button type="text" size="small" icon={<MoreOutlined />} />
              </Dropdown>
            )}
          </div>
          {columns.map((col, idx) => (
            <BoardColumnView key={`${lane.id}-${col.id}`} {...columnProps(col, idx, lane.id)} />
          ))}
        </div>
      ))}
    </div>
  );
}
