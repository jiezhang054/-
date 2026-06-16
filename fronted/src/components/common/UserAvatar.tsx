import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { User } from '../../types/board';
import { MOCK_USERS } from '../../mocks/users';

interface Props {
  userId: number;
  size?: number;
}

export function UserAvatar({ userId, size = 24 }: Props) {
  const user = MOCK_USERS.find((u) => u.id === userId);
  return (
    <Avatar size={size} icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }}>
      {user?.displayName?.[0]}
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
