import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button, Dropdown, Input, Modal, message } from 'antd';
import { PlusOutlined, MoreOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useState } from 'react';
import type { BoardColumn, CardItem } from '../../types/board';
import { BoardCard } from './BoardCard';
import { boardsApi } from '../../api/boards';
import { useBoardStore } from '../../stores/useUIStore';

interface Props {
  column: BoardColumn;
  cards: CardItem[];
  boardId: number;
  swimlaneId?: number;
  onCardClick: (cardId: number) => void;
  onRefresh?: () => void;
}

export function BoardColumnView({ column, cards, boardId, swimlaneId, onCardClick, onRefresh }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: 'column', columnId: column.id },
  });
  const { addCard, updateColumn, removeColumn } = useBoardStore();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(column.name);

  const sorted = [...cards].sort((a, b) => a.sortOrder - b.sortOrder);
  const ids = sorted.map((c) => `card-${c.id}`);

  const handleAddCard = async () => {
    if (!newTitle.trim()) return;
    try {
      const card = await boardsApi.createCard(boardId, {
        columnId: column.id,
        title: newTitle.trim(),
        swimlaneId,
      });
      addCard(card);
      setNewTitle('');
      setAdding(false);
      onRefresh?.();
    } catch {
      message.error('创建卡片失败');
    }
  };

  const handleRename = async () => {
    if (!renameValue.trim()) return;
    try {
      await boardsApi.renameColumn(column.id, renameValue.trim());
      updateColumn(column.id, renameValue.trim());
      setRenaming(false);
      onRefresh?.();
    } catch {
      message.error('重命名失败');
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: `删除列「${column.name}」？`,
      content: '列内卡片将移动到相邻列',
      onOk: async () => {
        try {
          await boardsApi.deleteColumn(column.id);
          removeColumn(column.id);
          onRefresh?.();
        } catch {
          message.error('删除失败');
        }
      },
    });
  };

  const menuItems: MenuProps['items'] = [
    { key: 'rename', label: '重命名', onClick: () => { setRenameValue(column.name); setRenaming(true); } },
    { key: 'delete', label: '删除列', danger: true, onClick: handleDelete },
  ];

  return (
    <div className="board-column">
      <div className="board-column-header">
        <span>{column.name}</span>
        <span style={{ color: '#8f959e', fontWeight: 400 }}>({cards.length})</span>
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button type="text" size="small" icon={<MoreOutlined />} style={{ marginLeft: 'auto' }} />
        </Dropdown>
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
      {adding ? (
        <div style={{ padding: 8 }}>
          <Input
            size="small"
            placeholder="卡片标题"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onPressEnter={handleAddCard}
            autoFocus
          />
          <div style={{ marginTop: 4, display: 'flex', gap: 4 }}>
            <Button size="small" type="primary" onClick={handleAddCard}>添加</Button>
            <Button size="small" onClick={() => { setAdding(false); setNewTitle(''); }}>取消</Button>
          </div>
        </div>
      ) : (
        <Button type="text" size="small" icon={<PlusOutlined />} block onClick={() => setAdding(true)}>
          添加卡片
        </Button>
      )}
      <Modal title="重命名列" open={renaming} onOk={handleRename} onCancel={() => setRenaming(false)}>
        <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
      </Modal>
    </div>
  );
}
