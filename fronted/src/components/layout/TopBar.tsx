import { Layout, Button, Dropdown, Badge, Space, Avatar, Input, Modal, List } from 'antd';
import {
  PlusOutlined,
  HomeOutlined,
  BellOutlined,
  UserOutlined,
  SearchOutlined,
  LogoutOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';
import { MOCK_BOARDS } from '../../mocks/boards';
import { MOCK_ACTIVITIES } from '../../mocks/activities';
import type { MenuProps } from 'antd';

const { Header } = Layout;

export function TopBar() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const { setLanguage } = useUIStore();

  const createItems: MenuProps['items'] = [
    { key: 'board', label: '新建看板', onClick: () => navigate('/projects/1') },
    { key: 'mindmap', label: '新建脑图', onClick: () => navigate('/my/mindmaps') },
  ];

  const userItems: MenuProps['items'] = [
    {
      key: 'lang-zh',
      label: '中文',
      icon: <GlobalOutlined />,
      onClick: () => { i18n.changeLanguage('zh-CN'); setLanguage('zh-CN'); },
    },
    {
      key: 'lang-en',
      label: 'English',
      icon: <GlobalOutlined />,
      onClick: () => { i18n.changeLanguage('en-US'); setLanguage('en-US'); },
    },
    { type: 'divider' },
    { key: 'logout', label: t('logout'), icon: <LogoutOutlined />, onClick: () => { logout(); navigate('/login'); } },
  ];

  const showBoardNav = () => {
    Modal.info({
      title: '看板导航',
      width: 480,
      content: (
        <List
          dataSource={Object.values(MOCK_BOARDS)}
          renderItem={(b) => (
            <List.Item style={{ cursor: 'pointer' }} onClick={() => { Modal.destroyAll(); navigate(`/board/${b.id}`); }}>
              {b.name} · {b.projectName}
            </List.Item>
          )}
        />
      ),
      icon: null,
    });
  };

  return (
    <Header style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, lineHeight: '56px' }}>
      <Space>
        <Dropdown menu={{ items: createItems }}>
          <Button type="primary" icon={<PlusOutlined />}>创建</Button>
        </Dropdown>
        <Input prefix={<SearchOutlined />} placeholder="搜索看板" style={{ width: 200 }} onClick={showBoardNav} readOnly />
        <Button type="text" icon={<HomeOutlined />} onClick={() => navigate('/workspace')} />
      </Space>
      <Space size={16}>
        <Badge count={3}>
          <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} onClick={() => Modal.info({ title: '通知', content: MOCK_ACTIVITIES.map((a) => <div key={a.id}>{a.userName} {a.action}</div>) })} />
        </Badge>
        <Dropdown menu={{ items: userItems }}>
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
            <span>{user?.displayName || '访客'}</span>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
}
