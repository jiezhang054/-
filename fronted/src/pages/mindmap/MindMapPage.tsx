import { useCallback, useState } from 'react';
import ReactFlow, { addEdge, Background, Controls, MiniMap, useNodesState, useEdgesState, type Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import { Button, Space, message } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';

const initialNodes = [
  { id: '1', position: { x: 250, y: 0 }, data: { label: '电商重构' }, type: 'input' },
  { id: '2', position: { x: 100, y: 100 }, data: { label: '用户中心' } },
  { id: '3', position: { x: 400, y: 100 }, data: { label: '交易系统' } },
  { id: '4', position: { x: 100, y: 200 }, data: { label: '登录功能' } },
  { id: '5', position: { x: 400, y: 200 }, data: { label: '支付模块' } },
];
const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e1-3', source: '1', target: '3' },
  { id: 'e2-4', source: '2', target: '4' },
  { id: 'e3-5', source: '3', target: '5' },
];

export function MindMapPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const exportJson = () => {
    const data = { nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindmap.json';
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
          const data = JSON.parse(ev.target?.result as string);
          if (data.nodes) setNodes(data.nodes);
          if (data.edges) setEdges(data.edges);
          message.success('导入成功');
        } catch { message.error('JSON 格式错误'); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div style={{ height: 'calc(100vh - 56px)' }}>
      <div style={{ padding: '8px 16px', background: '#fff', borderBottom: '1px solid #e8e8e8' }}>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={exportJson}>导出 JSON</Button>
          <Button icon={<UploadOutlined />} onClick={importJson}>导入 JSON</Button>
        </Space>
      </div>
      <div style={{ height: 'calc(100% - 48px)' }}>
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView>
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
