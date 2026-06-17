import { Drawer, List, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { boardsApi } from '../../api/boards';

const { Text } = Typography;

interface Props {
  open: boolean;
  boardId: number;
  onClose: () => void;
}

export function BoardActivityDrawer({ open, boardId, onClose }: Props) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['board-activities', boardId],
    queryFn: () => boardsApi.getActivities(boardId),
    enabled: open,
  });

  return (
    <Drawer title="看板动态" open={open} onClose={onClose} width={400}>
      <List
        loading={isLoading}
        dataSource={activities}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={<><Text strong>{item.userName}</Text> {item.action}</>}
              description={
                <>
                  {item.cardTitle && <div>卡片：{item.cardTitle}</div>}
                  <Text type="secondary">{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}</Text>
                </>
              }
            />
          </List.Item>
        )}
      />
    </Drawer>
  );
}
