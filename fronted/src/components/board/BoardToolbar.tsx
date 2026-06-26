import { Input, Select, Space, Dropdown, Button, message, Modal } from 'antd';
import {
  FilterOutlined, TeamOutlined, MoreOutlined, SearchOutlined, ClearOutlined,
  CheckSquareOutlined, DeleteOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useUIStore, useBoardStore } from '../../stores/useUIStore';
import { boardsApi } from '../../api/boards';

interface Props {
  boardId: number;
  canWrite?: boolean;
  columns?: { id: number; name: string }[];
  onRefresh?: () => void;
}

export function BoardToolbar({ boardId, canWrite = true, columns = [], onRefresh }: Props) {
  const navigate = useNavigate();
  const {
    boardFilter, setBoardFilter, clearBoardFilter, setMembersModalOpen,
    batchMode, setBatchMode, selectedCardIds, clearCardSelection,
  } = useUIStore();
  const { members } = useBoardStore();

  const { data: labels = [] } = useQuery({
    queryKey: ['board-labels', boardId],
    queryFn: () => boardsApi.getLabels(boardId),
    staleTime: 60_000,
  });

  const hasFilter = !!(boardFilter.keyword || boardFilter.label || boardFilter.memberId);

  const handleExport = async () => {
    try {
      const data = await boardsApi.getById(boardId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `board-${boardId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch {
      message.error('导出失败');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        await boardsApi.importJson(boardId, file);
        message.success('导入成功');
        onRefresh?.();
      } catch { message.error('导入失败'); }
    };
    input.click();
  };

  const handleSnapshot = async () => {
    try {
      const res = await boardsApi.createSnapshot(boardId);
      message.success(`快照已创建：${res.url}`);
    } catch {
      message.error('创建快照失败');
    }
  };

  const handleBatchMove = () => {
    if (!selectedCardIds.length) return;
    Modal.confirm({
      title: '批量移动到列',
      content: (
        <Select
          id="batch-move-col"
          style={{ width: '100%', marginTop: 8 }}
          placeholder="选择目标列"
          options={columns.map((c) => ({ value: c.id, label: c.name }))}
          onChange={async (columnId) => {
            try {
              await boardsApi.batchCards(boardId, { action: 'move', cardIds: selectedCardIds, columnId });
              message.success('批量移动成功');
              clearCardSelection();
              onRefresh?.();
            } catch { message.error('批量移动失败'); }
          }}
        />
      ),
      okButtonProps: { style: { display: 'none' } },
      cancelText: '关闭',
    });
  };

  const handleBatchAssign = () => {
    if (!selectedCardIds.length) return;
    Modal.confirm({
      title: '批量指派成员',
      content: (
        <Select
          style={{ width: '100%', marginTop: 8 }}
          placeholder="选择成员"
          options={members.map((m) => ({ value: m.id, label: m.displayName }))}
          onChange={async (memberId) => {
            try {
              await boardsApi.batchCards(boardId, { action: 'assign', cardIds: selectedCardIds, memberId });
              message.success('批量指派成功');
              clearCardSelection();
              onRefresh?.();
            } catch { message.error('批量指派失败'); }
          }}
        />
      ),
      okButtonProps: { style: { display: 'none' } },
      cancelText: '关闭',
    });
  };

  const handleBatchDelete = () => {
    Modal.confirm({
      title: `删除 ${selectedCardIds.length} 张卡片？`,
      content: '卡片将移入回收站',
      onOk: async () => {
        try {
          await boardsApi.batchCards(boardId, { action: 'delete', cardIds: selectedCardIds });
          message.success('已删除');
          clearCardSelection();
          onRefresh?.();
        } catch { message.error('删除失败'); }
      },
    });
  };

  const menuItems: MenuProps['items'] = [
    { key: 'import', label: '导入 JSON', onClick: handleImport, disabled: !canWrite },
    { key: 'export', label: '导出 JSON', onClick: handleExport },
    { key: 'snapshot', label: '分享快照', onClick: handleSnapshot },
    { key: 'trash', label: '回收站', onClick: () => navigate(`/board/${boardId}/trash`) },
    { key: 'refresh', label: '刷新看板', onClick: () => onRefresh?.() },
  ];

  return (
    <div style={{ padding: '8px 16px', background: '#fff', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
      <Space wrap>
        {batchMode ? (
          <>
            <Button type={batchMode ? 'primary' : 'default'} icon={<CheckSquareOutlined />}>
              已选 {selectedCardIds.length} 张
            </Button>
            <Button disabled={!selectedCardIds.length || !canWrite} onClick={handleBatchMove}>移动</Button>
            <Button disabled={!selectedCardIds.length || !canWrite} onClick={handleBatchAssign}>指派</Button>
            <Button disabled={!selectedCardIds.length || !canWrite} danger icon={<DeleteOutlined />} onClick={handleBatchDelete}>删除</Button>
            <Button onClick={() => clearCardSelection()}>取消</Button>
          </>
        ) : (
          <>
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
            {canWrite && (
              <Button icon={<CheckSquareOutlined />} onClick={() => setBatchMode(true)}>批量</Button>
            )}
          </>
        )}
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
