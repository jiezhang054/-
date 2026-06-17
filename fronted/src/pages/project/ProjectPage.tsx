import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography, Tabs, Row, Col, Button, Space, Dropdown, Segmented, Spin, Empty, Modal, message,
} from 'antd';
import {
  StarFilled, PlusOutlined, BarChartOutlined, ApartmentOutlined, TeamOutlined,
  EditOutlined, InboxOutlined, DeleteOutlined, MoreOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BoardGridCard } from '../../components/project/BoardGridCard';
import { EditProjectModal } from '../../components/project/EditProjectModal';
import { ProjectMembersModal } from '../../components/project/ProjectMembersModal';
import { CreateBoardModal } from '../../components/global/CreateBoardModal';
import { projectsApi, globalApi } from '../../api/global';
import { workspaceApi } from '../../api/boards';
import type { BoardSummary } from '../../types/board';
import type { MenuProps } from 'antd';

const { Title, Text } = Typography;

type FilterMode = 'all' | 'incomplete' | 'complete';

function SortableBoard({ board, onStar, onUnstar, onArchive }: {
  board: BoardSummary;
  onStar?: (id: number) => void;
  onUnstar?: (id: number) => void;
  onArchive?: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: board.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };
  return (
    <Col ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BoardGridCard board={board} onStar={onStar} onUnstar={onUnstar} onArchive={onArchive} />
    </Col>
  );
}

export function ProjectPage() {
  const { projectId } = useParams();
  const id = Number(projectId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<FilterMode>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [editOpen, setEditOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [boardOrder, setBoardOrder] = useState<number[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getById(id),
    enabled: !Number.isNaN(id),
  });

  useEffect(() => {
    if (project?.boards) {
      setBoardOrder(project.boards.map((b) => b.id));
    }
  }, [project?.boards]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['project', id] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['navigation'] });
  };

  useEffect(() => {
    if (project) {
      globalApi.recordVisit('project', project.id, project.name).catch(() => {});
    }
  }, [project?.id]);

  const archiveMutation = useMutation({
    mutationFn: () => projectsApi.archive(id),
    onSuccess: () => { message.success('项目已归档'); navigate('/workspace'); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || '归档失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.delete(id),
    onSuccess: () => { message.success('项目已删除'); navigate('/workspace'); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || '删除失败');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) => projectsApi.reorderBoards(id, ids),
    onError: () => message.error('排序保存失败'),
  });

  const starMutation = useMutation({
    mutationFn: (boardId: number) => workspaceApi.starBoard(boardId),
    onSuccess: invalidate,
  });

  const unstarMutation = useMutation({
    mutationFn: (boardId: number) => workspaceApi.unstarBoard(boardId),
    onSuccess: invalidate,
  });

  const archiveBoardMutation = useMutation({
    mutationFn: (boardId: number) => workspaceApi.archiveBoard(boardId),
    onSuccess: () => { message.success('看板已归档'); invalidate(); },
  });

  const orderedBoards = useMemo(() => {
    if (!project?.boards) return [];
    const map = new Map(project.boards.map((b) => [b.id, b]));
    return boardOrder.map((bid) => map.get(bid)).filter(Boolean) as BoardSummary[];
  }, [project?.boards, boardOrder]);

  const filteredBoards = useMemo(() => {
    let list = orderedBoards;
    if (filter === 'incomplete') list = list.filter((b) => !b.completed);
    if (filter === 'complete') list = list.filter((b) => b.completed);
    if (activeTab !== 'all') {
      const tabBoardId = Number(activeTab);
      if (!Number.isNaN(tabBoardId)) {
        const tabBoard = list.find((b) => b.id === tabBoardId);
        if (tabBoard) list = list.filter((b) => b.type === tabBoard.type);
      }
    }
    return list;
  }, [orderedBoards, filter, activeTab]);

  const starred = orderedBoards.filter((b) => b.starred);
  const normal = filteredBoards.filter((b) => !b.starred);

  const canManage = project?.role === 'OWNER';

  const projectMenu: MenuProps['items'] = [
    { key: 'edit', icon: <EditOutlined />, label: '编辑项目', onClick: () => setEditOpen(true) },
    { key: 'members', icon: <TeamOutlined />, label: '成员管理', onClick: () => setMembersOpen(true) },
    ...(canManage ? [
      { key: 'archive', icon: <InboxOutlined />, label: '归档项目', onClick: () => {
        Modal.confirm({ title: '确定归档该项目？', onOk: () => archiveMutation.mutate() });
      }},
      { type: 'divider' as const },
      { key: 'delete', icon: <DeleteOutlined />, label: '删除项目', danger: true, onClick: () => {
        Modal.confirm({
          title: '确定彻底删除该项目？',
          content: '删除后不可恢复，所有看板和数据将被清除。',
          okType: 'danger',
          onOk: () => deleteMutation.mutate(),
        });
      }},
    ] : []),
  ];

  const tabItems = useMemo(() => {
    const items = [{ key: 'all', label: '全部看板' }];
    project?.tabs?.forEach((t) => items.push({ key: String(t.boardId), label: t.label }));
    return items;
  }, [project?.tabs]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = boardOrder.indexOf(Number(active.id));
    const newIndex = boardOrder.indexOf(Number(over.id));
    const next = arrayMove(boardOrder, oldIndex, newIndex);
    setBoardOrder(next);
    reorderMutation.mutate(next);
  };

  if (isLoading) return <Spin style={{ display: 'block', margin: '80px auto' }} />;
  if (error || !project) return <Empty description="项目不存在或无权访问" />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>{project.name}</Title>
          {project.description && <Text type="secondary">{project.description}</Text>}
        </div>
        <Space>
          <Segmented
            value={filter}
            onChange={(v) => setFilter(v as FilterMode)}
            options={[
              { label: '全部', value: 'all' },
              { label: '未完成', value: 'incomplete' },
              { label: '已完成', value: 'complete' },
            ]}
          />
          {project.mindmapId && (
            <Button icon={<ApartmentOutlined />} onClick={() => navigate(`/mindmap/${project.mindmapId}`)}>
              共享脑图
            </Button>
          )}
          <Button icon={<BarChartOutlined />} onClick={() => navigate(`/projects/${id}/stats`)}>
            统计
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setBoardModalOpen(true)}>
            新建看板
          </Button>
          <Dropdown menu={{ items: projectMenu }}>
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      </div>

      {tabItems.length > 1 && (
        <Tabs
          type="card"
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ marginBottom: 16 }}
        />
      )}

      {starred.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 12, fontWeight: 600 }}>
            <StarFilled style={{ color: '#faad14', marginRight: 8 }} />星标看板
          </div>
          <Row gutter={[16, 16]}>
            {starred.map((b) => (
              <Col key={b.id}>
                <BoardGridCard
                  board={b}
                  onStar={(bid) => starMutation.mutate(bid)}
                  onUnstar={(bid) => unstarMutation.mutate(bid)}
                  onArchive={(bid) => archiveBoardMutation.mutate(bid)}
                />
              </Col>
            ))}
          </Row>
        </div>
      )}

      {normal.length === 0 ? (
        <Empty description="暂无看板" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={normal.map((b) => b.id)} strategy={rectSortingStrategy}>
            <Row gutter={[16, 16]}>
              {normal.map((b) => (
                <SortableBoard
                  key={b.id}
                  board={b}
                  onStar={(bid) => starMutation.mutate(bid)}
                  onUnstar={(bid) => unstarMutation.mutate(bid)}
                  onArchive={(bid) => archiveBoardMutation.mutate(bid)}
                />
              ))}
            </Row>
          </SortableContext>
        </DndContext>
      )}

      {editOpen && (
        <EditProjectModal
          open={editOpen}
          project={project}
          onClose={() => setEditOpen(false)}
          onUpdated={invalidate}
        />
      )}
      <ProjectMembersModal
        open={membersOpen}
        projectId={id}
        canManage={canManage}
        onClose={() => setMembersOpen(false)}
      />
      <CreateBoardModal
        open={boardModalOpen}
        defaultProjectId={id}
        onClose={() => setBoardModalOpen(false)}
        onCreated={() => { invalidate(); setBoardModalOpen(false); }}
      />
    </div>
  );
}
