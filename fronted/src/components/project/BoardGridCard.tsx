import { Tag, Progress, Dropdown, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { BoardSummary } from '../../types/board';
import type { MenuProps } from 'antd';
import { ExportOutlined, StarFilled, StarOutlined, InboxOutlined, LockOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const TYPE_LABELS: Record<string, string> = {
  ROADMAP: '路线图', MILESTONE: '里程碑', SPRINT: 'Sprint', NORMAL: '看板',
  DEFECT: '缺陷', RETROSPECTIVE: 'Sprint回顾',
};

interface Props {
  board: BoardSummary;
  onStar?: (boardId: number) => void;
  onUnstar?: (boardId: number) => void;
  onArchive?: (boardId: number) => void;
  menuItems?: MenuProps['items'];
}

export function BoardGridCard({ board, onStar, onUnstar, onArchive, menuItems }: Props) {
  const navigate = useNavigate();
  const daysLeft = board.endDate ? dayjs(board.endDate).diff(dayjs(), 'day') : null;
  const locked = board.chainLocked;

  const menu: MenuProps['items'] = menuItems ?? [
    { key: 'open', label: '打开', onClick: () => navigate(`/board/${board.id}`) },
    { key: 'newtab', label: '新标签页打开', icon: <ExportOutlined />, onClick: () => window.open(`/board/${board.id}`, '_blank') },
    board.starred
      ? { key: 'unstar', label: '取消星标', icon: <StarOutlined />, onClick: () => onUnstar?.(board.id) }
      : { key: 'star', label: '标星', icon: <StarFilled />, onClick: () => onStar?.(board.id) },
    { key: 'archive', label: '归档', icon: <InboxOutlined />, onClick: () => onArchive?.(board.id) },
  ];

  const card = (
    <div
      className="board-grid-card"
      onClick={() => navigate(`/board/${board.id}`)}
      style={locked ? { opacity: 0.85, borderLeft: '3px solid #faad14' } : undefined}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tag color="blue">{TYPE_LABELS[board.type] ?? board.type}</Tag>
        <span>
          {locked && <LockOutlined style={{ color: '#faad14', marginRight: 4 }} title="只读" />}
          {board.starred && <StarFilled style={{ color: '#faad14' }} />}
        </span>
      </div>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, marginTop: 8 }}>{board.name}</div>
      <div style={{ fontSize: 12, color: '#8f959e' }}>
        {board.cardCount} 卡片
        {board.completed && ' · 已填写'}
        {locked && ' · 只读'}
        {daysLeft !== null && ` · 剩余 ${Math.max(0, daysLeft)} 天`}
      </div>
      {locked && board.chainMessage && (
        <div style={{ fontSize: 11, color: '#d48806', marginTop: 4, lineHeight: 1.4 }}>{board.chainMessage}</div>
      )}
      {board.type === 'SPRINT' && board.endDate && (
        <Progress percent={board.completed ? 100 : 60} size="small" style={{ marginTop: 8 }} showInfo={false} />
      )}
    </div>
  );

  return (
    <Dropdown menu={{ items: menu }} trigger={['contextMenu']}>
      {locked && board.chainMessage ? (
        <Tooltip title={board.chainMessage}>{card}</Tooltip>
      ) : card}
    </Dropdown>
  );
}
