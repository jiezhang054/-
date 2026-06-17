import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Typography, Spin } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useBoardData } from './useBoardData';
import { boardsApi } from '../../api/boards';

const { Title } = Typography;

export function BoardChartsPage() {
  const { boardId } = useParams();
  const id = Number(boardId);
  const { data: board, isLoading } = useBoardData(id);
  const { data: members = [] } = useQuery({
    queryKey: ['board-members', id],
    queryFn: () => boardsApi.getMembers(id),
    enabled: !!id,
  });

  if (isLoading || !board) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

  const columnData = board.columns.map((col) => ({
    name: col.name,
    value: board.cards.filter((c) => c.columnId === col.id).length,
  }));

  const memberMap: Record<string, number> = {};
  board.cards.forEach((c) => {
    (c.memberIds ?? []).forEach((m) => {
      const name = members.find((u) => u.id === m)?.displayName ?? `成员${m}`;
      memberMap[name] = (memberMap[name] || 0) + (c.workload ?? 1);
    });
  });

  const pieOption = {
    color: ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1'],
    title: { text: '列分布', left: 'center', textStyle: { fontSize: 14 } },
    series: [{ type: 'pie', radius: ['40%', '65%'], data: columnData, label: { formatter: '{b}: {c}' } }],
  };

  const barOption = {
    title: { text: '成员负载(SP)', left: 'center', textStyle: { fontSize: 14 } },
    xAxis: { type: 'category', data: Object.keys(memberMap), axisLabel: { rotate: 30 } },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: Object.values(memberMap), itemStyle: { color: '#1677ff', borderRadius: [4, 4, 0, 0] } }],
  };

  return (
    <div className="page-content">
      <Title level={3}>{board.name} - 图表板</Title>
      <Row gutter={16}>
        <Col span={12}><Card className="panel-card"><ReactECharts option={pieOption} style={{ height: 320 }} /></Card></Col>
        <Col span={12}><Card className="panel-card"><ReactECharts option={barOption} style={{ height: 320 }} /></Card></Col>
      </Row>
    </div>
  );
}
