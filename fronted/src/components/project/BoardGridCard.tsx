import { Tag, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { BoardSummary } from '../../types/board';
import dayjs from 'dayjs';

const TYPE_LABELS = { ROADMAP: '路线图', MILESTONE: '里程碑', SPRINT: 'Sprint', NORMAL: '看板' };

interface Props {
  board: BoardSummary;
}

export function BoardGridCard({ board }: Props) {
  const navigate = useNavigate();
  const daysLeft = board.endDate ? dayjs(board.endDate).diff(dayjs(), 'day') : null;

  return (
    <div className="board-grid-card" onClick={() => navigate(`/board/${board.id}`)}>
      <Tag color="blue" style={{ marginBottom: 8 }}>{TYPE_LABELS[board.type]}</Tag>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{board.name}</div>
      <div style={{ fontSize: 12, color: '#8f959e' }}>
        {board.cardCount} 卡片
        {daysLeft !== null && ` · 剩余 ${Math.max(0, daysLeft)} 天`}
      </div>
      {board.type === 'SPRINT' && board.endDate && (
        <Progress percent={60} size="small" style={{ marginTop: 8 }} showInfo={false} />
      )}
    </div>
  );
}
