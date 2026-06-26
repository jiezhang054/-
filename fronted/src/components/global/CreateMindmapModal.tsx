import { useState } from 'react';
import { Modal, Form, Input, Select, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { globalApi, projectsApi } from '../../api/global';
import { myApi } from '../../api/my';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (mindmapId: number) => void;
}

export function CreateMindmapModal({ open, onClose, onCreated }: Props) {
  const [form] = Form.useForm();
  const [importFile, setImportFile] = useState<File | null>(null);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.listAll(),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async (values: { name: string; projectId?: number }) => {
      if (importFile) {
        const fd = new FormData();
        fd.append('name', values.name);
        fd.append('file', importFile);
        if (values.projectId) fd.append('projectId', String(values.projectId));
        return myApi.importMindmap(fd);
      }
      return globalApi.createMindmap({ name: values.name, projectId: values.projectId });
    },
    onSuccess: (m) => {
      message.success('脑图创建成功');
      form.resetFields();
      setImportFile(null);
      onClose();
      onCreated?.(m.id);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || '创建失败');
    },
  });

  return (
    <Modal
      title="新建脑图"
      open={open}
      onCancel={() => { setImportFile(null); onClose(); }}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)}>
        <Form.Item name="name" label="脑图名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="projectId" label="所属项目">
          <Select allowClear options={projects.map((p) => ({ value: p.id, label: p.name }))} placeholder="无（个人脑图）" />
        </Form.Item>
        <Form.Item label="导入文件（可选）">
          <Upload
            beforeUpload={(file) => { setImportFile(file); return false; }}
            onRemove={() => setImportFile(null)}
            maxCount={1}
            accept=".json,.xmind"
            fileList={importFile ? [{ uid: '-1', name: importFile.name, status: 'done' }] : []}
          >
            <span style={{ color: '#1677ff', cursor: 'pointer' }}><UploadOutlined /> 选择 JSON 或 XMind 文件</span>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}
