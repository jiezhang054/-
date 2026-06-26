import { Modal, Form, Input, Select, message } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../../api/global';
import { useTeamStore } from '../../stores/useTeamStore';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (projectId: number) => void;
}

export function CreateProjectModal({ open, onClose, onCreated }: Props) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { currentTeamId, currentTeam } = useTeamStore();

  const mutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: (project) => {
      message.success('项目创建成功');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      form.resetFields();
      onClose();
      onCreated?.(project.id);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || '创建失败');
    },
  });

  return (
    <Modal
      title={currentTeamId ? `在「${currentTeam()?.name}」中新建项目` : '新建项目'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(v) => mutation.mutate({ ...v, teamId: currentTeamId })}
        initialValues={{ template: 'SCRUM' }}
      >
        <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="项目描述">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="template" label="项目模板">
          <Select options={[
            { value: 'SCRUM', label: 'Scrum 敏捷开发' },
            { value: 'LIGHT', label: '轻量协作' },
          ]} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
