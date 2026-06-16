import type { Board } from '../types/board';

const sprint1: Board = {
  id: 3,
  name: 'Sprint 1',
  type: 'SPRINT',
  projectId: 1,
  projectName: '电商重构项目',
  parentBoardId: 2,
  swimlanesEnabled: true,
  startDate: '2026-06-01',
  endDate: '2026-06-14',
  starred: true,
  columns: [
    { id: 301, name: '待办', sortOrder: 0 },
    { id: 302, name: '进行中', sortOrder: 1 },
    { id: 303, name: '已完成', sortOrder: 2 },
  ],
  swimlanes: [
    { id: 3011, name: '登录功能', sortOrder: 0 },
    { id: 3012, name: '支付模块', sortOrder: 1 },
    { id: 3013, name: '购物车', sortOrder: 2 },
  ],
  cards: [
    { id: 3001, title: '登录功能', type: 'USER_STORY', columnId: 301, swimlaneId: 3011, sortOrder: 0, workload: 3, dueDate: '2026-06-20', memberIds: [1, 3], labels: [{ id: 1, name: '前端', color: 'blue' }], checklist: [{ id: 1, text: '接口定义', done: true }, { id: 2, text: 'UI稿', done: false }], comments: [{ id: 1, userId: 1, userName: '张茗杰', content: '预计周三完成', createdAt: '2026-06-10' }], description: '作为用户，我希望通过邮箱登录系统' },
    { id: 3002, title: 'OAuth 集成', type: 'TASK', columnId: 301, swimlaneId: 3011, sortOrder: 1, workload: 2, memberIds: [2], labels: [], checklist: [], comments: [] },
    { id: 3003, title: '支付模块', type: 'USER_STORY', columnId: 302, swimlaneId: 3012, sortOrder: 0, workload: 5, dueDate: '2026-06-18', memberIds: [2, 4], labels: [{ id: 2, name: '后端', color: 'green' }], checklist: [], comments: [] },
    { id: 3004, title: '微信支付', type: 'TASK', columnId: 302, swimlaneId: 3012, sortOrder: 1, workload: 3, memberIds: [2], labels: [], checklist: [], comments: [] },
    { id: 3005, title: '购物车', type: 'USER_STORY', columnId: 301, swimlaneId: 3013, sortOrder: 0, workload: 5, memberIds: [3], labels: [], checklist: [], comments: [] },
    { id: 3006, title: '注册流程', type: 'USER_STORY', columnId: 303, swimlaneId: 3011, sortOrder: 0, workload: 2, memberIds: [1], labels: [], checklist: [{ id: 3, text: '完成', done: true }], comments: [] },
    { id: 3007, title: '邮箱验证', type: 'TASK', columnId: 303, swimlaneId: 3011, sortOrder: 1, workload: 1, memberIds: [1], labels: [], checklist: [], comments: [] },
    { id: 3008, title: '订单列表', type: 'USER_STORY', columnId: 303, swimlaneId: 3012, sortOrder: 2, workload: 3, memberIds: [4], labels: [], checklist: [], comments: [] },
  ],
};

const milestone: Board = {
  id: 2,
  name: '里程碑 V1.0',
  type: 'MILESTONE',
  projectId: 1,
  projectName: '电商重构项目',
  parentBoardId: 1,
  swimlanesEnabled: true,
  startDate: '2026-05-01',
  endDate: '2026-06-30',
  starred: true,
  columns: [
    { id: 201, name: '用户故事池', sortOrder: 0 },
    { id: 202, name: '用户故事-待梳理', sortOrder: 1 },
    { id: 203, name: '用户故事-梳理完成', sortOrder: 2 },
  ],
  swimlanes: [
    { id: 2011, name: '用户中心', sortOrder: 0 },
    { id: 2012, name: '交易系统', sortOrder: 1 },
  ],
  cards: [
    { id: 2001, title: '用户中心重构', type: 'EPIC', columnId: 201, swimlaneId: 2011, sortOrder: 0, workload: 13, memberIds: [1, 3], labels: [], checklist: [], comments: [] },
    { id: 2002, title: '登录功能', type: 'USER_STORY', columnId: 203, swimlaneId: 2011, sortOrder: 0, workload: 3, memberIds: [1], labels: [], checklist: [], comments: [], isReference: true, sourceCardId: 3001, sourceBoardName: 'Sprint 1' },
    { id: 2003, title: '注册功能', type: 'USER_STORY', columnId: 203, swimlaneId: 2011, sortOrder: 1, workload: 2, memberIds: [1], labels: [], checklist: [], comments: [] },
    { id: 2004, title: '交易系统升级', type: 'EPIC', columnId: 201, swimlaneId: 2012, sortOrder: 0, workload: 21, memberIds: [2, 4], labels: [], checklist: [], comments: [] },
    { id: 2005, title: '支付模块', type: 'USER_STORY', columnId: 203, swimlaneId: 2012, sortOrder: 0, workload: 5, memberIds: [2], labels: [], checklist: [], comments: [] },
    { id: 2006, title: '购物车功能', type: 'USER_STORY', columnId: 202, swimlaneId: 2012, sortOrder: 1, workload: 5, memberIds: [3], labels: [], checklist: [], comments: [] },
  ],
};

const roadmap: Board = {
  id: 1,
  name: '产品路线图',
  type: 'ROADMAP',
  projectId: 1,
  projectName: '电商重构项目',
  swimlanesEnabled: false,
  columns: [
    { id: 101, name: 'Q2 里程碑', sortOrder: 0 },
    { id: 102, name: 'Q3 规划', sortOrder: 1 },
  ],
  swimlanes: [],
  cards: [
    { id: 1001, title: '用户中心重构', type: 'EPIC', columnId: 101, sortOrder: 0, workload: 13, memberIds: [1], labels: [], checklist: [], comments: [], description: '重构用户注册、登录、个人中心' },
    { id: 1002, title: '交易系统升级', type: 'EPIC', columnId: 101, sortOrder: 1, workload: 21, memberIds: [2], labels: [], checklist: [], comments: [] },
    { id: 1003, title: '移动端适配', type: 'EPIC', columnId: 102, sortOrder: 0, workload: 8, memberIds: [3], labels: [], checklist: [], comments: [] },
    { id: 1004, title: '数据分析平台', type: 'EPIC', columnId: 102, sortOrder: 1, workload: 15, memberIds: [4], labels: [], checklist: [], comments: [] },
  ],
};

export const MOCK_BOARDS: Record<number, Board> = {
  1: roadmap,
  2: milestone,
  3: sprint1,
  4: {
    ...sprint1,
    id: 4,
    name: 'Sprint 2',
    type: 'SPRINT',
    startDate: '2026-06-15',
    endDate: '2026-06-28',
    cards: [],
    swimlanes: [],
    starred: false,
  },
};

export const DEMO_BOARD_SPRINT_1 = sprint1;
