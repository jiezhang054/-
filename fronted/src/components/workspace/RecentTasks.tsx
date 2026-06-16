import { Card, List, Badge } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { CardItem } from '../../types/board';
import { CARD_TYPE_COLORS } from '../common/CardTypeTag';
import { UserAvatarGroup } from '../common/UserAvatar';

interface Props {
  tasks: CardItem[];
  onCardClick?: (id: number) => void;
}

export function RecentTasks({ tasks, onCardClick }: Props) {
  const { t } = useTranslation();

  return (
    <Card title={<><Badge count={tasks.length} offset={[10, 0]}>{t('recentTasks')}</Badge></>} size="small">
      <List
        dataSource={tasks}
        renderItem={(task) => {
          const type = task.type || 'TASK';
          const memberIds = task.memberIds ?? [];
          const overdue = task.dueDate && dayjs(task.dueDate).isBefore(dayjs(), 'day');
          return (
            <List.Item
              style={{ cursor: 'pointer', borderLeft: `4px solid ${overdue ? '#ff4d4f' : CARD_TYPE_COLORS[type]}`, paddingLeft: 8 }}
              onClick={() => onCardClick?.(task.id)}
            >
              <List.Item.Meta
                title={task.title}
                description={task.dueDate ? `截止 ${dayjs(task.dueDate).format('MM-DD')}` : undefined}
              />
              <UserAvatarGroup userIds={memberIds} />
            </List.Item>
          );
        }}
      />
    </Card>
  );
}
