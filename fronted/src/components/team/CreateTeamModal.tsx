import { Modal, Form, Input, message } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '../../api/teams';
import { useTeamStore } from '../../stores/useTeamStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateTeamModal({ open, onClose }: Props) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { loadContext, switchTeam } = useTeamStore();

  const mutation = useMutation({
    mutationFn: teamsApi.create,
    onSuccess: async (team) => {
      message.success('团队创建成功');
      await loadContext();
      await switchTeam(team.id);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      form.resetFields();
      onClose();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || '创建失败');
    },
  });

  return (
    <Modal
      title="新建团队"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)}>
        <Form.Item name="name" label="团队名称" rules={[{ required: true, message: '请输入团队名称' }]}>
          <Input placeholder="例如：综合课设小组" />
        </Form.Item>
        <Form.Item name="description" label="团队描述">
          <Input.TextArea rows={2} placeholder="可选" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
