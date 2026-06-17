import { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { authApi } from '../../api/auth';

const { Title } = Typography;

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authApi.login(values);
      setAuth(res.token, res.user);
      message.success('登录成功');
      navigate('/workspace');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <Title level={3} style={{ textAlign: 'center', color: '#1677ff' }}>领歌 Scrum</Title>
        <Form layout="vertical" onFinish={onFinish} initialValues={{ username: 'zhong', password: '123456' }}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>登录</Button>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          还没有账号？<Link to="/register">注册</Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, color: '#8f959e', fontSize: 12 }}>
          演示账号：zhong / 123456
        </div>
      </Card>
    </div>
  );
}
