import { Space, Button, Tag, Typography, Dropdown, message } from 'antd';
import {
  StarFilled, StarOutlined, BarChartOutlined, CalendarOutlined, ProjectOutlined,
  SettingOutlined, MoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { MenuProps } from 'antd';
import type { Board } from '../../types/board';
import { useUIStore } from '../../stores/useUIStore';
import { workspaceApi } from '../../api/boards';

const { Title, Text } = Typography;

interface Props {
  board: Board;
  onStarChange?: () => void;
  onArchived?: () => void;
  onSettings?: () => void;
  onRefresh?: () => void;
}

export function BoardHeader({ board, onStarChange, onArchived, onSettings, onRefresh }: Props) {
  const navigate = useNavigate();
  const { setSprintPlanOpen, setMilestonePlanOpen, setActivityDrawerOpen } = useUIStore();

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
    { key: 'settings', label: '看板设置', icon: <SettingOutlined />, onClick: onSettings },
    { key: 'activity', label: '看板动态', onClick: () => setActivityDrawerOpen(true) },
    { type: 'divider' },
    { key: 'archive', label: '归档看板', onClick: handleArchive },
  ];

  return (
    <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Space>
        <span style={{ cursor: 'pointer' }} onClick={toggleStar}>
          {board.starred ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
        </span>
        <Title level={4} style={{ margin: 0 }}>{board.name}</Title>
        <Text type="secondary">· {board.projectName}</Text>
        <Tag color="blue">{board.type}</Tag>
      </Space>
      <Space>
        <Button icon={<CalendarOutlined />} onClick={() => navigate(`/board/${board.id}/timeline`)}>时间线</Button>
        <Button icon={<BarChartOutlined />} onClick={() => navigate(`/board/${board.id}/charts`)}>图表板</Button>
        {board.type === 'MILESTONE' && (
          <Button type="primary" onClick={() => setSprintPlanOpen(true)}>Sprint 规划</Button>
        )}
        {board.type === 'ROADMAP' && (
          <Button type="primary" onClick={() => setMilestonePlanOpen(true)}>里程碑规划</Button>
        )}
        {board.type === 'SPRINT' && (
          <Button type="primary" icon={<ProjectOutlined />} onClick={() => navigate(`/board/${board.id}/stats`)}>看板统计</Button>
        )}
        <Dropdown menu={{ items: moreItems }}>
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      </Space>
    </div>
  );
}
