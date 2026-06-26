import { Card, List, Button, Empty, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ActivityItem } from '../../types/board';
import { formatActivitySentence } from '../../utils/activity';

const { Text } = Typography;

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
    <Card className="workspace-panel workspace-panel--activity" title={t('activityFeed')} size="small">
      {activities.length === 0 ? (
        <Empty description="暂无动态" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <>
          <div className="workspace-panel__scroll">
            <List
              dataSource={activities}
              split={false}
              renderItem={(a) => (
                <List.Item
                  style={{ cursor: a.boardId ? 'pointer' : 'default', padding: '8px 0' }}
                  onClick={() => a.boardId && handleClick(a)}
                >
                  <div>
                    <div>
                      <Text strong>{a.userName}</Text>
                      {' '}
                      <Text>{formatActivitySentence(a.action, a.cardTitle)}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(a.createdAt).format('MM-DD HH:mm')}
                    </Text>
                  </div>
                </List.Item>
              )}
            />
          </div>
          {hasMore && (
            <div className="workspace-panel__load-more">
              <Button type="link" block loading={loadingMore} onClick={onLoadMore}>查看更多</Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
