import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#2563EB',
    colorSuccess: '#22C55E',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    borderRadius: 8,
    fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
    colorBgContainer: '#ffffff',
    colorBgLayout: '#F4F5F7',
    colorText: '#111827',
    colorTextSecondary: '#6B7280',
    colorBorder: '#E5E7EB',
  },
  components: {
    Card: { borderRadiusLG: 10 },
    Button: { borderRadius: 8 },
    Menu: { itemBorderRadius: 8 },
    Segmented: { borderRadius: 8, borderRadiusSM: 6 },
  },
};
