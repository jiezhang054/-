import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Row, Col, Card, Select, Switch, Table, Button, Typography, Space } from 'antd';
import ReactECharts from 'echarts-for-react';
import { DownloadOutlined, LinkOutlined } from '@ant-design/icons';
import type { BurndownConfig } from '../../types/board';
import { useBoardData } from './useBoardData';
import { Spin } from 'antd';

const { Title } = Typography;

function generateBurndownData(total: number) {
  const days = ['06-01', '06-02', '06-03', '06-04', '06-05', '06-06', '06-07', '06-08', '06-09', '06-10'];
  let remaining = total;
  return days.map((date, i) => {
    const completed = i > 0 ? Math.floor(Math.random() * 3) + 1 : 0;
    remaining = Math.max(0, remaining - completed);
    const reference = total - (total / (days.length - 1)) * i;
    return { date, remaining, completed, added: i === 2 ? 2 : 0, reference: Math.round(reference) };
  });
}

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

  if (isLoading || !board) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

  const totalWorkload = board.cards.reduce((s, c) => s + (c.workload ?? 1), 0);

  const data = generateBurndownData(totalWorkload);

  const chartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['实际剩余', '参考线'] },
    xAxis: { type: 'category', data: data.map((d) => d.date) },
    yAxis: { type: 'value', name: config.mode === 'workload' ? '工作量(SP)' : '卡片数' },
    series: [
      { name: '实际剩余', type: 'line', data: data.map((d) => d.remaining), itemStyle: { color: '#1677ff' } },
      { name: '参考线', type: 'line', data: data.map((d) => d.reference), lineStyle: { type: 'dashed', color: '#8f959e' } },
    ],
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3}>{board.name} - 燃尽图</Title>
        <Space>
          <Button icon={<DownloadOutlined />}>导出 PNG</Button>
          <Button icon={<LinkOutlined />}>生成快照</Button>
        </Space>
      </div>
      <Row gutter={16}>
        <Col span={6}>
          <Card title="统计配置" size="small">
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 4 }}>统计模式</div>
              <Select style={{ width: '100%' }} value={config.mode}
                onChange={(v) => setConfig({ ...config, mode: v })}
                options={[{ value: 'workload', label: '工作量' }, { value: 'count', label: '卡片数' }]} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 4 }}>统计方式</div>
              <Select style={{ width: '100%' }} value={config.method}
                onChange={(v) => setConfig({ ...config, method: v })}
                options={[{ value: 'cumulative', label: '累加' }, { value: 'snapshot', label: '快照' }]} />
            </div>
            <div>仅工作日 <Switch checked={config.workdaysOnly} onChange={(v) => setConfig({ ...config, workdaysOnly: v })} /></div>
          </Card>
        </Col>
        <Col span={18}>
          <Card>
            <ReactECharts option={chartOption} style={{ height: 360 }} />
            <Table
              size="small"
              pagination={false}
              dataSource={data}
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
