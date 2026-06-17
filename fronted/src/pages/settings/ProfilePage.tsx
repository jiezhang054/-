import { useState } from 'react';
import { Card, Form, Input, Button, Typography, Tabs, Select, message } from 'antd';
import { useAuthStore } from '../../stores/useAuthStore';
import { authApi } from '../../api/auth';
import i18n from '../../i18n';
import { useUIStore } from '../../stores/useUIStore';

const { Title } = Typography;

const BACKGROUNDS = [
  { value: 'default', label: '默认浅色' },
  { value: 'blue', label: '蓝色渐变' },
  { value: 'green', label: '绿色清新' },
  { value: 'dark', label: '深色模式' },
];

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { setLanguage } = useUIStore();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const onProfileSave = async (values: { displayName: string; email?: string }) => {
    setProfileLoading(true);
    try {
      const updated = await authApi.updateProfile(values);
      updateUser(updated);
      message.success('资料已更新');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || '更新失败');
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordChange = async (values: { oldPassword: string; newPassword: string; confirm: string }) => {
    if (values.newPassword !== values.confirm) {
      message.error('两次输入的新密码不一致');
      return;
    }
    setPasswordLoading(true);
    try {
      await authApi.changePassword({ oldPassword: values.oldPassword, newPassword: values.newPassword });
      message.success('密码已修改');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || '密码修改失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  const onSettingsChange = async (background: string, locale: string) => {
    try {
      const updated = await authApi.updateSettings({ background, locale });
      updateUser(updated);
      i18n.changeLanguage(locale);
      setLanguage(locale as 'zh-CN' | 'en-US');
      document.body.dataset.bg = background;
      message.success('设置已保存');
    } catch {
      message.error('设置保存失败');
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <Title level={3}>个人中心</Title>
      <Tabs
        items={[
          {
            key: 'profile',
            label: '个人资料',
            children: (
              <Card>
                <Form layout="vertical" initialValues={{ displayName: user.displayName, email: user.email }} onFinish={onProfileSave}>
                  <Form.Item name="displayName" label="显示名称" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="email" label="邮箱">
                    <Input />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={profileLoading}>保存</Button>
                </Form>
              </Card>
            ),
          },
          {
            key: 'password',
            label: '修改密码',
            children: (
              <Card>
                <Form layout="vertical" onFinish={onPasswordChange}>
                  <Form.Item name="oldPassword" label="原密码" rules={[{ required: true }]}>
                    <Input.Password />
                  </Form.Item>
                  <Form.Item name="newPassword" label="新密码" rules={[{ required: true, min: 6 }]}>
                    <Input.Password />
                  </Form.Item>
                  <Form.Item name="confirm" label="确认新密码" rules={[{ required: true }]}>
                    <Input.Password />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={passwordLoading}>修改密码</Button>
                </Form>
              </Card>
            ),
          },
          {
            key: 'settings',
            label: '个性化',
            children: (
              <Card>
                <Form layout="vertical" initialValues={{ background: user.background || 'default', locale: user.locale || 'zh-CN' }}>
                  <Form.Item name="background" label="界面背景">
                    <Select options={BACKGROUNDS} onChange={(v) => onSettingsChange(v, user.locale || 'zh-CN')} />
                  </Form.Item>
                  <Form.Item name="locale" label="界面语言">
                    <Select
                      options={[
                        { value: 'zh-CN', label: '中文' },
                        { value: 'en-US', label: 'English' },
                      ]}
                      onChange={(v) => onSettingsChange(user.background || 'default', v)}
                    />
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
