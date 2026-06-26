import { Drawer, List, Button, Typography, Badge, Space } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { globalApi } from '../../api/global';
import dayjs from 'dayjs';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NotificationPanel({ open, onClose }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: globalApi.notifications,
    enabled: open,
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: globalApi.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAll = useMutation({
    mutationFn: globalApi.markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleClick = (item: { id: number; read: boolean; linkType?: string; linkId?: number }) => {
    if (!item.read) markRead.mutate(item.id);
    if (item.linkType === 'board' && item.linkId) {
      onClose();
      navigate(`/board/${item.linkId}`);
    }
  };

  return (
    <Drawer
      title={<Space>通知 {data?.unreadCount ? <Badge count={data.unreadCount} /> : null}</Space>}
      open={open}
      onClose={onClose}
      width={400}
      extra={
        <Button type="link" onClick={() => markAll.mutate()} disabled={!data?.unreadCount}>
          全部已读
        </Button>
      }
    >
      <List
        dataSource={data?.items ?? []}
        renderItem={(item) => (
            <List.Item
            style={{ cursor: 'pointer', opacity: item.read ? 0.65 : 1 }}
            onClick={() => handleClick(item)}
          >
            <List.Item.Meta
              title={
                <Typography.Text strong={!item.read}>
                  {item.type === 'TEAM_ACTIVITY' ? '团队看板' : item.title}
                </Typography.Text>
              }
              description={
                <>
                  <div>{item.content}</div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(item.createdAt).format('MM-DD HH:mm')}
                  </Typography.Text>
                </>
              }
            />
          </List.Item>
        )}
      />
    </Drawer>
  );
}

export function useNotificationCount() {
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: globalApi.notifications,
    refetchInterval: 30000,
  });
  return data?.unreadCount ?? 0;
}
