import type { ActivityItem, RecentVisit } from '../types/board';

export const MOCK_ACTIVITIES: ActivityItem[] = [
  { id: 1, userId: 1, userName: '张茗杰', action: '将卡片移至进行中', cardTitle: '支付模块', boardId: 3, createdAt: '2026-06-14T10:30:00' },
  { id: 2, userId: 2, userName: '殷浩然', action: '创建了卡片', cardTitle: '购物车功能', boardId: 2, createdAt: '2026-06-14T09:15:00' },
  { id: 3, userId: 3, userName: '钟礼豪', action: '更新了卡片成员', cardTitle: '登录功能', boardId: 3, createdAt: '2026-06-13T16:45:00' },
  { id: 4, userId: 4, userName: '臧传杨', action: '完成了卡片', cardTitle: '注册流程', boardId: 3, createdAt: '2026-06-13T14:20:00' },
];

export const MOCK_RECENT_VISITS: RecentVisit[] = [
  { id: 1, type: 'board', targetId: 3, name: 'Sprint 1', visitedAt: '2026-06-14T11:00:00' },
  { id: 2, type: 'board', targetId: 2, name: '里程碑 V1.0', visitedAt: '2026-06-14T09:30:00' },
  { id: 3, type: 'project', targetId: 1, name: '电商重构项目', visitedAt: '2026-06-13T17:00:00' },
  { id: 4, type: 'board', targetId: 1, name: '产品路线图', visitedAt: '2026-06-13T15:00:00' },
];
