import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactFlow, { addEdge, Background, Controls, MiniMap, useNodesState, useEdgesState, type Connection, type Node, type Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { Button, Space, message, Spin, Typography } from 'antd';
import { DownloadOutlined, UploadOutlined, SaveOutlined } from '@ant-design/icons';
import { myApi } from '../../api/my';

const { Title } = Typography;

type MindNode = Node<{ label: string }>;

function parseContent(content?: string): { nodes: MindNode[]; edges: Edge[] } {
  if (!content) return { nodes: [], edges: [] };
  try {
    const data = JSON.parse(content);
    return {
      nodes: (data.nodes ?? []).map((n: MindNode) => ({
        ...n,
        data: { label: String((n.data as { label?: string })?.label ?? '') },
      })),
      edges: data.edges ?? [],
    };
  } catch {
    return { nodes: [], edges: [] };
  }
}

export function MindMapPage() {
  const { mindmapId } = useParams();
  const id = Number(mindmapId);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [name, setName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['mindmap', id],
    queryFn: () => myApi.getMindmap(id),
    enabled: !!id,
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<{ label: string }>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (data) {
      setName(data.name);
      const parsed = parseContent(data.content);
      if (parsed.nodes.length) {
        setNodes(parsed.nodes);
        setEdges(parsed.edges);
      } else {
        setNodes([
          { id: '1', position: { x: 250, y: 0 }, data: { label: data.name }, type: 'input' },
        ]);
        setEdges([]);
      }
    }
  }, [data, setNodes, setEdges]);

  const persist = useCallback((n: MindNode[], e: Edge[]) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      myApi.updateContent(id, JSON.stringify({ nodes: n, edges: e })).catch(() => {});
    }, 800);
  }, [id]);

  useEffect(() => {
    if (nodes.length && data) persist(nodes, edges);
  }, [nodes, edges, data, persist]);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name || 'mindmap'}.json`;
    a.click();
    message.success('已导出 JSON');
  };

  const importJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = parseContent(ev.target?.result as string);
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
          message.success('导入成功');
        } catch { message.error('JSON 格式错误'); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const saveNow = async () => {
    await myApi.updateContent(id, JSON.stringify({ nodes, edges }));
    message.success('已保存');
  };

  if (isLoading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div style={{ height: 'calc(100vh - var(--header-height))', display: 'flex', flexDirection: 'column' }}>
      <div className="mindmap-toolbar">
        <Title level={5} style={{ margin: 0 }}>{name}</Title>
        <Space>
          <Button icon={<SaveOutlined />} type="primary" onClick={saveNow}>保存</Button>
          <Button icon={<DownloadOutlined />} onClick={exportJson}>导出 JSON</Button>
          <Button icon={<UploadOutlined />} onClick={importJson}>导入 JSON</Button>
        </Space>
      </div>
      <div style={{ flex: 1 }}>
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView>
          <Background color="#e8e8e8" gap={16} />
          <Controls />
          <MiniMap nodeColor="#1677ff" />
        </ReactFlow>
      </div>
    </div>
  );
}
