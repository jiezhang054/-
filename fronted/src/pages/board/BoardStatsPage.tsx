import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Select, Switch, Table, Button, Typography, Space, Spin } from 'antd';
import ReactECharts from 'echarts-for-react';
import { DownloadOutlined, LinkOutlined } from '@ant-design/icons';
import type { BurndownConfig } from '../../types/board';
import { useBoardData } from './useBoardData';
import { boardsApi } from '../../api/boards';

const { Title } = Typography;

export function BoardStatsPage() {
  const { boardId } = useParams();
  const id = Number(boardId);
  const { data: board, isLoading } = useBoardData(id);
  const [config, setConfig] = useState<BurndownConfig>({
    mode: 'workload',
    method: 'cumulative',
    workdaysOnly: true,
    todoColumnIds: [],
    doneColumnIds: [],
  });

  useEffect(() => {
    if (board?.columns) {
      const done = board.columns.filter((c) => c.name.includes('完成')).map((c) => c.id);
      const todo = board.columns.filter((c) => !c.name.includes('完成')).map((c) => c.id);
      setConfig((c) => ({ ...c, doneColumnIds: done, todoColumnIds: todo }));
    }
  }, [board]);

  const { data: burndown = [], isLoading: loadingChart } = useQuery({
    queryKey: ['burndown', id, config],
    queryFn: () => boardsApi.getBurndown(id, config),
    enabled: !!board,
  });

  if (isLoading || !board) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

  const totalWorkload = board.cards.reduce((s, c) => s + (c.workload ?? 1), 0);
  const completed = board.cards.filter((c) => config.doneColumnIds.includes(c.columnId))
    .reduce((s, c) => s + (c.workload ?? 1), 0);

  const chartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['实际剩余', '参考线'] },
    xAxis: { type: 'category', data: burndown.map((d) => d.date) },
    yAxis: { type: 'value', name: config.mode === 'workload' ? '工作量(SP)' : '卡片数' },
    series: [
      { name: '实际剩余', type: 'line', data: burndown.map((d) => d.remaining), itemStyle: { color: '#1677ff' }, smooth: true },
      { name: '参考线', type: 'line', data: burndown.map((d) => d.reference), lineStyle: { type: 'dashed', color: '#8f959e' } },
    ],
  };

  const exportPng = () => {
    const chart = document.querySelector('.burndown-chart canvas') as HTMLCanvasElement | null;
    if (!chart) return;
    const a = document.createElement('a');
    a.href = chart.toDataURL('image/png');
    a.download = `burndown-${id}.png`;
    a.click();
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{board.name} - 燃尽图</Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={exportPng}>导出 PNG</Button>
          <Button icon={<LinkOutlined />} onClick={() => boardsApi.createSnapshot(id)}>生成快照</Button>
        </Space>
      </div>
      <Row gutter={16}>
        <Col span={6}>
          <Card title="统计配置" size="small" className="panel-card">
            <div style={{ marginBottom: 12 }}>
              <div className="field-label">统计模式</div>
              <Select style={{ width: '100%' }} value={config.mode}
                onChange={(v) => setConfig({ ...config, mode: v })}
                options={[{ value: 'workload', label: '工作量' }, { value: 'count', label: '卡片数' }]} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div className="field-label">统计方式</div>
              <Select style={{ width: '100%' }} value={config.method}
                onChange={(v) => setConfig({ ...config, method: v })}
                options={[{ value: 'cumulative', label: '累加' }, { value: 'snapshot', label: '快照' }]} />
            </div>
            <div style={{ marginBottom: 12 }}>仅工作日 <Switch checked={config.workdaysOnly} onChange={(v) => setConfig({ ...config, workdaysOnly: v })} /></div>
            <div className="stats-summary">
              <div>总工作量：<strong>{totalWorkload} SP</strong></div>
              <div>已完成：<strong>{completed} SP</strong></div>
              <div>剩余：<strong>{totalWorkload - completed} SP</strong></div>
            </div>
          </Card>
        </Col>
        <Col span={18}>
          <Card className="panel-card">
            {loadingChart ? <Spin /> : <ReactECharts className="burndown-chart" option={chartOption} style={{ height: 360 }} />}
            <Table
              size="small"
              pagination={false}
              dataSource={burndown}
              columns={[
                { title: '日期', dataIndex: 'date' },
                { title: '剩余', dataIndex: 'remaining' },
                { title: '完成', dataIndex: 'completed' },
                { title: '新增', dataIndex: 'added' },
              ]}
              rowKey="date"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
