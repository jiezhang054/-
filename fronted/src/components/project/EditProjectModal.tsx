import { Modal, Form, Input, message } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { projectsApi } from '../../api/global';
import type { Project } from '../../types/board';

interface Props {
  open: boolean;
  project: Project;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditProjectModal({ open, project, onClose, onUpdated }: Props) {
  const [form] = Form.useForm();

  const mutation = useMutation({
    mutationFn: (values: { name: string; description?: string }) =>
      projectsApi.update(project.id, values),
    onSuccess: () => {
      message.success('项目已更新');
      onUpdated();
      onClose();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || '更新失败');
    },
  });

  return (
    <Modal
      title="编辑项目"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ name: project.name, description: project.description }}
        onFinish={(v) => mutation.mutate(v)}
      >
        <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="项目描述">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
