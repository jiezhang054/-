import { Card, List, Button, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ActivityItem } from '../../types/board';

interface Props {
  activities: ActivityItem[];
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  onItemClick?: (activity: ActivityItem) => void;
}

export function ActivityFeed({ activities, hasMore, loadingMore, onLoadMore, onItemClick }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleClick = (a: ActivityItem) => {
    if (onItemClick) onItemClick(a);
    else if (a.boardId) navigate(`/board/${a.boardId}${a.cardId ? `?card=${a.cardId}` : ''}`);
  };

  return (
    <Card title={t('activityFeed')} size="small">
      {activities.length === 0 ? (
        <Empty description="暂无动态" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <>
          <List
            dataSource={activities}
            renderItem={(a) => (
              <List.Item style={{ cursor: a.boardId ? 'pointer' : 'default' }} onClick={() => a.boardId && handleClick(a)}>
                <List.Item.Meta
                  title={<>{a.userName} {a.action}</>}
                  description={
                    <>
                      {a.cardTitle && <span>{a.cardTitle} · </span>}
                      {dayjs(a.createdAt).format('MM-DD HH:mm')}
                    </>
                  }
                />
              </List.Item>
            )}
          />
          {hasMore && (
            <Button type="link" block loading={loadingMore} onClick={onLoadMore}>查看更多</Button>
          )}
        </>
      )}
    </Card>
  );
}
