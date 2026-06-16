import { Space, Button, Tag, Typography } from 'antd';
import { StarFilled, StarOutlined, BarChartOutlined, CalendarOutlined, ProjectOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Board } from '../../types/board';
import { useUIStore } from '../../stores/useUIStore';

const { Title, Text } = Typography;

interface Props {
  board: Board;
}

export function BoardHeader({ board }: Props) {
  const navigate = useNavigate();
  const { setSprintPlanOpen, setMilestonePlanOpen } = useUIStore();

  return (
    <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Space>
        {board.starred ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
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
      </Space>
    </div>
  );
}
