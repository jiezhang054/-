import { Modal, Form, Input, Select, Checkbox, message } from 'antd';
import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { globalApi, projectsApi } from '../../api/global';
import { myApi } from '../../api/my';
import { BOARD_TEMPLATES } from '../../constants/boardTemplates';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (boardId: number) => void;
  defaultProjectId?: number;
  allowNoProject?: boolean;
}

export function CreateBoardModal({ open, onClose, onCreated, defaultProjectId, allowNoProject }: Props) {
  const [form] = Form.useForm();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.listAll(),
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        projectId: defaultProjectId,
        template: 'NORMAL',
        addProjectMembers: false,
      });
    }
  }, [open, defaultProjectId, form]);

  const mutation = useMutation({
    mutationFn: async (values: {
      name: string;
      projectId?: number;
      template: string;
      addProjectMembers?: boolean;
    }) => {
      const payload = {
        name: values.name,
        template: values.template,
        type: values.template,
        addProjectMembers: values.addProjectMembers,
      };
      if (values.projectId) {
        return globalApi.createBoard({ ...payload, projectId: values.projectId });
      }
      return myApi.createBoard(payload);
    },
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

  const projectId = Form.useWatch('projectId', form);

  return (
    <Modal
      title="新建看板"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)} initialValues={{ template: 'NORMAL' }}>
        <Form.Item name="name" label="看板名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="projectId"
          label="所属项目"
          rules={allowNoProject ? [] : [{ required: true, message: '请选择项目' }]}
        >
          <Select
            allowClear={allowNoProject}
            placeholder={allowNoProject ? '无（个人空间）' : '选择项目'}
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
          />
        </Form.Item>
        <Form.Item name="template" label="看板模板">
          <Select options={[...BOARD_TEMPLATES]} />
        </Form.Item>
        {projectId && (
          <Form.Item name="addProjectMembers" valuePropName="checked">
            <Checkbox>将项目成员加入看板</Checkbox>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
