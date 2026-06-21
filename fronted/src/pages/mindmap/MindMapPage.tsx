import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Space,
  message,
  Spin,
  Typography,
  Tooltip,
  Divider,
  Select,
} from 'antd';
import {
  DownloadOutlined,
  UploadOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  CompressOutlined,
  AimOutlined,
  BranchesOutlined,
  PartitionOutlined,
} from '@ant-design/icons';
import { myApi } from '../../api/my';
import { MindMapEditor, type MindMapEditorHandle } from '../../components/mindmap/MindMapEditor';
import {
  buildLayoutSelectOptions,
  parseMindmapContent,
  parseImportedMindmapJson,
  serializeMindmapContent,
  type MindMapLayout,
  type MindMapPersistedContent,
} from '../../utils/mindmap';

const { Title } = Typography;
const layoutOptions = buildLayoutSelectOptions();

export function MindMapPage() {
  const { mindmapId } = useParams();
  const id = Number(mindmapId);
  const editorRef = useRef<MindMapEditorHandle>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSerializedRef = useRef<string>('');
  const [editorContent, setEditorContent] = useState<MindMapPersistedContent | null>(null);
  const [layout, setLayout] = useState<MindMapLayout>('logicalStructure');

  const { data, isLoading } = useQuery({
    queryKey: ['mindmap', id],
    queryFn: () => myApi.getMindmap(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const initialContent = useMemo(
    () => (data ? parseMindmapContent(data.content, data.name) : null),
    [data?.content, data?.name],
  );

  useEffect(() => {
    if (initialContent) {
      lastSerializedRef.current = serializeMindmapContent(initialContent);
      setLayout(initialContent.layout);
    }
  }, [id, initialContent]);

  const persist = useCallback((content: MindMapPersistedContent) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      myApi.updateContent(id, serializeMindmapContent(content)).catch(() => {});
    }, 800);
  }, [id]);

  const handleChange = useCallback((content: MindMapPersistedContent) => {
    const serialized = serializeMindmapContent(content);
    if (serialized === lastSerializedRef.current) return;
    lastSerializedRef.current = serialized;
    setEditorContent(content);
    setLayout(content.layout);
    persist(content);
  }, [persist]);

  const handleLayoutChange = (nextLayout: MindMapLayout) => {
    setLayout(nextLayout);
    editorRef.current?.setLayout(nextLayout);
    window.setTimeout(() => {
      const content = editorRef.current?.getContent();
      if (!content) return;
      const serialized = serializeMindmapContent(content);
      if (serialized === lastSerializedRef.current) return;
      lastSerializedRef.current = serialized;
      setEditorContent(content);
      persist(content);
    }, 120);
  };

  const saveNow = async () => {
    const content = editorRef.current?.getContent() ?? editorContent ?? initialContent;
    if (!content) return;
    await myApi.updateContent(id, serializeMindmapContent(content));
    message.success('已保存');
  };

  const exportJson = () => {
    const content = editorRef.current?.getContent() ?? editorContent ?? initialContent;
    if (!content) return;
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data?.name || 'mindmap'}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
          const content = parseImportedMindmapJson(ev.target?.result as string);
          editorRef.current?.setData(content);
          lastSerializedRef.current = serializeMindmapContent(content);
          setEditorContent(content);
          setLayout(content.layout);
          persist(content);
          message.success('导入成功');
        } catch {
          message.error('JSON 格式错误');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (isLoading || !data || !initialContent) {
    return <Spin style={{ display: 'block', margin: '100px auto' }} />;
  }

  return (
    <div style={{ height: 'calc(100vh - var(--header-height))', display: 'flex', flexDirection: 'column' }}>
      <div className="mindmap-toolbar">
        <div>
          <Title level={5} style={{ margin: 0 }}>{data.name}</Title>
          <div className="mindmap-toolbar-hint">
            Tab 子节点 · Enter 兄弟节点 · Delete 删除 · 滚轮缩放 · 拖拽移动节点
          </div>
        </div>
        <Space className="mindmap-toolbar-actions" wrap>
          <Select
            className="mindmap-layout-select"
            value={layout}
            onChange={handleLayoutChange}
            options={layoutOptions}
            popupMatchSelectWidth={false}
            suffixIcon={<PartitionOutlined />}
            optionFilterProp="label"
            showSearch
            placeholder="展示形式"
          />
          <Divider type="vertical" />
          <Tooltip title="添加子节点 (Tab)">
            <Button icon={<BranchesOutlined />} onClick={() => editorRef.current?.insertChild()}>子节点</Button>
          </Tooltip>
          <Tooltip title="添加兄弟节点 (Enter)">
            <Button icon={<PlusOutlined />} onClick={() => editorRef.current?.insertSibling()}>兄弟节点</Button>
          </Tooltip>
          <Tooltip title="删除节点 (Delete)">
            <Button icon={<DeleteOutlined />} danger onClick={() => editorRef.current?.removeNode()}>删除</Button>
          </Tooltip>
          <Divider type="vertical" />
          <Tooltip title="放大">
            <Button icon={<ZoomInOutlined />} onClick={() => editorRef.current?.zoomIn()} />
          </Tooltip>
          <Tooltip title="缩小">
            <Button icon={<ZoomOutOutlined />} onClick={() => editorRef.current?.zoomOut()} />
          </Tooltip>
          <Tooltip title="适应画布">
            <Button icon={<CompressOutlined />} onClick={() => editorRef.current?.fit()} />
          </Tooltip>
          <Tooltip title="回到根节点">
            <Button icon={<AimOutlined />} onClick={() => editorRef.current?.centerRoot()} />
          </Tooltip>
          <Divider type="vertical" />
          <Button icon={<SaveOutlined />} type="primary" onClick={saveNow}>保存</Button>
          <Button icon={<DownloadOutlined />} onClick={exportJson}>导出 JSON</Button>
          <Button icon={<UploadOutlined />} onClick={importJson}>导入 JSON</Button>
        </Space>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <MindMapEditor
          key={`${id}-${data.content ?? ''}`}
          ref={editorRef}
          content={initialContent}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
