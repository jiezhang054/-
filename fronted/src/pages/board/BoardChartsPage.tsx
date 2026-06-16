import { useParams } from 'react-router-dom';
import { Row, Col, Card, Typography } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useBoardData } from './useBoardData';
import { Spin } from 'antd';

const { Title } = Typography;

export function BoardChartsPage() {
  const { boardId } = useParams();
  const id = Number(boardId);
  const { data: board, isLoading } = useBoardData(id);

  if (isLoading || !board) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

  const columnData = board.columns.map((col) => ({
    name: col.name,
    value: board.cards.filter((c) => c.columnId === col.id).length,
  }));

  const memberMap: Record<number, number> = {};
  board.cards.forEach((c) => (c.memberIds ?? []).forEach((m) => { memberMap[m] = (memberMap[m] || 0) + (c.workload ?? 1); }));

  const pieOption = {
    title: { text: '列分布', left: 'center' },
    series: [{ type: 'pie', radius: '60%', data: columnData }],
  };

  const barOption = {
    title: { text: '成员负载(SP)', left: 'center' },
    xAxis: { type: 'category', data: Object.keys(memberMap).map((k) => `成员${k}`) },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: Object.values(memberMap), itemStyle: { color: '#1677ff' } }],
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>{board.name} - 图表板</Title>
      <Row gutter={16}>
        <Col span={12}><Card><ReactECharts option={pieOption} style={{ height: 300 }} /></Card></Col>
        <Col span={12}><Card><ReactECharts option={barOption} style={{ height: 300 }} /></Card></Col>
      </Row>
    </div>
  );
}
