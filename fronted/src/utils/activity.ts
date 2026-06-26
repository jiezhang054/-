import type { ActivityItem } from '../types/board';

/** 操作文案是否已包含卡片标题（避免重复展示） */
export function actionIncludesCardTitle(action: string, cardTitle?: string) {
  if (!cardTitle) return false;
  return action.includes(`「${cardTitle}」`) || action.includes(cardTitle);
}

/** 拼接完整动态描述，如：移动了卡片「支付接口联调」 */
export function formatActivitySentence(action: string, cardTitle?: string) {
  if (!cardTitle || actionIncludesCardTitle(action, cardTitle)) return action;
  return `${action}「${cardTitle}」`;
}
