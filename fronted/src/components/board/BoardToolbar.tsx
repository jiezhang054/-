import { Input, Select, Space, Dropdown, Button } from 'antd';
import { FilterOutlined, TeamOutlined, MoreOutlined, SearchOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

export function BoardToolbar() {
  const menuItems: MenuProps['items'] = [
    { key: 'import', label: '导入 JSON/CSV/Trello' },
    { key: 'export', label: '导出' },
    { key: 'snapshot', label: '分享快照' },
    { key: 'archive', label: '归档' },
    { key: 'recycle', label: '回收站' },
  ];

  return (
    <div style={{ padding: '8px 16px', background: '#fff', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between' }}>
      <Space>
        <Input prefix={<SearchOutlined />} placeholder="搜索卡片" style={{ width: 200 }} />
        <Select placeholder="标签" style={{ width: 120 }} allowClear options={[{ value: '前端', label: '前端' }, { value: '后端', label: '后端' }]} />
        <Select placeholder="成员" style={{ width: 120 }} allowClear options={[{ value: '1', label: '张茗杰' }, { value: '2', label: '殷浩然' }]} />
        <Button icon={<FilterOutlined />}>筛选</Button>
      </Space>
      <Space>
        <Button icon={<TeamOutlined />} />
        <Dropdown menu={{ items: menuItems }}>
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      </Space>
    </div>
  );
}
