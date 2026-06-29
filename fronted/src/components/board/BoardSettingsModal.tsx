import { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Switch, Select, message, Typography } from 'antd';
import dayjs from 'dayjs';
import { boardsApi } from '../../api/boards';
import type { Board } from '../../types/board';

const { Text } = Typography;

interface Props {
  open: boolean;
  board: Board;
  onClose: () => void;
  onUpdated: (board: Board) => void;
}

export function BoardSettingsModal({ open, board, onClose, onUpdated }: Props) {
  const [form] = Form.useForm();
  const isMilestone = board.type === 'MILESTONE';

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: board.name,
        visibility: board.visibility ?? 'PROJECT',
        swimlanesEnabled: board.swimlanesEnabled,
        dates: board.startDate && board.endDate
          ? [dayjs(board.startDate), dayjs(board.endDate)]
          : undefined,
        startDate: board.startDate ? dayjs(board.startDate) : null,
        endDate: board.endDate ? dayjs(board.endDate) : null,
      });
    }
  }, [open, board, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const startDate = isMilestone && values.dates?.[0]
      ? values.dates[0].format('YYYY-MM-DD')
      : values.startDate?.format('YYYY-MM-DD');
    const endDate = isMilestone && values.dates?.[1]
      ? values.dates[1].format('YYYY-MM-DD')
      : values.endDate?.format('YYYY-MM-DD');
    try {
      const updated = await boardsApi.updateSettings(board.id, {
        name: values.name,
        visibility: values.visibility,
        swimlanesEnabled: values.swimlanesEnabled,
        startDate,
        endDate,
      });
      message.success(isMilestone ? '里程碑设置已保存，子 Sprint 时间已同步' : '看板设置已保存');
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || '保存失败');
    }
  };

  return (
    <Modal title="看板设置" open={open} onOk={handleOk} onCancel={onClose} destroyOnHidden>
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
        {isMilestone ? (
          <Form.Item name="dates" label="里程碑起止日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
        ) : (
          <>
            <Form.Item name="startDate" label="开始日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="endDate" label="结束日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}
        {isMilestone && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            修改持续时间后，将按比例同步下属 Sprint 看板的时间范围
          </Text>
        )}
      </Form>
    </Modal>
  );
}
