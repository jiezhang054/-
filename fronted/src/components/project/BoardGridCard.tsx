import { Progress, Dropdown, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { BoardSummary } from '../../types/board';
import type { MenuProps } from 'antd';
import { ExportOutlined, StarFilled, StarOutlined, InboxOutlined, LockOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { BoardTypeTag } from '../common/BoardTypeTag';
import { getBoardTypeMeta } from '../../constants/boardTypes';

interface Props {
  board: BoardSummary;
  onStar?: (boardId: number) => void;
  onUnstar?: (boardId: number) => void;
  onArchive?: (boardId: number) => void;
}

export function BoardGridCard({ board, onStar, onUnstar, onArchive }: Props) {
  const navigate = useNavigate();
  const daysLeft = board.endDate ? dayjs(board.endDate).diff(dayjs(), 'day') : null;
  const locked = board.chainLocked;
  const meta = getBoardTypeMeta(board.type);

  const menu: MenuProps['items'] = [
    { key: 'open', label: '打开', onClick: () => navigate(`/board/${board.id}`) },
    { key: 'newtab', label: '新标签页打开', icon: <ExportOutlined />, onClick: () => window.open(`/board/${board.id}`, '_blank') },
    board.starred
      ? { key: 'unstar', label: '取消星标', icon: <StarOutlined />, onClick: () => onUnstar?.(board.id) }
      : { key: 'star', label: '标星', icon: <StarFilled />, onClick: () => onStar?.(board.id) },
    { key: 'archive', label: '归档', icon: <InboxOutlined />, onClick: () => onArchive?.(board.id) },
  ];

  const card = (
    <div
      className={`board-grid-card${locked ? ' board-grid-card--locked' : ''}`}
      style={{ ['--card-accent' as string]: meta.color }}
      onClick={() => navigate(`/board/${board.id}`)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <BoardTypeTag type={board.type} size="small" />
        <span>
          {locked && <LockOutlined style={{ color: 'var(--color-warning)', marginRight: 4 }} title="只读" />}
          {board.starred && <StarFilled style={{ color: '#faad14' }} />}
        </span>
      </div>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, marginTop: 8 }}>{board.name}</div>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
        {board.cardCount} 卡片
        {board.completed && ' · 已填写'}
        {locked && ' · 只读'}
        {daysLeft !== null && ` · 剩余 ${Math.max(0, daysLeft)} 天`}
      </div>
      {locked && board.chainMessage && (
        <div style={{ fontSize: 11, color: 'var(--color-warning-text)', marginTop: 4, lineHeight: 1.4 }}>{board.chainMessage}</div>
      )}
      {board.type === 'SPRINT' && board.endDate && (
        <Progress percent={board.completed ? 100 : 40} size="small" style={{ marginTop: 8 }} showInfo={false} strokeColor={meta.color} />
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
