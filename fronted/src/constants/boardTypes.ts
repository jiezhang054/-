import type { BoardType } from '../types/board';

export const BOARD_TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  ROADMAP: { label: '路线图', color: '#6366F1', bg: '#EEF2FF' },
  MILESTONE: { label: '里程碑', color: '#0EA5E9', bg: '#E0F2FE' },
  SPRINT: { label: 'Sprint', color: '#22C55E', bg: '#DCFCE7' },
  DEFECT: { label: '缺陷', color: '#EF4444', bg: '#FEE2E2' },
  RETROSPECTIVE: { label: 'Sprint回顾', color: '#F59E0B', bg: '#FEF3C7' },
  NORMAL: { label: '看板', color: '#64748B', bg: '#F1F5F9' },
};

export function getBoardTypeMeta(type: BoardType | string) {
  return BOARD_TYPE_META[type] ?? BOARD_TYPE_META.NORMAL;
}
