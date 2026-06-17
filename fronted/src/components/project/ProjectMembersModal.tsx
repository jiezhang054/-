import { Modal, Table, Input, Select, Button, Space, Tag, message, Popconfirm } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../../api/global';
import type { ProjectMember, ProjectRole } from '../../types/board';
import { useState } from 'react';

const ROLE_LABELS: Record<ProjectRole, string> = {
  OWNER: '所有者',
  MEMBER: '成员',
  READONLY: '只读',
};

interface Props {
  open: boolean;
  projectId: number;
  canManage: boolean;
  onClose: () => void;
}

export function ProjectMembersModal({ open, projectId, canManage, onClose }: Props) {
  const [identifier, setIdentifier] = useState('');
  const [role, setRole] = useState<ProjectRole>('MEMBER');
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => projectsApi.listMembers(projectId),
    enabled: open,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });

  const inviteMutation = useMutation({
    mutationFn: () => projectsApi.inviteMember(projectId, { identifier, role }),
    onSuccess: () => {
      message.success('成员已邀请');
      setIdentifier('');
      invalidate();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || '邀请失败');
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ memberId, newRole }: { memberId: number; newRole: string }) =>
      projectsApi.updateMemberRole(projectId, memberId, newRole),
    onSuccess: () => { message.success('角色已更新'); invalidate(); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || '更新失败');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: number) => projectsApi.removeMember(projectId, memberId),
    onSuccess: () => { message.success('成员已移除'); invalidate(); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || '移除失败');
    },
  });

  const columns = [
    { title: '昵称', dataIndex: 'displayName', key: 'displayName' },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    {
      title: '角色',
      key: 'role',
      render: (_: unknown, m: ProjectMember) =>
        canManage && m.role !== 'OWNER' ? (
          <Select
            size="small"
            value={m.role}
            style={{ width: 100 }}
            options={[
              { value: 'MEMBER', label: '成员' },
              { value: 'READONLY', label: '只读' },
              { value: 'OWNER', label: '所有者' },
            ]}
            onChange={(v) => roleMutation.mutate({ memberId: m.id, newRole: v })}
          />
        ) : (
          <Tag>{ROLE_LABELS[m.role]}</Tag>
        ),
    },
    ...(canManage ? [{
      title: '操作',
      key: 'action',
      render: (_: unknown, m: ProjectMember) =>
        m.role !== 'OWNER' ? (
          <Popconfirm title="确定移除该成员？" onConfirm={() => removeMutation.mutate(m.id)}>
            <Button type="link" size="small" danger>移除</Button>
          </Popconfirm>
        ) : null,
    }] : []),
  ];

  return (
    <Modal title="项目成员" open={open} onCancel={onClose} footer={null} width={640} destroyOnClose>
      {canManage && (
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="用户名或邮箱"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            value={role}
            onChange={setRole}
            style={{ width: 100 }}
            options={[
              { value: 'MEMBER', label: '成员' },
              { value: 'READONLY', label: '只读' },
            ]}
          />
          <Button type="primary" loading={inviteMutation.isPending} onClick={() => inviteMutation.mutate()}>
            邀请
          </Button>
        </Space>
      )}
      <Table rowKey="id" size="small" loading={isLoading} dataSource={members} columns={columns} pagination={false} />
    </Modal>
  );
}
