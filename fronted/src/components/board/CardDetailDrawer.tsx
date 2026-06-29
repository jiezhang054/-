import { useRef, useCallback, useState } from 'react';
import {
  Drawer, Input, InputNumber, DatePicker, Checkbox, List, Button, Space, Tag, Divider, message, Select,
} from 'antd';
import { LinkOutlined, ScissorOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { CardItem, Label } from '../../types/board';
import { CardTypeTag } from '../common/CardTypeTag';
import { useBoardStore } from '../../stores/useUIStore';
import { boardsApi } from '../../api/boards';
import { normalizeCard } from '../../utils/board';

interface Props {
  card: CardItem | null;
  open: boolean;
  canWrite?: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

const LABEL_PRESETS = [
  { name: '高优先级', color: '#ff4d4f' },
  { name: '中优先级', color: '#faad14' },
  { name: '低优先级', color: '#52c41a' },
  { name: '前端', color: '#1677ff' },
  { name: '后端', color: '#722ed1' },
];

export function CardDetailDrawer({ card, open, canWrite = true, onClose, onRefresh }: Props) {
  const { updateCard, members } = useBoardStore();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingRef = useRef<Partial<CardItem>>({});
  const savingRef = useRef(false);
  const [commentText, setCommentText] = useState('');

  const flushSave = useCallback(async (cardId: number) => {
    if (savingRef.current) return;
    const pending = pendingRef.current;
    const keys = Object.keys(pending);
    if (keys.length === 0) return;

    pendingRef.current = {};
    savingRef.current = true;
    try {
      const latest = useBoardStore.getState().getCard(cardId);
      const saved = normalizeCard(
        await boardsApi.updateCard(cardId, { ...pending, version: latest?.version }),
      );
      updateCard(cardId, saved);
    } catch (err: unknown) {
      pendingRef.current = { ...pending, ...pendingRef.current };
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (msg?.includes('修改')) {
        message.warning(msg);
        onRefresh?.();
      }
    } finally {
      savingRef.current = false;
      if (Object.keys(pendingRef.current).length > 0) {
        saveTimer.current = setTimeout(() => { void flushSave(cardId); }, 300);
      }
    }
  }, [updateCard, onRefresh]);

  const persistCard = useCallback((
    cardId: number,
    updates: Partial<CardItem>,
    options?: { immediate?: boolean },
  ) => {
    updateCard(cardId, updates);
    pendingRef.current = { ...pendingRef.current, ...updates };
    clearTimeout(saveTimer.current);
    const delay = options?.immediate || Object.prototype.hasOwnProperty.call(updates, 'memberIds') ? 0 : 500;
    saveTimer.current = setTimeout(() => { void flushSave(cardId); }, delay);
  }, [updateCard, flushSave]);

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

  const handleAddComment = async () => {
    if (!card || !commentText.trim()) return;
    try {
      const cm = await boardsApi.addComment(card.id, commentText.trim());
      persistCard(card.id, { comments: [...(card.comments ?? []), cm] });
      setCommentText('');
      message.success('评论已发送');
      onRefresh?.();
    } catch { message.error('发送失败'); }
  };

  const handleLabelsChange = (names: string[]) => {
    if (!card) return;
    const labels: Label[] = names.map((name, i) => {
      const preset = LABEL_PRESETS.find((p) => p.name === name);
      const existing = card.labels?.find((l) => l.name === name);
      return {
        id: existing?.id ?? i,
        name,
        color: preset?.color ?? existing?.color ?? '#1677ff',
      };
    });
    persistCard(card.id, { labels });
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
        {canWrite && (card.type === 'USER_STORY' || card.type === 'EPIC') && (
          <Button size="small" icon={<ScissorOutlined />} onClick={handleSplit}>拆分为任务</Button>
        )}
      </Space>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>标题</div>
        <Input
          value={card.title}
          disabled={!canWrite}
          onChange={(e) => persistCard(card.id, { title: e.target.value })}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>描述</div>
        <Input.TextArea
          rows={4}
          disabled={!canWrite}
          value={card.description || ''}
          onChange={(e) => persistCard(card.id, { description: e.target.value })}
          placeholder="添加描述..."
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>成员</div>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          disabled={!canWrite}
          placeholder="指派成员"
          value={card.memberIds ?? []}
          onChange={(ids) => persistCard(card.id, { memberIds: ids }, { immediate: true })}
          options={members.map((m) => ({ value: m.id, label: m.displayName }))}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>标签</div>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          disabled={!canWrite}
          placeholder="选择标签"
          value={(card.labels ?? []).map((l) => l.name)}
          onChange={handleLabelsChange}
          options={LABEL_PRESETS.map((p) => ({ value: p.name, label: p.name }))}
          tagRender={({ label, value, closable, onClose }) => {
            const preset = LABEL_PRESETS.find((p) => p.name === value);
            return (
              <Tag color={preset?.color ?? '#1677ff'} closable={closable} onClose={onClose} style={{ marginRight: 4 }}>
                {label}
              </Tag>
            );
          }}
        />
      </div>

      <Space style={{ marginBottom: 16 }} size="large">
        <div>
          <div style={{ fontSize: 12, color: '#8f959e' }}>故事点</div>
          <InputNumber min={0} disabled={!canWrite} value={card.workload} onChange={(v) => persistCard(card.id, { workload: v || 0 })} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#8f959e' }}>截止日期</div>
          <DatePicker
            disabled={!canWrite}
            value={card.dueDate ? dayjs(card.dueDate) : null}
            onChange={(d) => persistCard(card.id, { dueDate: d?.format('YYYY-MM-DD') })}
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
                disabled={!canWrite}
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
              <div style={{ fontSize: 11, color: '#999' }}>{c.createdAt?.slice(0, 16)}</div>
            </List.Item>
          )}
        />
        {canWrite && (
          <Space.Compact style={{ width: '100%', marginTop: 8 }}>
            <Input
              placeholder="写下评论..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onPressEnter={handleAddComment}
            />
            <Button type="primary" icon={<SendOutlined />} onClick={handleAddComment}>发送</Button>
          </Space.Compact>
        )}
      </div>
    </Drawer>
  );
}
