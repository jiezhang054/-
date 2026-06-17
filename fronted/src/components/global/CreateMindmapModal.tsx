import { Modal, Form, Input, Select, message } from 'antd';
import { useQuery, useMutation } from '@tanstack/react-query';
import { globalApi, projectsApi } from '../../api/global';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (mindmapId: number) => void;
}

export function CreateMindmapModal({ open, onClose, onCreated }: Props) {
  const [form] = Form.useForm();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: globalApi.createMindmap,
    onSuccess: (m) => {
      message.success('脑图创建成功');
      form.resetFields();
      onClose();
      onCreated?.(m.id);
    },
    onError: () => message.error('创建失败'),
  });

  return (
    <Modal title="新建脑图" open={open} onCancel={onClose} onOk={() => form.submit()} confirmLoading={mutation.isPending} destroyOnClose>
      <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)}>
        <Form.Item name="name" label="脑图名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="projectId" label="所属项目">
          <Select allowClear options={projects.map((p) => ({ value: p.id, label: p.name }))} placeholder="可选" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
