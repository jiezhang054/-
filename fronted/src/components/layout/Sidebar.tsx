import { useState } from 'react';
import { Layout, Menu, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ProjectOutlined,
  AppstoreOutlined,
  PlusOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useUIStore } from '../../stores/useUIStore';
import { useTeamStore } from '../../stores/useTeamStore';
import { projectsApi } from '../../api/global';
import { CreateProjectModal } from '../global/CreateProjectModal';
import { TeamSwitcher } from '../team/TeamSwitcher';

const { Sider } = Layout;

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { currentTeamId, currentTeam } = useTeamStore();
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', currentTeamId],
    queryFn: () => projectsApi.list(currentTeamId),
  });

  const selectedKey = location.pathname.startsWith('/board')
    ? 'boards'
    : location.pathname.startsWith('/projects')
      ? `project-${location.pathname.split('/')[2]}`
      : location.pathname.startsWith('/mindmap')
        ? 'mindmaps'
        : location.pathname.startsWith('/my/boards')
          ? 'boards'
          : location.pathname.startsWith('/my/mindmaps')
            ? 'mindmaps'
            : location.pathname.startsWith('/teams')
              ? 'team-settings'
              : 'workspace';

  const items = [
    { key: 'workspace', icon: <DashboardOutlined />, label: t('workspace'), onClick: () => navigate('/workspace') },
    {
      key: 'my',
      icon: <AppstoreOutlined />,
      label: '我的',
      children: [
        { key: 'boards', label: t('myBoards'), onClick: () => navigate('/my/boards') },
        { key: 'mindmaps', label: t('myMindmaps'), onClick: () => navigate('/my/mindmaps') },
      ],
    },
    {
      key: 'projects-group',
      icon: <ProjectOutlined />,
      label: currentTeamId ? (currentTeam()?.name ?? '团队项目') : t('projects'),
      children: projects.length
        ? projects.map((p) => ({
            key: `project-${p.id}`,
            label: p.name,
            onClick: () => navigate(`/projects/${p.id}`),
          }))
        : [{ key: 'no-project', label: '暂无项目', disabled: true }],
    },
    {
      key: 'help',
      icon: <BookOutlined />,
      label: '学习资源',
      onClick: () => window.open('https://www.lg.team/scrum-agile-dev.html', '_blank'),
    },
  ];

  return (
    <>
      <Sider
        theme="light"
        width={220}
        collapsedWidth={64}
        collapsed={sidebarCollapsed}
        style={{ borderRight: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ padding: '16px', fontWeight: 700, fontSize: 18, color: '#1677ff', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {sidebarCollapsed ? 'S' : t('appName')}
        </div>
        <TeamSwitcher collapsed={sidebarCollapsed} />
        <Button type="text" icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={toggleSidebar} style={{ margin: '0 8px' }} />
        <Menu mode="inline" selectedKeys={[selectedKey]} defaultOpenKeys={['my', 'projects-group']} items={items} style={{ flex: 1, border: 'none' }} />
        <div style={{ padding: 12 }}>
          <Button type="dashed" icon={<PlusOutlined />} block onClick={() => setProjectModalOpen(true)}>
            {!sidebarCollapsed && (currentTeamId ? '新建团队项目' : t('newProject'))}
          </Button>
        </div>
      </Sider>
      <CreateProjectModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onCreated={(id) => navigate(`/projects/${id}`)}
      />
    </>
  );
}
