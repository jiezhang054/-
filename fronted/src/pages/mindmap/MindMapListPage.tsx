import { useState } from 'react';
import { Card, List, Button } from 'antd';
import { PlusOutlined, NodeIndexOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { globalApi } from '../../api/global';
import { CreateMindmapModal } from '../../components/global/CreateMindmapModal';

export function MindMapListPage() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: mindmaps = [] } = useQuery({
    queryKey: ['mindmaps'],
    queryFn: globalApi.listMindmaps,
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>个人脑图</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建脑图</Button>
      </div>
      <Card>
        <List
          dataSource={mindmaps}
          locale={{ emptyText: '暂无脑图，点击右上角新建' }}
          renderItem={(m) => (
            <List.Item
              actions={[<Button type="link" onClick={() => navigate(`/mindmap/${m.id}`)}>打开</Button>]}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/mindmap/${m.id}`)}
            >
              <List.Item.Meta
                avatar={<NodeIndexOutlined style={{ fontSize: 24, color: '#1677ff' }} />}
                title={m.name}
                description={`${m.projectName || '个人'} · 更新于 ${m.updatedAt?.slice(0, 10) || '-'}`}
              />
            </List.Item>
          )}
        />
      </Card>
      <CreateMindmapModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={(id) => navigate(`/mindmap/${id}`)} />
    </div>
  );
}
