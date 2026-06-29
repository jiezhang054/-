import { Space, Button, Tag, Typography, Dropdown, message, Tooltip } from 'antd';
import {
  StarFilled, StarOutlined, BarChartOutlined, CalendarOutlined, ProjectOutlined,
  SettingOutlined, MoreOutlined, LockOutlined, BugOutlined, FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { MenuProps } from 'antd';
import type { Board } from '../../types/board';
import { useUIStore } from '../../stores/useUIStore';
import { workspaceApi } from '../../api/boards';
import { MilestoneDurationEditor } from './MilestoneDurationEditor';

const { Title, Text } = Typography;

interface Props {
  board: Board;
  canWrite?: boolean;
  onStarChange?: () => void;
  onArchived?: () => void;
  onSettings?: () => void;
  onRefresh?: () => void;
  onBoardUpdated?: (board: Board) => void;
}

export function BoardHeader({ board, canWrite = true, onStarChange, onArchived, onSettings, onRefresh, onBoardUpdated }: Props) {
  const navigate = useNavigate();
  const { setSprintPlanOpen, setMilestonePlanOpen, setActivityDrawerOpen } = useUIStore();

  const chainLocked = board.chainLocked ?? board.permissions?.chainLocked;
  const canPlanMilestone = board.canPlanMilestone ?? board.completed;
  const canPlanSprint = board.canPlanSprint ?? (board.completed && !chainLocked);

  const toggleStar = async () => {
    try {
      if (board.starred) {
        await workspaceApi.unstarBoard(board.id);
        message.success('已取消星标');
      } else {
        await workspaceApi.starBoard(board.id);
        message.success('已加星标');
      }
      onStarChange?.();
      onRefresh?.();
    } catch {
      message.error('操作失败');
    }
  };

  const handleArchive = async () => {
    try {
      await workspaceApi.archiveBoard(board.id);
      message.success('看板已归档');
      onArchived?.();
    } catch {
      message.error('归档失败');
    }
  };

  const moreItems: MenuProps['items'] = [
    { key: 'settings', label: '看板设置', icon: <SettingOutlined />, onClick: onSettings, disabled: !canWrite },
    { key: 'activity', label: '看板动态', onClick: () => setActivityDrawerOpen(true) },
    { key: 'trash', label: '回收站', onClick: () => navigate(`/board/${board.id}/trash`) },
    { type: 'divider' },
    { key: 'archive', label: '归档看板', onClick: handleArchive, disabled: !canWrite },
  ];

  const typeLabels: Record<string, string> = {
    ROADMAP: '路线图', MILESTONE: '里程碑', SPRINT: 'Sprint', DEFECT: '缺陷', RETROSPECTIVE: 'Sprint回顾', NORMAL: '看板',
  };

  return (
    <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Space>
        <span style={{ cursor: 'pointer' }} onClick={toggleStar}>
          {board.starred ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
        </span>
        <Title level={4} style={{ margin: 0 }}>{board.name}</Title>
        <Text type="secondary">· {board.projectName}</Text>
        <Tag color="blue">{typeLabels[board.type] ?? board.type}</Tag>
        {chainLocked && (
          <Tag icon={<LockOutlined />} color="warning">只读</Tag>
        )}
        {board.completed && !chainLocked && (
          <Tag color="success">已填写</Tag>
        )}
        {board.type === 'MILESTONE' && (
          <MilestoneDurationEditor
            board={board}
            canWrite={canWrite}
            onUpdated={(updated) => onBoardUpdated?.(updated)}
          />
        )}
      </Space>
      <Space>
        <Button icon={<CalendarOutlined />} onClick={() => navigate(`/board/${board.id}/timeline`)}>时间线</Button>
        <Button icon={<BarChartOutlined />} onClick={() => navigate(`/board/${board.id}/charts`)}>图表板</Button>
        {board.type === 'MILESTONE' && (
          <Tooltip title={canPlanSprint ? undefined : '请先在里程碑看板中添加至少一张卡片'}>
            <Button type="primary" disabled={!canWrite || !canPlanSprint} onClick={() => setSprintPlanOpen(true)}>
              Sprint 规划
            </Button>
          </Tooltip>
        )}
        {board.type === 'ROADMAP' && (
          <Tooltip title={canPlanMilestone ? undefined : '请先在产品路线图中添加至少一张卡片'}>
            <Button type="primary" disabled={!canWrite || !canPlanMilestone} onClick={() => setMilestonePlanOpen(true)}>
              里程碑规划
            </Button>
          </Tooltip>
        )}
        {board.type === 'SPRINT' && (
          <>
            <Button type="primary" icon={<ProjectOutlined />} onClick={() => navigate(`/board/${board.id}/stats`)}>看板统计</Button>
            {board.linkedDefectBoardId && (
              <Button icon={<BugOutlined />} onClick={() => navigate(`/board/${board.linkedDefectBoardId}`)}>缺陷看板</Button>
            )}
            {board.linkedRetroBoardId && (
              <Button icon={<FileTextOutlined />} onClick={() => navigate(`/board/${board.linkedRetroBoardId}`)}>Sprint回顾</Button>
            )}
          </>
        )}
        {(board.type === 'DEFECT' || board.type === 'RETROSPECTIVE') && board.linkedSprintId && (
          <Button onClick={() => navigate(`/board/${board.linkedSprintId}`)}>
            返回 {board.linkedSprintName ?? 'Sprint'}
          </Button>
        )}
        <Dropdown menu={{ items: moreItems }}>
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      </Space>
    </div>
  );
}
