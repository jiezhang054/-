import { Layout } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const { Content } = Layout;

export function AppLayout() {
  const location = useLocation();
  const isFullWidth = location.pathname.startsWith('/board/') && !location.pathname.endsWith('/stats');

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout>
        <TopBar />
        <Content className={isFullWidth ? 'page-content page-content--full' : 'page-content'}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
