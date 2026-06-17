import { Modal, Form, Input, Select, message } from 'antd';
import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { globalApi, projectsApi } from '../../api/global';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (boardId: number) => void;
  defaultProjectId?: number;
}

const BOARD_TEMPLATES = [
  { value: 'NORMAL', label: '空白看板' },
  { value: 'BACKLOG', label: '产品 Backlog' },
  { value: 'SPRINT', label: 'Sprint Backlog' },
  { value: 'DEFECT', label: '缺陷看板' },
  { value: 'TEST_CASE', label: '测试用例库' },
  { value: 'OKR', label: 'OKR 目标管理' },
  { value: 'EVENT', label: '活动策划类项目' },
  { value: 'STORY_MAP', label: '用户故事地图' },
];

export function CreateBoardModal({ open, onClose, onCreated, defaultProjectId }: Props) {
  const [form] = Form.useForm();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
    enabled: open,
  });

  useEffect(() => {
    if (open && defaultProjectId) {
      form.setFieldsValue({ projectId: defaultProjectId });
    }
  }, [open, defaultProjectId, form]);

  const mutation = useMutation({
    mutationFn: globalApi.createBoard,
    onSuccess: (board) => {
      message.success('看板创建成功');
      form.resetFields();
      onClose();
      onCreated?.(board.id);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || '创建失败');
    },
  });

  return (
    <Modal
      title="新建看板"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate({ ...v, type: v.template })} initialValues={{ template: 'NORMAL' }}>
        <Form.Item name="name" label="看板名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="projectId" label="所属项目" rules={[{ required: true }]}>
          <Select options={projects.map((p) => ({ value: p.id, label: p.name }))} placeholder="选择项目" />
        </Form.Item>
        <Form.Item name="template" label="看板模板">
          <Select options={BOARD_TEMPLATES} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
