import { useEffect, useMemo, useState } from 'react';
import { Row, Col, Button, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RecentTasks } from '../../components/workspace/RecentTasks';
import { StarredBoards } from '../../components/workspace/StarredBoards';
import { RecentVisits } from '../../components/workspace/RecentVisits';
import { ActivityFeed } from '../../components/workspace/ActivityFeed';
import { workspaceApi, type WorkspaceTask } from '../../api/boards';
import { WORKSPACE_DISPLAY_LIMITS } from '../../constants/workspace';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useTeamStore } from '../../stores/useTeamStore';
import '../../styles/workspace.css';
import type { ActivityItem } from '../../types/board';

export function WorkspacePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentTeamId = useTeamStore((s) => s.currentTeamId);
  const isWide = useMediaQuery('(min-width: 1200px)');
  const colSpan = isWide ? 6 : 12;
  const [extraActivities, setExtraActivities] = useState<ActivityItem[]>([]);
  const [hasMoreActivities, setHasMoreActivities] = useState(false);

  const { data, refetch, isFetching, isLoading } = useQuery({
    queryKey: ['workspace', currentTeamId],
    queryFn: workspaceApi.dashboard,
    refetchInterval: 30000,
  });

  const visibleTasks = useMemo(
    () => (data?.recentTasks ?? []).filter((t) => t.boardId && t.boardName && t.projectId),
    [data?.recentTasks],
  );

  const boardIds = useMemo(
    () => [...new Set(visibleTasks.map((t) => t.boardId))],
    [visibleTasks]
  );

  const { data: columnMap = {} } = useQuery({
    queryKey: ['workspace-columns', boardIds],
    queryFn: async () => {
      const entries = await Promise.all(
        boardIds.map(async (id) => [id, await workspaceApi.getBoardColumns(id)] as const)
      );
      return Object.fromEntries(entries);
    },
    enabled: boardIds.length > 0,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['workspace'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    setExtraActivities([]);
  };

  useEffect(() => {
    setHasMoreActivities(
      (data?.activities?.length ?? 0) >= WORKSPACE_DISPLAY_LIMITS.activityPageSize,
    );
  }, [data?.activities]);

  const quickMove = useMutation({
    mutationFn: ({ cardId, columnId }: { cardId: number; columnId: number }) =>
      workspaceApi.quickMoveCard(cardId, columnId),
    onSuccess: () => { message.success('状态已更新'); invalidate(); },
    onError: () => message.error('更新失败'),
  });

  const unstar = useMutation({
    mutationFn: workspaceApi.unstarBoard,
    onSuccess: () => { message.success('已取消星标'); invalidate(); },
  });

  const archive = useMutation({
    mutationFn: workspaceApi.archiveBoard,
    onSuccess: () => { message.success('看板已归档'); invalidate(); },
  });

  const removeVisit = useMutation({
    mutationFn: workspaceApi.removeVisit,
    onSuccess: () => invalidate(),
  });

  const loadMoreActivities = useMutation({
    mutationFn: () => workspaceApi.activities(
      WORKSPACE_DISPLAY_LIMITS.activityPageSize + extraActivities.length,
      WORKSPACE_DISPLAY_LIMITS.activityPageSize,
    ),
    onSuccess: (items) => {
      setExtraActivities((prev) => [...prev, ...items]);
      setHasMoreActivities(items.length >= WORKSPACE_DISPLAY_LIMITS.activityPageSize);
    },
  });

  const handleCardClick = (task: WorkspaceTask) => {
    navigate(`/board/${task.boardId}?card=${task.id}`);
  };

  const handleBoardClick = (task: WorkspaceTask) => {
    navigate(`/board/${task.boardId}`);
  };

  const activities = [
    ...(data?.activities ?? []).slice(0, WORKSPACE_DISPLAY_LIMITS.activities),
    ...extraActivities,
  ];

  return (
    <div className="workspace-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>工作台</h2>
        <Button icon={<ReloadOutlined />} loading={isFetching} onClick={() => { refetch(); invalidate(); }}>
          刷新
        </Button>
      </div>
      {isLoading ? <div>加载中...</div> : (
        <Row gutter={[16, 16]}>
          <Col span={colSpan}>
            <RecentTasks
              tasks={visibleTasks}
              columnOptions={columnMap}
              onCardClick={handleCardClick}
              onBoardClick={handleBoardClick}
              onQuickMove={(cardId, columnId) => quickMove.mutate({ cardId, columnId })}
            />
          </Col>
          <Col span={colSpan}>
            <StarredBoards
              boards={data?.starredBoards ?? []}
              onUnstar={(id) => unstar.mutate(id)}
              onArchive={(id) => archive.mutate(id)}
            />
          </Col>
          <Col span={colSpan}>
            <RecentVisits
              visits={data?.recentVisits ?? []}
              onRemove={(id) => removeVisit.mutate(id)}
            />
          </Col>
          <Col span={colSpan}>
            <ActivityFeed
              activities={activities}
              hasMore={hasMoreActivities}
              loadingMore={loadMoreActivities.isPending}
              onLoadMore={() => loadMoreActivities.mutate()}
            />
          </Col>
        </Row>
      )}
    </div>
  );
}
