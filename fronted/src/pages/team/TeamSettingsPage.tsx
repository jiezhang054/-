import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, Table, Button, Select, Modal, Form, Input, Tag, message, Typography } from 'antd';
import { ArrowLeftOutlined, UserAddOutlined } from '@ant-design/icons';
import { teamsApi, type TeamRole } from '../../api/teams';
import { useTeamStore } from '../../stores/useTeamStore';

const { Title, Text } = Typography;

const ROLE_LABEL: Record<TeamRole, string> = {
  ADMIN: '最高管理员',
  OWNER: '所有者',
  MEMBER: '成员',
};

const ROLE_COLOR: Record<TeamRole, string> = {
  ADMIN: 'red',
  OWNER: 'orange',
  MEMBER: 'blue',
};

export function TeamSettingsPage() {
  const { teamId } = useParams();
  const id = Number(teamId);
  const navigate = useNavigate();
  const { loadContext } = useTeamStore();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamsApi.getById(id),
  });

  const { data: members = [], refetch: refetchMembers } = useQuery({
    queryKey: ['team-members', id],
    queryFn: () => teamsApi.listMembers(id),
  });

  const canManage = team?.role === 'ADMIN' || team?.role === 'OWNER';
  const isAdmin = team?.role === 'ADMIN';

  const inviteMutation = useMutation({
    mutationFn: (values: { identifier: string; role: TeamRole }) =>
      teamsApi.inviteMember(id, values),
    onSuccess: () => {
      message.success('成员已加入');
      refetchMembers();
      setInviteOpen(false);
      form.resetFields();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || '邀请失败');
    },
  });

  const updateRole = async (memberId: number, role: TeamRole) => {
    try {
      await teamsApi.updateMemberRole(id, memberId, role);
      message.success('角色已更新');
      refetchMembers();
      loadContext();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || '更新失败');
    }
  };

  const removeMember = (memberId: number, name: string) => {
    Modal.confirm({
      title: `移除成员「${name}」？`,
      onOk: async () => {
        await teamsApi.removeMember(id, memberId);
        message.success('已移除');
        refetchMembers();
        loadContext();
      },
    });
  };

  if (isLoading || !team) return <div style={{ padding: 24 }}>加载中...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 8 }}>
        返回
      </Button>
      <Title level={3}>{team.name}</Title>
      <Text type="secondary">{team.description || '暂无描述'}</Text>
      <Tag color={ROLE_COLOR[team.role as TeamRole]} style={{ marginLeft: 8 }}>
        {ROLE_LABEL[team.role as TeamRole]}
      </Tag>

      <Card
        title="团队成员"
        style={{ marginTop: 24 }}
        extra={
          canManage && (
            <Button type="primary" icon={<UserAddOutlined />} onClick={() => setInviteOpen(true)}>
              邀请成员
            </Button>
          )
        }
      >
        <Table
          rowKey="id"
          dataSource={members}
          pagination={false}
          columns={[
            { title: '昵称', dataIndex: 'displayName' },
            { title: '用户名', dataIndex: 'username' },
            { title: '邮箱', dataIndex: 'email' },
            {
              title: '角色',
              dataIndex: 'role',
              render: (role: TeamRole, row) =>
                canManage && (isAdmin || role !== 'ADMIN') ? (
                  <Select
                    value={role}
                    style={{ width: 120 }}
                    disabled={!isAdmin && role === 'ADMIN'}
                    onChange={(v) => updateRole(row.id, v)}
                    options={[
                      ...(isAdmin ? [{ value: 'ADMIN', label: '最高管理员' }] : []),
                      { value: 'OWNER', label: '所有者' },
                      { value: 'MEMBER', label: '成员' },
                    ]}
                  />
                ) : (
                  <Tag color={ROLE_COLOR[role]}>{ROLE_LABEL[role]}</Tag>
                ),
            },
            {
              title: '操作',
              render: (_, row) =>
                canManage && row.id !== team.ownerId && (isAdmin || row.role !== 'ADMIN') ? (
                  <Button type="link" danger onClick={() => removeMember(row.id, row.displayName)}>
                    移除
                  </Button>
                ) : null,
            },
          ]}
        />
      </Card>

      <Modal title="邀请成员" open={inviteOpen} onCancel={() => setInviteOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={(v) => inviteMutation.mutate(v)} initialValues={{ role: 'MEMBER' }}>
          <Form.Item name="identifier" label="用户名或邮箱" rules={[{ required: true }]}>
            <Input placeholder="输入已注册用户的用户名或邮箱" />
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Select
              options={[
                ...(isAdmin ? [{ value: 'ADMIN', label: '最高管理员' }] : []),
                { value: 'OWNER', label: '所有者' },
                { value: 'MEMBER', label: '成员' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
