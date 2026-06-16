import { Card, List, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { ActivityItem } from '../../types/board';

interface Props {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities }: Props) {
  const { t } = useTranslation();

  return (
    <Card title={t('activityFeed')} size="small">
      <List
        dataSource={activities}
        renderItem={(a) => (
          <List.Item>
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
      <Button type="link" block>加载更多</Button>
    </Card>
  );
}
