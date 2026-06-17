import { Input, Select, Space, Dropdown, Button, message } from 'antd';
import { FilterOutlined, TeamOutlined, MoreOutlined, SearchOutlined, ClearOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useUIStore, useBoardStore } from '../../stores/useUIStore';
import { boardsApi } from '../../api/boards';

interface Props {
  boardId: number;
  onRefresh?: () => void;
}

export function BoardToolbar({ boardId, onRefresh }: Props) {
  const { boardFilter, setBoardFilter, clearBoardFilter, setMembersModalOpen } = useUIStore();
  const { members } = useBoardStore();

  const { data: labels = [] } = useQuery({
    queryKey: ['board-labels', boardId],
    queryFn: () => boardsApi.getLabels(boardId),
    staleTime: 60_000,
  });

  const hasFilter = !!(boardFilter.keyword || boardFilter.label || boardFilter.memberId);

  const handleExport = async () => {
    try {
      const blob = await boardsApi.exportJson(boardId);
      const url = URL.createObjectURL(blob.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `board-${boardId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error('导出失败');
    }
  };

  const handleSnapshot = async () => {
    try {
      const res = await boardsApi.createSnapshot(boardId);
      message.success(`快照已创建：${res.url}`);
    } catch {
      message.error('创建快照失败');
    }
  };

  const menuItems: MenuProps['items'] = [
    { key: 'export', label: '导出 JSON', onClick: handleExport },
    { key: 'snapshot', label: '分享快照', onClick: handleSnapshot },
    { key: 'refresh', label: '刷新看板', onClick: () => onRefresh?.() },
  ];

  return (
    <div style={{ padding: '8px 16px', background: '#fff', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between' }}>
      <Space>
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索卡片"
          style={{ width: 200 }}
          value={boardFilter.keyword}
          onChange={(e) => setBoardFilter({ keyword: e.target.value })}
          allowClear
        />
        <Select
          placeholder="标签"
          style={{ width: 120 }}
          allowClear
          value={boardFilter.label}
          onChange={(v) => setBoardFilter({ label: v })}
          options={labels.map((l) => ({ value: l.name, label: l.name }))}
        />
        <Select
          placeholder="成员"
          style={{ width: 120 }}
          allowClear
          value={boardFilter.memberId}
          onChange={(v) => setBoardFilter({ memberId: v })}
          options={members.map((m) => ({ value: m.id, label: m.displayName }))}
        />
        {hasFilter && (
          <Button icon={<ClearOutlined />} onClick={clearBoardFilter}>清空</Button>
        )}
        <Button icon={<FilterOutlined />} type={hasFilter ? 'primary' : 'default'}>
          筛选{hasFilter ? '中' : ''}
        </Button>
      </Space>
      <Space>
        <Button icon={<TeamOutlined />} onClick={() => setMembersModalOpen(true)} />
        <Dropdown menu={{ items: menuItems }}>
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      </Space>
    </div>
  );
}
