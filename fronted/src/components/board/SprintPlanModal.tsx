import { Modal, Row, Col, Card, Button, Input, DatePicker, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useState } from 'react';
import dayjs from 'dayjs';
import type { CardItem } from '../../types/board';
import { WorkloadBadge } from '../common/WorkloadBadge';

interface SprintSlot {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  stories: CardItem[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  availableStories: CardItem[];
  onConfirm?: (sprints: SprintSlot[]) => void;
}

export function SprintPlanModal({ open, onClose, availableStories, onConfirm }: Props) {
  const [pool, setPool] = useState<CardItem[]>(availableStories);
  const [sprints, setSprints] = useState<SprintSlot[]>([
    { id: '1', name: 'Sprint 1', startDate: '2026-06-01', endDate: '2026-06-14', stories: [] },
    { id: '2', name: 'Sprint 2', startDate: '2026-06-15', endDate: '2026-06-28', stories: [] },
  ]);

  const moveToSprint = (story: CardItem, sprintId: string) => {
    setPool((p) => p.filter((s) => s.id !== story.id));
    setSprints((ss) =>
      ss.map((s) => (s.id === sprintId ? { ...s, stories: [...s.stories, story] } : s))
    );
  };

  const handleConfirm = () => {
    onConfirm?.(sprints);
    message.success('Sprint 规划已保存');
    onClose();
  };

  return (
    <Modal title="规划 Sprint" open={open} onCancel={onClose} onOk={handleConfirm} width={960} okText="确认规划">
      <Row gutter={16}>
        <Col span={10}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>待规划用户故事（梳理完成）</div>
          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            {pool.map((story) => (
              <Card key={story.id} size="small" style={{ marginBottom: 8, cursor: 'pointer' }}
                onClick={() => moveToSprint(story, sprints[0].id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{story.title}</span>
                  <WorkloadBadge workload={story.workload} />
                </div>
              </Card>
            ))}
            {pool.length === 0 && <div style={{ color: '#8f959e' }}>暂无待规划故事</div>}
          </div>
        </Col>
        <Col span={14}>
          {sprints.map((sprint) => (
            <div key={sprint.id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Input value={sprint.name} style={{ width: 200 }} onChange={(e) =>
                  setSprints((ss) => ss.map((s) => s.id === sprint.id ? { ...s, name: e.target.value } : s))
                } />
                <DatePicker.RangePicker
                  value={[dayjs(sprint.startDate), dayjs(sprint.endDate)]}
                  onChange={(dates) => {
                    if (dates?.[0] && dates?.[1]) {
                      setSprints((ss) => ss.map((s) => s.id === sprint.id ? {
                        ...s, startDate: dates[0]!.format('YYYY-MM-DD'), endDate: dates[1]!.format('YYYY-MM-DD')
                      } : s));
                    }
                  }}
                />
              </div>
              <Card size="small" style={{ minHeight: 100, background: '#fafafa' }}>
                {sprint.stories.map((s) => (
                  <div key={s.id} style={{ padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                    {s.title} <WorkloadBadge workload={s.workload} />
                  </div>
                ))}
                {sprint.stories.length === 0 && <div style={{ color: '#8f959e', textAlign: 'center', padding: 20 }}>从左侧点击添加故事</div>}
              </Card>
            </div>
          ))}
          <Button type="dashed" icon={<PlusOutlined />} onClick={() =>
            setSprints((ss) => [...ss, { id: String(Date.now()), name: `Sprint ${ss.length + 1}`, startDate: '', endDate: '', stories: [] }])
          }>新建 Sprint</Button>
        </Col>
      </Row>
    </Modal>
  );
}
