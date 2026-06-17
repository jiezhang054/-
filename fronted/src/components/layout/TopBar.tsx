import { useState } from 'react';
import { Layout, Button, Dropdown, Badge, Space, Avatar } from 'antd';
import {
  PlusOutlined,
  HomeOutlined,
  BellOutlined,
  UserOutlined,
  SearchOutlined,
  LogoutOutlined,
  GlobalOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';
import { authApi } from '../../api/auth';
import { CreateBoardModal } from '../global/CreateBoardModal';
import { CreateMindmapModal } from '../global/CreateMindmapModal';
import { BoardNavModal } from '../global/BoardNavModal';
import { NotificationPanel, useNotificationCount } from '../global/NotificationPanel';
import type { MenuProps } from 'antd';

const { Header } = Layout;

export function TopBar() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const { setLanguage } = useUIStore();
  const unreadCount = useNotificationCount();

  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [mindmapModalOpen, setMindmapModalOpen] = useState(false);
  const [navModalOpen, setNavModalOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);

  const createItems: MenuProps['items'] = [
    { key: 'board', label: '新建看板', onClick: () => setBoardModalOpen(true) },
    { key: 'mindmap', label: '新建脑图', onClick: () => setMindmapModalOpen(true) },
  ];

  const userItems: MenuProps['items'] = [
    { key: 'profile', label: '个人中心', icon: <UserOutlined />, onClick: () => navigate('/settings/profile') },
    { key: 'help', label: '帮助', icon: <QuestionCircleOutlined />, onClick: () => window.open('https://www.lg.team/', '_blank') },
    {
      key: 'lang-zh',
      label: '中文',
      icon: <GlobalOutlined />,
      onClick: async () => {
        i18n.changeLanguage('zh-CN');
        setLanguage('zh-CN');
        try { await authApi.updateSettings({ locale: 'zh-CN' }); } catch { /* ignore */ }
      },
    },
    {
      key: 'lang-en',
      label: 'English',
      icon: <GlobalOutlined />,
      onClick: async () => {
        i18n.changeLanguage('en-US');
        setLanguage('en-US');
        try { await authApi.updateSettings({ locale: 'en-US' }); } catch { /* ignore */ }
      },
    },
    { type: 'divider' },
    { key: 'logout', label: t('logout'), icon: <LogoutOutlined />, onClick: () => { logout(); navigate('/login'); } },
  ];

  return (
    <>
      <Header style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, lineHeight: '56px' }}>
        <Space>
          <Dropdown menu={{ items: createItems }}>
            <Button type="primary" icon={<PlusOutlined />}>创建</Button>
          </Dropdown>
          <Button icon={<SearchOutlined />} onClick={() => setNavModalOpen(true)}>看板导航</Button>
          <Button type="text" icon={<HomeOutlined />} title="回到首页" onClick={() => navigate('/workspace')} />
        </Space>
        <Space size={16}>
          <Badge count={unreadCount} size="small">
            <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} onClick={() => setNotifyOpen(true)} />
          </Badge>
          <Dropdown menu={{ items: userItems }}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar src={user?.avatar} icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
              <span>{user?.displayName || '访客'}</span>
            </Space>
          </Dropdown>
        </Space>
      </Header>

      <CreateBoardModal open={boardModalOpen} onClose={() => setBoardModalOpen(false)} onCreated={(id) => navigate(`/board/${id}`)} />
      <CreateMindmapModal open={mindmapModalOpen} onClose={() => setMindmapModalOpen(false)} onCreated={(id) => navigate(`/mindmap/${id}`)} />
      <BoardNavModal open={navModalOpen} onClose={() => setNavModalOpen(false)} />
      <NotificationPanel open={notifyOpen} onClose={() => setNotifyOpen(false)} />
    </>
  );
}
