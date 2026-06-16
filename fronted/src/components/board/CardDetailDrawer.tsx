import { Drawer, Input, InputNumber, DatePicker, Checkbox, List, Button, Space, Tag, Divider } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { CardItem } from '../../types/board';
import { CardTypeTag } from '../common/CardTypeTag';
import { useBoardStore } from '../../stores/useUIStore';

interface Props {
  card: CardItem | null;
  open: boolean;
  onClose: () => void;
}

export function CardDetailDrawer({ card, open, onClose }: Props) {
  const { updateCard } = useBoardStore();

  if (!card) return null;

  const checklist = card.checklist ?? [];
  const comments = card.comments ?? [];
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <Drawer title={card.title} width={480} open={open} onClose={onClose}>
      <Space style={{ marginBottom: 16 }}>
        <CardTypeTag type={card.type} />
        {card.isReference && <Tag icon={<LinkOutlined />}>引用自 {card.sourceBoardName}</Tag>}
      </Space>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>描述</div>
        <Input.TextArea
          rows={4}
          value={card.description || ''}
          onChange={(e) => updateCard(card.id, { description: e.target.value })}
          placeholder="添加描述..."
        />
      </div>

      <Space style={{ marginBottom: 16 }} size="large">
        <div>
          <div style={{ fontSize: 12, color: '#8f959e' }}>故事点</div>
          <InputNumber min={0} value={card.workload} onChange={(v) => updateCard(card.id, { workload: v || 0 })} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#8f959e' }}>截止日期</div>
          <DatePicker
            value={card.dueDate ? dayjs(card.dueDate) : null}
            onChange={(d) => updateCard(card.id, { dueDate: d?.format('YYYY-MM-DD') })}
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
                  updateCard(card.id, { checklist: next });
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
        <Space.Compact style={{ width: '100%', marginTop: 8 }}>
          <Input placeholder="写评论..." />
          <Button type="primary">发送</Button>
        </Space.Compact>
      </div>
    </Drawer>
  );
}
