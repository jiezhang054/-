import { Layout, Menu, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ProjectOutlined,
  AppstoreOutlined,
  NodeIndexOutlined,
  PlusOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../../stores/useUIStore';
import { MOCK_PROJECTS } from '../../mocks/projects';

const { Sider } = Layout;

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const selectedKey = location.pathname.startsWith('/board')
    ? 'boards'
    : location.pathname.startsWith('/projects')
      ? `project-${location.pathname.split('/')[2]}`
      : location.pathname.startsWith('/mindmap')
        ? 'mindmaps'
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
      label: t('projects'),
      children: MOCK_PROJECTS.map((p) => ({
        key: `project-${p.id}`,
        label: p.name,
        onClick: () => navigate(`/projects/${p.id}`),
      })),
    },
  ];

  return (
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
      <Button type="text" icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={toggleSidebar} style={{ margin: '0 8px' }} />
      <Menu mode="inline" selectedKeys={[selectedKey]} items={items} style={{ flex: 1, border: 'none' }} />
      <div style={{ padding: 12 }}>
        <Button type="dashed" icon={<PlusOutlined />} block onClick={() => navigate('/projects/new')}>
          {!sidebarCollapsed && t('newProject')}
        </Button>
      </div>
    </Sider>
  );
}
