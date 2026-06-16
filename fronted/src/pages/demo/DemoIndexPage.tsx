import { Card, List, Typography, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const DEMO_ROUTES = [
  { path: '/login', name: '登录页' },
  { path: '/register', name: '注册页' },
  { path: '/workspace', name: '工作台' },
  { path: '/projects/1', name: '项目看板列表' },
  { path: '/board/1', name: '产品路线图看板' },
  { path: '/board/2', name: '里程碑看板' },
  { path: '/board/3', name: 'Sprint 1 看板（核心）' },
  { path: '/board/3/stats', name: '燃尽图统计' },
  { path: '/board/3/timeline', name: '时间线视图' },
  { path: '/board/3/charts', name: '图表板' },
  { path: '/my/mindmaps', name: '脑图列表' },
  { path: '/mindmap/1', name: '脑图编辑器' },
];

export function DemoIndexPage() {
  const navigate = useNavigate();

  return (
    <div className="demo-index">
      <Title level={2}>Scrum 工具 Demo 导航</Title>
      <Card>
        <List
          dataSource={DEMO_ROUTES}
          renderItem={(item) => (
            <List.Item actions={[<Button type="link" onClick={() => navigate(item.path)}>跳转</Button>]}>
              <strong>{item.name}</strong> — {item.path}
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
