import { Tag } from 'antd';
import type { CardType } from '../../types/board';

const TYPE_CONFIG: Record<CardType, { label: string; color: string }> = {
  EPIC: { label: '史诗', color: 'purple' },
  USER_STORY: { label: '用户故事', color: 'blue' },
  TASK: { label: '任务', color: 'cyan' },
  BUG: { label: '缺陷', color: 'red' },
  OTHER: { label: '其他', color: 'default' },
};

export const CARD_TYPE_COLORS: Record<CardType, string> = {
  EPIC: '#722ED1',
  USER_STORY: '#1677FF',
  TASK: '#13C2C2',
  BUG: '#FF4D4F',
  OTHER: '#8F959E',
};

export function CardTypeTag({ type }: { type: CardType }) {
  const cfg = TYPE_CONFIG[type];
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
}
