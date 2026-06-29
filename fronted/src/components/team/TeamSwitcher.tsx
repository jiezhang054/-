import { Select, Button, Space, Modal, message } from 'antd';
import { TeamOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTeamStore } from '../../stores/useTeamStore';
import { afterTeamSwitch } from '../../utils/teamSwitch';
import { CreateTeamModal } from './CreateTeamModal';

interface Props {
  collapsed?: boolean;
}

export function TeamSwitcher({ collapsed }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { teams, currentTeamId, switchTeam, currentTeam } = useTeamStore();
  const [createOpen, setCreateOpen] = useState(false);

  const handleSwitch = async (value: string) => {
    const teamId = value === 'personal' ? null : Number(value);
    try {
      await switchTeam(teamId);
      afterTeamSwitch(queryClient, navigate, location.pathname);
      message.success(teamId ? `已切换到「${teams.find((t) => t.id === teamId)?.name}」` : '已切换到个人空间');
    } catch {
      message.error('切换失败');
    }
  };

  const team = currentTeam();

  if (collapsed) {
    return (
      <div style={{ padding: '8px 12px', textAlign: 'center' }}>
        <TeamOutlined style={{ fontSize: 18, color: '#1677ff' }} />
      </div>
    );
  }

  return (
    <>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
        <Space direction="vertical" style={{ width: '100%' }} size={4}>
          <Select
            style={{ width: '100%' }}
            value={currentTeamId == null ? 'personal' : String(currentTeamId)}
            onChange={handleSwitch}
            options={[
              { value: 'personal', label: '👤 个人空间' },
              ...teams.map((t) => ({ value: String(t.id), label: `👥 ${t.name}` })),
            ]}
          />
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              新建团队
            </Button>
            {team && (
              <Button
                type="link"
                size="small"
                icon={<SettingOutlined />}
                onClick={() => navigate(`/teams/${team.id}/settings`)}
              >
                设置
              </Button>
            )}
          </Space>
        </Space>
      </div>
      <CreateTeamModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
