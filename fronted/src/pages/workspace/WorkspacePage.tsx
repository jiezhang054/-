import { Row, Col, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { RecentTasks } from '../../components/workspace/RecentTasks';
import { StarredBoards } from '../../components/workspace/StarredBoards';
import { RecentVisits } from '../../components/workspace/RecentVisits';
import { ActivityFeed } from '../../components/workspace/ActivityFeed';
import { MOCK_ACTIVITIES, MOCK_RECENT_VISITS } from '../../mocks/activities';
import { MOCK_BOARDS } from '../../mocks/boards';
import { workspaceApi } from '../../api/boards';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import type { CardItem } from '../../types/board';

export function WorkspacePage() {
  const isWide = useMediaQuery('(min-width: 1200px)');
  const colSpan = isWide ? 6 : 12;

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['workspace'],
    queryFn: () => workspaceApi.dashboard().catch(() => null),
    refetchInterval: 30000,
  });

  const fallbackTasks = MOCK_BOARDS[3].cards.filter((c) => c.columnId !== 303);
  const recentTasks = (data?.recentTasks?.length ? data.recentTasks.map((t: CardItem) => ({
    ...t,
    type: t.type || 'TASK',
    memberIds: t.memberIds ?? [],
  })) : fallbackTasks) as CardItem[];
  const starred = data?.starredBoards?.length ? data.starredBoards : [
    { id: 3, name: 'Sprint 1', projectName: '电商重构项目' },
    { id: 2, name: '里程碑 V1.0', projectName: '电商重构项目' },
  ];
  const visits = data?.recentVisits?.length ? data.recentVisits : MOCK_RECENT_VISITS;
  const activities = data?.activities?.length ? data.activities : MOCK_ACTIVITIES;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>工作台</h2>
        <Button icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>刷新</Button>
      </div>
      <Row gutter={[16, 16]}>
        <Col span={colSpan}><RecentTasks tasks={recentTasks} onCardClick={(id) => window.location.href = `/board/3?card=${id}`} /></Col>
        <Col span={colSpan}><StarredBoards boards={starred} /></Col>
        <Col span={colSpan}><RecentVisits visits={visits} /></Col>
        <Col span={colSpan}><ActivityFeed activities={activities} /></Col>
      </Row>
    </div>
  );
}
