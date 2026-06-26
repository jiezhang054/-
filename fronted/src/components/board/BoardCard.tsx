import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tag, Checkbox } from 'antd';
import { CalendarOutlined, LinkOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { CardItem } from '../../types/board';
import { CARD_TYPE_COLORS } from '../common/CardTypeTag';
import { WorkloadBadge } from '../common/WorkloadBadge';
import { UserAvatarGroup } from '../common/UserAvatar';
import { useUIStore } from '../../stores/useUIStore';
import clsx from 'clsx';

interface Props {
  card: CardItem;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function BoardCard({ card, onClick, onContextMenu }: Props) {
  const { batchMode, selectedCardIds, toggleCardSelection } = useUIStore();
  const selected = selectedCardIds.includes(card.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `card-${card.id}`,
    data: { type: 'card', card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderLeftColor: CARD_TYPE_COLORS[card.type] ?? CARD_TYPE_COLORS.OTHER,
  };

  const overdue = card.dueDate && dayjs(card.dueDate).isBefore(dayjs(), 'day');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx('board-card', isDragging && 'board-card--dragging', overdue && 'board-card--overdue', selected && 'board-card--selected')}
      {...(batchMode ? {} : { ...attributes, ...listeners })}
      onClick={batchMode ? () => toggleCardSelection(card.id) : onClick}
      onContextMenu={onContextMenu}
    >
      {batchMode && (
        <Checkbox checked={selected} style={{ marginBottom: 4 }} onChange={() => toggleCardSelection(card.id)} />
      )}
      <div className="board-card-title">{card.title}</div>
      {card.labels && card.labels.length > 0 && (
        <div style={{ marginBottom: 4 }}>
          {card.labels.map((l) => (
            <Tag key={l.id} color={l.color} style={{ fontSize: 11 }}>{l.name}</Tag>
          ))}
        </div>
      )}
      {card.isReference && (
        <div style={{ fontSize: 11, color: '#8f959e', marginBottom: 4 }}>
          <LinkOutlined /> 引用自 {card.sourceBoardName}
        </div>
      )}
      <div className="board-card-footer">
        <WorkloadBadge workload={card.workload} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(card.memberIds?.length ?? 0) > 0 && <UserAvatarGroup userIds={card.memberIds} />}
          {card.dueDate && (
            <span style={{ fontSize: 11, color: overdue ? '#ff4d4f' : '#8f959e' }}>
              <CalendarOutlined /> {dayjs(card.dueDate).format('MM-DD')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
