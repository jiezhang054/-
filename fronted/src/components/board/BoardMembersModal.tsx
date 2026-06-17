import { Modal, Table, Input, Select, Button, Space, Tag, message } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardsApi } from '../../api/boards';
import type { BoardMember } from '../../types/board';
import { useState } from 'react';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: '管理员',
  MEMBER: '成员',
  READONLY: '只读',
  OWNER: '所有者',
};

interface Props {
  open: boolean;
  boardId: number;
  onClose: () => void;
}

export function BoardMembersModal({ open, boardId, onClose }: Props) {
  const [identifier, setIdentifier] = useState('');
  const [role, setRole] = useState('MEMBER');
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['board-members', boardId],
    queryFn: () => boardsApi.getMembers(boardId),
    enabled: open,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['board-members', boardId] });

  const inviteMutation = useMutation({
    mutationFn: () => boardsApi.inviteMember(boardId, identifier, role),
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

  const columns = [
    { title: '昵称', dataIndex: 'displayName', key: 'displayName' },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    {
      title: '角色',
      key: 'role',
      render: (_: unknown, m: BoardMember) => <Tag>{ROLE_LABELS[m.role] ?? m.role}</Tag>,
    },
  ];

  return (
    <Modal title="看板成员" open={open} onCancel={onClose} footer={null} width={560} destroyOnClose>
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
            { value: 'ADMIN', label: '管理员' },
          ]}
        />
        <Button type="primary" loading={inviteMutation.isPending} onClick={() => inviteMutation.mutate()}>
          邀请
        </Button>
      </Space>
      <Table rowKey="id" size="small" loading={isLoading} dataSource={members} columns={columns} pagination={false} />
    </Modal>
  );
}
