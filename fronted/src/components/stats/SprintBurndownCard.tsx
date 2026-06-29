import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Progress, Button, Spin, Empty } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { boardsApi } from '../../api/boards';
import { normalizeBoard } from '../../utils/board';
import { buildBurndownChartOption, buildBurndownConfigFromColumns } from '../../utils/burndown';

interface Props {
  boardId: number;
  boardName: string;
  planned: number;
  completed: number;
  rate: number;
}

export function SprintBurndownCard({ boardId, boardName, planned, completed, rate }: Props) {
  const navigate = useNavigate();

  const { data: board, isLoading: loadingBoard } = useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => normalizeBoard(await boardsApi.getById(boardId)),
  });

  const config = useMemo(
    () => (board?.columns?.length ? buildBurndownConfigFromColumns(board.columns) : null),
    [board?.columns],
  );

  const { data: burndown = [], isLoading: loadingChart } = useQuery({
    queryKey: ['burndown', boardId, config],
    queryFn: () => boardsApi.getBurndown(boardId, config!),
    enabled: !!config,
  });

  const loading = loadingBoard || loadingChart;

  return (
    <Card
      title={`Sprint · ${boardName}`}
      size="small"
      extra={
        <Button
          type="link"
          size="small"
          icon={<LineChartOutlined />}
          onClick={() => navigate(`/board/${boardId}/stats`)}
        >
          燃尽图详情
        </Button>
      }
    >
      <div style={{ marginBottom: 12 }}>
        计划 {planned} SP · 已完成 {completed} SP
      </div>
      <Progress percent={rate} status={rate >= 100 ? 'success' : 'active'} style={{ marginBottom: 16 }} />
      {loading ? (
        <Spin />
      ) : burndown.length > 0 ? (
        <ReactECharts
          option={buildBurndownChartOption(burndown, config?.mode ?? 'workload')}
          style={{ height: 240 }}
        />
      ) : (
        <Empty description="暂无燃尽数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  );
}
