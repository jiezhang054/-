import { Modal, Row, Col, Card, Button, Input, DatePicker, message, Tag, Space, Typography, Select } from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useState, useEffect, useMemo } from 'react';
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
  milestoneStart?: string;
  milestoneEnd?: string;
  loading?: boolean;
  onConfirm?: (sprints: SprintSlot[]) => void | Promise<void>;
}

function totalSp(stories: CardItem[]) {
  return stories.reduce((s, c) => s + (c.workload ?? 1), 0);
}

function splitDateRange(start: string, end: string, count: number): { startDate: string; endDate: string }[] {
  const s = dayjs(start);
  const e = dayjs(end);
  const totalDays = Math.max(count, e.diff(s, 'day') + 1);
  const per = Math.max(1, Math.floor(totalDays / count));
  return Array.from({ length: count }, (_, i) => {
    const slotStart = s.add(i * per, 'day');
    const slotEnd = i === count - 1 ? e : slotStart.add(per - 1, 'day');
    return {
      startDate: slotStart.format('YYYY-MM-DD'),
      endDate: slotEnd.format('YYYY-MM-DD'),
    };
  });
}

function buildDefaultSprints(milestoneStart?: string, milestoneEnd?: string): SprintSlot[] {
  const dates = milestoneStart && milestoneEnd
    ? splitDateRange(milestoneStart, milestoneEnd, 2)
    : [
        { startDate: dayjs().format('YYYY-MM-DD'), endDate: dayjs().add(13, 'day').format('YYYY-MM-DD') },
        { startDate: dayjs().add(14, 'day').format('YYYY-MM-DD'), endDate: dayjs().add(27, 'day').format('YYYY-MM-DD') },
      ];
  return dates.map((d, i) => ({
    id: String(i + 1),
    name: `Sprint ${i + 1}`,
    ...d,
    stories: [],
  }));
}

export function SprintPlanModal({
  open, onClose, availableStories, milestoneStart, milestoneEnd, loading, onConfirm,
}: Props) {
  const [pool, setPool] = useState<CardItem[]>([]);
  const [sprints, setSprints] = useState<SprintSlot[]>([]);
  const [activeSprintId, setActiveSprintId] = useState<string>('1');

  useEffect(() => {
    if (!open) return;
    setPool([...availableStories]);
    const defaults = buildDefaultSprints(milestoneStart, milestoneEnd);
    setSprints(defaults);
    setActiveSprintId(defaults[0]?.id ?? '1');
  }, [open, availableStories, milestoneStart, milestoneEnd]);

  const assignedCount = useMemo(
    () => sprints.reduce((n, s) => n + s.stories.length, 0),
    [sprints],
  );

  const assignToSprint = (story: CardItem, sprintId: string) => {
    setPool((p) => p.filter((s) => s.id !== story.id));
    setSprints((ss) =>
      ss.map((s) => {
        const without = s.stories.filter((st) => st.id !== story.id);
        return s.id === sprintId ? { ...s, stories: [...without, story] } : { ...s, stories: without };
      }),
    );
  };

  const removeFromSprint = (story: CardItem, sprintId: string) => {
    setSprints((ss) =>
      ss.map((s) => (s.id === sprintId ? { ...s, stories: s.stories.filter((st) => st.id !== story.id) } : s)),
    );
    setPool((p) => (p.some((s) => s.id === story.id) ? p : [...p, story]));
  };

  const addSprint = () => {
    const last = sprints[sprints.length - 1];
    const nextStart = last?.endDate ? dayjs(last.endDate).add(1, 'day') : dayjs();
    const nextEnd = nextStart.add(13, 'day');
    const id = String(Date.now());
    setSprints((ss) => [...ss, {
      id,
      name: `Sprint ${ss.length + 1}`,
      startDate: nextStart.format('YYYY-MM-DD'),
      endDate: nextEnd.format('YYYY-MM-DD'),
      stories: [],
    }]);
    setActiveSprintId(id);
  };

  const handleConfirm = async () => {
    const invalid = sprints.find((s) => !s.startDate || !s.endDate);
    if (invalid) {
      message.warning('请为每个 Sprint 设置起止日期');
      return;
    }
    if (assignedCount === 0) {
      message.warning('请至少分配一条用户故事');
      return;
    }
    await onConfirm?.(sprints);
  };

  return (
    <Modal
      title="规划 Sprint"
      open={open}
      onCancel={onClose}
      onOk={handleConfirm}
      confirmLoading={loading}
      width={1000}
      okText="确认规划"
      destroyOnHidden
    >
      {milestoneStart && milestoneEnd && (
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          里程碑周期：{milestoneStart} ~ {milestoneEnd}（请在范围内规划 Sprint）
        </Typography.Text>
      )}
      <Row gutter={16}>
        <Col span={9}>
          <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
            <Typography.Text strong>待规划用户故事</Typography.Text>
            <Tag>{pool.length} 条</Tag>
          </Space>
          <div style={{ maxHeight: 420, overflow: 'auto' }}>
            {pool.map((story) => (
              <Card key={story.id} size="small" style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ flex: 1 }}>{story.title}</span>
                  <WorkloadBadge workload={story.workload} />
                  <Select
                    size="small"
                    style={{ width: 110 }}
                    placeholder="分配到"
                    options={sprints.map((s) => ({ value: s.id, label: s.name }))}
                    onChange={(sprintId) => {
                      if (sprintId) assignToSprint(story, sprintId);
                    }}
                  />
                </div>
              </Card>
            ))}
            {pool.length === 0 && (
              <div style={{ color: '#8f959e', textAlign: 'center', padding: 24 }}>全部故事已分配</div>
            )}
          </div>
        </Col>
        <Col span={15}>
          <Space style={{ marginBottom: 8 }}>
            <Typography.Text strong>Sprint 列表</Typography.Text>
            <Tag color="blue">已分配 {assignedCount} 条</Tag>
          </Space>
          <div style={{ maxHeight: 420, overflow: 'auto' }}>
            {sprints.map((sprint) => (
              <Card
                key={sprint.id}
                size="small"
                style={{
                  marginBottom: 12,
                  borderColor: activeSprintId === sprint.id ? '#1677ff' : undefined,
                }}
                title={
                  <Space wrap>
                    <Input
                      size="small"
                      value={sprint.name}
                      style={{ width: 140 }}
                      onChange={(e) =>
                        setSprints((ss) => ss.map((s) => (s.id === sprint.id ? { ...s, name: e.target.value } : s)))
                      }
                    />
                    <Tag>{totalSp(sprint.stories)} SP</Tag>
                  </Space>
                }
                extra={
                  <Button
                    type={activeSprintId === sprint.id ? 'primary' : 'default'}
                    size="small"
                    onClick={() => setActiveSprintId(sprint.id)}
                  >
                    {activeSprintId === sprint.id ? '当前' : '选为分配目标'}
                  </Button>
                }
              >
                <DatePicker.RangePicker
                  size="small"
                  style={{ width: '100%', marginBottom: 8 }}
                  value={[dayjs(sprint.startDate), dayjs(sprint.endDate)]}
                  disabledDate={(current) => {
                    if (!milestoneStart || !milestoneEnd) return false;
                    return current.isBefore(dayjs(milestoneStart), 'day') || current.isAfter(dayjs(milestoneEnd), 'day');
                  }}
                  onChange={(dates) => {
                    if (dates?.[0] && dates?.[1]) {
                      setSprints((ss) => ss.map((s) => s.id === sprint.id ? {
                        ...s,
                        startDate: dates[0]!.format('YYYY-MM-DD'),
                        endDate: dates[1]!.format('YYYY-MM-DD'),
                      } : s));
                    }
                  }}
                />
                {sprint.stories.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 0', borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <span>{s.title} <WorkloadBadge workload={s.workload} /></span>
                    <Button
                      type="link"
                      size="small"
                      icon={<ArrowLeftOutlined />}
                      onClick={() => removeFromSprint(s, sprint.id)}
                    >
                      移回
                    </Button>
                  </div>
                ))}
                {sprint.stories.length === 0 && (
                  <div style={{ color: '#8f959e', textAlign: 'center', padding: 12 }}>
                    从左侧选择 Sprint 或使用下拉分配故事
                  </div>
                )}
              </Card>
            ))}
          </div>
          <Button type="dashed" icon={<PlusOutlined />} onClick={addSprint} style={{ marginTop: 4 }}>
            新建 Sprint
          </Button>
        </Col>
      </Row>
    </Modal>
  );
}
