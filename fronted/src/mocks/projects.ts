import type { Project } from '../types/board';

export const MOCK_PROJECTS: Project[] = [
  {
    id: 1,
    name: '电商重构项目',
    description: '敏捷重构电商平台核心模块',
    boards: [
      { id: 1, name: '产品路线图', type: 'ROADMAP', cardCount: 4 },
      { id: 2, name: '里程碑 V1.0', type: 'MILESTONE', cardCount: 6, starred: true },
      { id: 3, name: 'Sprint 1', type: 'SPRINT', cardCount: 8, starred: true, startDate: '2026-06-01', endDate: '2026-06-14' },
      { id: 4, name: 'Sprint 2', type: 'SPRINT', cardCount: 0, startDate: '2026-06-15', endDate: '2026-06-28' },
    ],
  },
];
