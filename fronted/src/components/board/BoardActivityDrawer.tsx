import { Drawer, List, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { boardsApi } from '../../api/boards';
import { formatActivitySentence } from '../../utils/activity';

const { Text } = Typography;

interface Props {
  open: boolean;
  boardId: number;
  onClose: () => void;
  onLocateCard?: (cardId: number) => void;
}

export function BoardActivityDrawer({ open, boardId, onClose, onLocateCard }: Props) {
  const navigate = useNavigate();
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
        locale={{ emptyText: '暂无动态' }}
        renderItem={(item) => (
          <List.Item
            style={{ cursor: item.cardId ? 'pointer' : 'default' }}
            onClick={() => {
              if (item.cardId && onLocateCard) {
                onLocateCard(item.cardId);
              } else if (item.cardId) {
                navigate(`/board/${boardId}?card=${item.cardId}`);
                onClose();
              }
            }}
          >
            <div>
              <div>
                <Text strong>{item.userName}</Text>
                {' '}
                <Text>{formatActivitySentence(item.action, item.cardTitle)}</Text>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
              </Text>
            </div>
          </List.Item>
        )}
      />
    </Drawer>
  );
}
