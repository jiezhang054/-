import { useState } from 'react';
import { Button, DatePicker, Popover, Space, Typography, message } from 'antd';
import { CalendarOutlined, EditOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { boardsApi } from '../../api/boards';
import type { Board } from '../../types/board';

const { Text } = Typography;

interface Props {
  board: Board;
  canWrite?: boolean;
  onUpdated: (board: Board) => void;
}

function durationDays(start: Dayjs, end: Dayjs) {
  return Math.max(1, end.diff(start, 'day') + 1);
}

export function MilestoneDurationEditor({ board, canWrite = true, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(() =>
    board.startDate && board.endDate
      ? [dayjs(board.startDate), dayjs(board.endDate)]
      : null,
  );

  const days =
    range ? durationDays(range[0], range[1]) : null;

  const handleSave = async () => {
    if (!range) {
      message.warning('请选择起止日期');
      return;
    }
    setSaving(true);
    try {
      const updated = await boardsApi.updateSettings(board.id, {
        startDate: range[0].format('YYYY-MM-DD'),
        endDate: range[1].format('YYYY-MM-DD'),
      });
      message.success('里程碑时间已更新，子 Sprint 时间已同步');
      onUpdated(updated);
      setOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const label = board.startDate && board.endDate
    ? `${board.startDate} ~ ${board.endDate}（${durationDays(dayjs(board.startDate), dayjs(board.endDate))} 天）`
    : '未设置时间';

  if (!canWrite) {
    return (
      <Space size={4}>
        <CalendarOutlined />
        <Text type="secondary">{label}</Text>
      </Space>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v && board.startDate && board.endDate) {
          setRange([dayjs(board.startDate), dayjs(board.endDate)]);
        }
      }}
      trigger="click"
      title="里程碑时间"
      content={
        <Space direction="vertical" style={{ width: 280 }}>
          <DatePicker.RangePicker
            style={{ width: '100%' }}
            value={range}
            onChange={(dates) => {
              if (dates?.[0] && dates?.[1]) setRange([dates[0], dates[1]]);
            }}
          />
          {days != null && <Text type="secondary">持续时间：{days} 天</Text>}
          <Text type="secondary" style={{ fontSize: 12 }}>
            修改后将按比例同步下属 Sprint / 缺陷 / 回顾看板的起止时间
          </Text>
          <Button type="primary" block loading={saving} onClick={handleSave}>
            保存
          </Button>
        </Space>
      }
    >
      <Button type="link" icon={<EditOutlined />} style={{ padding: 0, height: 'auto' }}>
        <CalendarOutlined style={{ marginRight: 4 }} />
        {label}
      </Button>
    </Popover>
  );
}
