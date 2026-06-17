import { useState } from 'react';
import { Card, List, Button, Space, Select, Dropdown, Modal, Input, message } from 'antd';
import {
  PlusOutlined, NodeIndexOutlined, EditOutlined, SwapOutlined, CopyOutlined,
  InboxOutlined, DeleteOutlined, DownloadOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MenuProps } from 'antd';
import { projectsApi } from '../../api/global';
import { myApi } from '../../api/my';
import { CreateMindmapModal } from '../../components/global/CreateMindmapModal';
import type { MindmapSummary } from '../../api/global';

export function MindMapListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [projectId, setProjectId] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameName, setRenameName] = useState('');
  const [moveId, setMoveId] = useState<number | null>(null);
  const [moveProjectId, setMoveProjectId] = useState<number>();

  const { data: mindmaps = [] } = useQuery({
    queryKey: ['mindmaps', projectId, sortBy, sortDir],
    queryFn: () => myApi.listMindmaps({ projectId, sortBy: sortBy === 'updatedAt' ? undefined : sortBy, sortDir }),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['mindmaps'] });

  const menu = (m: MindmapSummary): MenuProps['items'] => [
    { key: 'open', label: '打开', onClick: () => navigate(`/mindmap/${m.id}`) },
    { key: 'rename', label: '重命名', icon: <EditOutlined />, onClick: () => { setRenameId(m.id); setRenameName(m.name); } },
    { key: 'move', label: '移动至项目', icon: <SwapOutlined />, onClick: () => { setMoveId(m.id); setMoveProjectId(m.projectId); } },
    { key: 'export', label: '导出 JSON', icon: <DownloadOutlined />, onClick: async () => {
      const data = await myApi.exportMindmap(m.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${m.name}.json`; a.click();
      URL.revokeObjectURL(url);
    }},
    { key: 'copy', label: '复制', icon: <CopyOutlined />, onClick: () => myApi.copyMindmap(m.id).then(() => { message.success('已复制'); invalidate(); }) },
    { key: 'archive', label: '归档', icon: <InboxOutlined />, onClick: () => myApi.archiveMindmap(m.id).then(() => { message.success('已归档'); invalidate(); }) },
    { key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true, onClick: () => Modal.confirm({
      title: '确定删除该脑图？', okType: 'danger', onOk: () => myApi.deleteMindmap(m.id).then(() => { message.success('已删除'); invalidate(); }),
    })},
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>个人脑图</h2>
        <Space wrap>
          <Select
            allowClear placeholder="按项目筛选"
            style={{ width: 160 }}
            value={projectId}
            onChange={setProjectId}
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
          />
          <Select value={sortBy} onChange={setSortBy} style={{ width: 120 }}
            options={[{ value: 'updatedAt', label: '修改时间' }, { value: 'name', label: '名称' }]} />
          <Select value={sortDir} onChange={setSortDir} style={{ width: 90 }}
            options={[{ value: 'desc', label: '降序' }, { value: 'asc', label: '升序' }]} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建脑图</Button>
        </Space>
      </div>
      <Card>
        <List
          dataSource={mindmaps}
          locale={{ emptyText: '暂无脑图，点击右上角新建' }}
          renderItem={(m) => (
            <Dropdown menu={{ items: menu(m) }} trigger={['contextMenu']}>
              <List.Item
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/mindmap/${m.id}`)}
              >
                <List.Item.Meta
                  avatar={<NodeIndexOutlined style={{ fontSize: 24, color: '#1677ff' }} />}
                  title={m.name}
                  description={`${m.projectName || '个人'} · 更新于 ${m.updatedAt?.slice(0, 10) || '-'}`}
                />
              </List.Item>
            </Dropdown>
          )}
        />
      </Card>
      <div style={{ marginTop: 24 }}>
        <Link to="/my/boards/archived">查看已归档看板</Link>
        <span style={{ margin: '0 12px', color: '#d9d9d9' }}>|</span>
        <Link to="/my/mindmaps/archived">查看已归档脑图</Link>
        <span style={{ margin: '0 12px', color: '#d9d9d9' }}>|</span>
        <Link to="/my/projects/archived">查看已归档项目</Link>
      </div>
      <CreateMindmapModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={(id) => navigate(`/mindmap/${id}`)} />

      <Modal title="重命名脑图" open={renameId !== null} onCancel={() => setRenameId(null)}
        onOk={() => renameId && myApi.renameMindmap(renameId, renameName).then(() => {
          message.success('已重命名'); setRenameId(null); invalidate();
        })}>
        <Input value={renameName} onChange={(e) => setRenameName(e.target.value)} />
      </Modal>

      <Modal title="移动至项目" open={moveId !== null} onCancel={() => setMoveId(null)}
        onOk={() => moveId && myApi.moveMindmap(moveId, moveProjectId).then(() => {
          message.success('已移动'); setMoveId(null); invalidate();
        })}>
        <Select allowClear style={{ width: '100%' }} value={moveProjectId} onChange={setMoveProjectId}
          placeholder="无（个人脑图）" options={projects.map((p) => ({ value: p.id, label: p.name }))} />
      </Modal>
    </div>
  );
}
