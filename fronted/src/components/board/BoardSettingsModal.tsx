import { Modal, Form, Input, Switch, DatePicker, Select, message } from 'antd';
import { useEffect } from 'react';
import dayjs from 'dayjs';
import { boardsApi } from '../../api/boards';
import type { Board } from '../../types/board';

interface Props {
  open: boolean;
  board: Board;
  onClose: () => void;
  onUpdated: (board: Board) => void;
}

export function BoardSettingsModal({ open, board, onClose, onUpdated }: Props) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: board.name,
        visibility: board.visibility ?? 'PROJECT',
        swimlanesEnabled: board.swimlanesEnabled,
        startDate: board.startDate ? dayjs(board.startDate) : null,
        endDate: board.endDate ? dayjs(board.endDate) : null,
      });
    }
  }, [open, board, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      const updated = await boardsApi.updateSettings(board.id, {
        name: values.name,
        visibility: values.visibility,
        swimlanesEnabled: values.swimlanesEnabled,
        startDate: values.startDate?.format('YYYY-MM-DD'),
        endDate: values.endDate?.format('YYYY-MM-DD'),
      });
      message.success('看板设置已保存');
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || '保存失败');
    }
  };

  return (
    <Modal title="看板设置" open={open} onOk={handleOk} onCancel={onClose} destroyOnClose>
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="看板名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="visibility" label="可见性">
          <Select options={[
            { value: 'PROJECT', label: '项目成员可见' },
            { value: 'PRIVATE', label: '仅看板成员' },
          ]} />
        </Form.Item>
        <Form.Item name="swimlanesEnabled" label="启用泳道" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="startDate" label="开始日期">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="endDate" label="结束日期">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
