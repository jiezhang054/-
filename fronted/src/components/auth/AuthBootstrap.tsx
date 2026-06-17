import { useEffect } from 'react';
import { Spin } from 'antd';
import { useAuthStore } from '../../stores/useAuthStore';
import { authApi } from '../../api/auth';
import i18n from '../../i18n';

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { token, setAuth, logout, authReady, setAuthReady, updateUser } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      if (!token) {
        setAuthReady(true);
        return;
      }
      try {
        const user = await authApi.me();
        if (!cancelled) {
          updateUser(user);
          if (user.locale) {
            i18n.changeLanguage(user.locale);
          }
          setAuthReady(true);
        }
      } catch {
        try {
          const res = await authApi.refresh();
          if (!cancelled) {
            setAuth(res.token, res.user);
            if (res.user.locale) i18n.changeLanguage(res.user.locale);
            setAuthReady(true);
          }
        } catch {
          if (!cancelled) {
            logout();
            setAuthReady(true);
          }
        }
      }
    };
    bootstrap();
    return () => { cancelled = true; };
  }, [token, setAuth, logout, setAuthReady, updateUser]);

  if (!authReady) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return <>{children}</>;
}
