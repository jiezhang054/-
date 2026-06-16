import { Card, List, Button } from 'antd';
import { PlusOutlined, NodeIndexOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const MINDMAPS = [
  { id: 1, name: '电商重构脑图', project: '电商重构项目', updatedAt: '2026-06-14' },
  { id: 2, name: 'Sprint 1 规划', project: '电商重构项目', updatedAt: '2026-06-10' },
];

export function MindMapListPage() {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>个人脑图</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/mindmap/1')}>新建脑图</Button>
      </div>
      <Card>
        <List
          dataSource={MINDMAPS}
          renderItem={(m) => (
            <List.Item
              actions={[<Button type="link" onClick={() => navigate(`/mindmap/${m.id}`)}>打开</Button>]}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/mindmap/${m.id}`)}
            >
              <List.Item.Meta
                avatar={<NodeIndexOutlined style={{ fontSize: 24, color: '#1677ff' }} />}
                title={m.name}
                description={`${m.project} · 更新于 ${m.updatedAt}`}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
