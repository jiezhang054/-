import { Card, Form, Input, Button, Typography, message } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { authApi } from '../../api/auth';

const { Title } = Typography;

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const onFinish = async (values: { username: string; password: string; displayName: string; email?: string }) => {
    try {
      const res = await authApi.register(values);
      setAuth(res.token, res.user);
      message.success('注册成功');
      navigate('/workspace');
    } catch {
      message.error('注册失败，请检查后端服务');
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <Title level={3} style={{ textAlign: 'center' }}>注册账号</Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="displayName" label="显示名称" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input size="large" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, min: 6 }]}>
            <Input.Password size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large">注册</Button>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          已有账号？<Link to="/login">登录</Link>
        </div>
      </Card>
    </div>
  );
}
