import { Modal, Form, Input, DatePicker, Checkbox, message } from 'antd';
import dayjs from 'dayjs';
import type { CardItem } from '../../types/board';

interface Props {
  open: boolean;
  onClose: () => void;
  epics: CardItem[];
  onConfirm?: (data: { name: string; startDate: string; endDate: string; epicIds: number[] }) => void;
}

export function MilestonePlanModal({ open, onClose, epics, onConfirm }: Props) {
  const [form] = Form.useForm();

  const handleOk = async () => {
    const values = await form.validateFields();
    const data = {
      name: values.name,
      startDate: values.dates[0].format('YYYY-MM-DD'),
      endDate: values.dates[1].format('YYYY-MM-DD'),
      epicIds: values.epicIds || [],
    };
    onConfirm?.(data);
    message.success('里程碑看板已创建');
    form.resetFields();
    onClose();
  };

  return (
    <Modal title="里程碑规划" open={open} onCancel={onClose} onOk={handleOk} okText="创建里程碑看板">
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="里程碑名称" rules={[{ required: true }]}>
          <Input placeholder="例如：里程碑 V1.0" />
        </Form.Item>
        <Form.Item name="dates" label="起止日期" rules={[{ required: true }]}>
          <DatePicker.RangePicker style={{ width: '100%' }} defaultValue={[dayjs('2026-05-01'), dayjs('2026-06-30')]} />
        </Form.Item>
        <Form.Item name="epicIds" label="关联史诗故事">
          <Checkbox.Group
            options={epics.map((e) => ({ label: `${e.title} (${e.workload}SP)`, value: e.id }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
