import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useBoardStore } from '../../stores/useUIStore';

interface Props {
  userId: number;
  size?: number;
}

export function UserAvatar({ userId, size = 24 }: Props) {
  const { members } = useBoardStore();
  const user = members.find((u) => u.id === userId);
  return (
    <Avatar size={size} icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }}>
      {user?.displayName?.[0] ?? String(userId)[0]}
    </Avatar>
  );
}

export function UserAvatarGroup({ userIds = [], max = 3 }: { userIds?: number[]; max?: number }) {
  if (!userIds.length) return null;
  return (
    <Avatar.Group max={{ count: max, style: { backgroundColor: '#1677ff' } }}>
      {userIds.map((id) => (
        <UserAvatar key={id} userId={id} />
      ))}
    </Avatar.Group>
  );
}
