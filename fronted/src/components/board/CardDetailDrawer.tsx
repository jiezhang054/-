import { useRef, useCallback } from 'react';
import { Drawer, Input, InputNumber, DatePicker, Checkbox, List, Button, Space, Tag, Divider, message } from 'antd';
import { LinkOutlined, ScissorOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { CardItem } from '../../types/board';
import { CardTypeTag } from '../common/CardTypeTag';
import { useBoardStore } from '../../stores/useUIStore';
import { boardsApi } from '../../api/boards';

interface Props {
  card: CardItem | null;
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export function CardDetailDrawer({ card, open, onClose, onRefresh }: Props) {
  const { updateCard } = useBoardStore();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const persistCard = useCallback((cardId: number, updates: Partial<CardItem>, current?: CardItem) => {
    updateCard(cardId, updates);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const payload = { ...updates, version: current?.version ?? updates.version };
      boardsApi.updateCard(cardId, payload).catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        if (msg?.includes('修改')) message.warning(msg);
      });
    }, 500);
  }, [updateCard]);

  const handleSplit = async () => {
    if (!card) return;
    try {
      await boardsApi.splitCard(card.id, [
        { title: `${card.title} - 任务1`, workload: Math.max(1, Math.floor(card.workload / 2)) },
        { title: `${card.title} - 任务2`, workload: Math.max(1, card.workload - Math.floor(card.workload / 2)) },
      ]);
      message.success('已拆分为任务卡片');
      onRefresh?.();
    } catch { message.error('拆分失败'); }
  };

  if (!card) return null;

  const checklist = card.checklist ?? [];
  const comments = card.comments ?? [];
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <Drawer title={card.title} width={480} open={open} onClose={onClose}>
      <Space style={{ marginBottom: 16 }}>
        <CardTypeTag type={card.type} />
        {card.isReference && <Tag icon={<LinkOutlined />}>引用自 {card.sourceBoardName}</Tag>}
        {(card.type === 'USER_STORY' || card.type === 'EPIC') && (
          <Button size="small" icon={<ScissorOutlined />} onClick={handleSplit}>拆分为任务</Button>
        )}
      </Space>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>标题</div>
        <Input
          value={card.title}
          onChange={(e) => persistCard(card.id, { title: e.target.value }, card)}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>描述</div>
        <Input.TextArea
          rows={4}
          value={card.description || ''}
          onChange={(e) => persistCard(card.id, { description: e.target.value }, card)}
          placeholder="添加描述..."
        />
      </div>

      <Space style={{ marginBottom: 16 }} size="large">
        <div>
          <div style={{ fontSize: 12, color: '#8f959e' }}>故事点</div>
          <InputNumber min={0} value={card.workload} onChange={(v) => persistCard(card.id, { workload: v || 0 }, card)} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#8f959e' }}>截止日期</div>
          <DatePicker
            value={card.dueDate ? dayjs(card.dueDate) : null}
            onChange={(d) => persistCard(card.id, { dueDate: d?.format('YYYY-MM-DD') }, card)}
          />
        </div>
      </Space>

      <Divider />

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>检查项 {doneCount}/{checklist.length}</div>
        <List
          size="small"
          dataSource={checklist}
          renderItem={(item) => (
            <List.Item>
              <Checkbox
                checked={item.done}
                onChange={(e) => {
                  const next = checklist.map((c) =>
                    c.id === item.id ? { ...c, done: e.target.checked } : c
                  );
                  persistCard(card.id, { checklist: next });
                }}
              >
                {item.text}
              </Checkbox>
            </List.Item>
          )}
        />
      </div>

      <Divider />

      <div>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>评论</div>
        <List
          size="small"
          dataSource={comments}
          renderItem={(c) => (
            <List.Item>
              <strong>{c.userName}</strong>：{c.content}
            </List.Item>
          )}
        />
      </div>
    </Drawer>
  );
}
