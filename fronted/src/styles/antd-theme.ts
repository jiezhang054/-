import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1677FF',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    borderRadius: 8,
    fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f5f7fa',
  },
  components: {
    Card: { borderRadiusLG: 10 },
    Button: { borderRadius: 8 },
    Menu: { itemBorderRadius: 8 },
  },
};
