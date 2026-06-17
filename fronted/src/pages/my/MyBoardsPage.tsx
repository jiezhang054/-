import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Button, Space, Segmented, Select, List, Dropdown, Modal, Input, message, Empty, Tag,
} from 'antd';
import {
  PlusOutlined, StarFilled, StarOutlined, ExportOutlined, InboxOutlined,
  EditOutlined, SwapOutlined, CopyOutlined, DeleteOutlined,
  ArrowUpOutlined, ArrowDownOutlined, VerticalAlignTopOutlined, VerticalAlignBottomOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { MenuProps } from 'antd';
import { myApi, type MyBoardItem } from '../../api/my';
import { workspaceApi } from '../../api/boards';
import { projectsApi } from '../../api/global';
import { CreateBoardModal } from '../../components/global/CreateBoardModal';

type FilterMode = 'all' | 'incomplete' | 'complete';

function SortableItem({ board, menu }: { board: MyBoardItem; menu: MenuProps['items'] }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: board.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Dropdown menu={{ items: menu }} trigger={['contextMenu']}>
        <List.Item
          style={{ cursor: 'pointer', padding: '12px 0' }}
          onClick={() => navigate(`/board/${board.id}`)}
          actions={[
            board.starred ? <StarFilled key="s" style={{ color: '#faad14' }} /> : null,
          ].filter(Boolean)}
        >
          <List.Item.Meta
            title={<span>{board.name} <Tag>{board.type}</Tag></span>}
            description={`${board.projectName} · ${board.cardCount} 卡片${board.lastVisitedAt ? ` · 访问于 ${String(board.lastVisitedAt).slice(0, 10)}` : ''}`}
          />
        </List.Item>
      </Dropdown>
    </div>
  );
}

export function MyBoardsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sortBy, setSortBy] = useState('custom');
  const [sortDir, setSortDir] = useState('desc');
  const [boardOrder, setBoardOrder] = useState<number[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameName, setRenameName] = useState('');
  const [moveId, setMoveId] = useState<number | null>(null);
  const [moveProjectId, setMoveProjectId] = useState<number>();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ['my-boards', filter, sortBy, sortDir],
    queryFn: () => myApi.listBoards({ filter, sortBy, sortDir }),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  useEffect(() => {
    if (boards.length) setBoardOrder(boards.map((b) => b.id));
  }, [boards]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['my-boards'] });
    queryClient.invalidateQueries({ queryKey: ['navigation'] });
  };

  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) => myApi.reorderBoards(ids),
    onError: () => message.error('排序保存失败'),
  });

  const orderedBoards = useMemo(() => {
    const map = new Map(boards.map((b) => [b.id, b]));
    return boardOrder.map((id) => map.get(id)).filter(Boolean) as MyBoardItem[];
  }, [boards, boardOrder]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = boardOrder.indexOf(Number(active.id));
    const newIndex = boardOrder.indexOf(Number(over.id));
    const next = arrayMove(boardOrder, oldIndex, newIndex);
    setBoardOrder(next);
    reorderMutation.mutate(next);
  };

  const moveInList = (boardId: number, action: 'up' | 'down' | 'top' | 'bottom') => {
    const idx = boardOrder.indexOf(boardId);
    if (idx < 0) return;
    let next = [...boardOrder];
    if (action === 'up' && idx > 0) next = arrayMove(next, idx, idx - 1);
    if (action === 'down' && idx < next.length - 1) next = arrayMove(next, idx, idx + 1);
    if (action === 'top') { next.splice(idx, 1); next.unshift(boardId); }
    if (action === 'bottom') { next.splice(idx, 1); next.push(boardId); }
    setBoardOrder(next);
    reorderMutation.mutate(next);
  };

  const boardMenu = (b: MyBoardItem): MenuProps['items'] => [
    { key: 'open', label: '打开', onClick: () => navigate(`/board/${b.id}`) },
    { key: 'newtab', label: '新标签页打开', icon: <ExportOutlined />, onClick: () => window.open(`/board/${b.id}`, '_blank') },
    b.starred
      ? { key: 'unstar', label: '取消星标', icon: <StarOutlined />, onClick: () => workspaceApi.unstarBoard(b.id).then(invalidate) }
      : { key: 'star', label: '标星', icon: <StarFilled />, onClick: () => workspaceApi.starBoard(b.id).then(invalidate) },
    { key: 'rename', label: '重命名', icon: <EditOutlined />, onClick: () => { setRenameId(b.id); setRenameName(b.name); } },
    { key: 'move', label: '移动至项目', icon: <SwapOutlined />, onClick: () => { setMoveId(b.id); setMoveProjectId(b.projectId); } },
    { key: 'copy', label: '复制', icon: <CopyOutlined />, onClick: () => myApi.copyBoard(b.id).then(() => { message.success('已复制'); invalidate(); }) },
    { key: 'archive', label: '归档', icon: <InboxOutlined />, onClick: () => workspaceApi.archiveBoard(b.id).then(() => { message.success('已归档'); invalidate(); }) },
    { type: 'divider' },
    { key: 'up', label: '上移', icon: <ArrowUpOutlined />, onClick: () => moveInList(b.id, 'up') },
    { key: 'down', label: '下移', icon: <ArrowDownOutlined />, onClick: () => moveInList(b.id, 'down') },
    { key: 'top', label: '置顶', icon: <VerticalAlignTopOutlined />, onClick: () => moveInList(b.id, 'top') },
    { key: 'bottom', label: '置底', icon: <VerticalAlignBottomOutlined />, onClick: () => moveInList(b.id, 'bottom') },
    { type: 'divider' },
    { key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true, onClick: () => {
      Modal.confirm({
        title: '确定删除该看板？',
        content: '删除后不可恢复。',
        okType: 'danger',
        onOk: () => myApi.deleteBoard(b.id).then(() => { message.success('已删除'); invalidate(); }),
      });
    }},
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>个人看板</h2>
        <Space wrap>
          <Segmented
            value={filter}
            onChange={(v) => setFilter(v as FilterMode)}
            options={[
              { label: '全部', value: 'all' },
              { label: '未完成', value: 'incomplete' },
              { label: '已完成', value: 'complete' },
            ]}
          />
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 130 }}
            options={[
              { value: 'custom', label: '自定义排序' },
              { value: 'name', label: '按名称' },
              { value: 'visited', label: '按访问时间' },
            ]}
          />
          <Select
            value={sortDir}
            onChange={setSortDir}
            style={{ width: 90 }}
            options={[{ value: 'desc', label: '降序' }, { value: 'asc', label: '升序' }]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新建看板</Button>
        </Space>
      </div>

      {isLoading ? null : orderedBoards.length === 0 ? (
        <Empty description="暂无看板" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedBoards.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <List dataSource={orderedBoards} renderItem={(b) => <SortableItem key={b.id} board={b} menu={boardMenu(b)} />} />
          </SortableContext>
        </DndContext>
      )}

      <div style={{ marginTop: 24 }}>
        <Link to="/my/boards/archived">查看已归档看板</Link>
        <span style={{ margin: '0 12px', color: '#d9d9d9' }}>|</span>
        <Link to="/my/projects/archived">查看已归档项目</Link>
      </div>

      <CreateBoardModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => { invalidate(); setCreateOpen(false); }} />

      <Modal title="重命名看板" open={renameId !== null} onCancel={() => setRenameId(null)}
        onOk={() => renameId && myApi.renameBoard(renameId, renameName).then(() => {
          message.success('已重命名'); setRenameId(null); invalidate();
        })}>
        <Input value={renameName} onChange={(e) => setRenameName(e.target.value)} />
      </Modal>

      <Modal title="移动至项目" open={moveId !== null} onCancel={() => setMoveId(null)}
        onOk={() => moveId && moveProjectId && myApi.moveBoard(moveId, moveProjectId).then(() => {
          message.success('已移动'); setMoveId(null); invalidate();
        })}>
        <Select style={{ width: '100%' }} value={moveProjectId} onChange={setMoveProjectId}
          options={projects.map((p) => ({ value: p.id, label: p.name }))} />
      </Modal>
    </div>
  );
}
