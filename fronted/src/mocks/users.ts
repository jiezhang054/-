import type { User } from '../types/board';

export const MOCK_USERS: User[] = [
  { id: 1, username: 'zhang', displayName: '张茗杰', email: 'zhang@example.com' },
  { id: 2, username: 'yin', displayName: '殷浩然', email: 'yin@example.com' },
  { id: 3, username: 'zhong', displayName: '钟礼豪', email: 'zhong@example.com' },
  { id: 4, username: 'zang', displayName: '臧传杨', email: 'zang@example.com' },
];

export const CURRENT_USER = MOCK_USERS[2];
