import type { BurndownConfig, BurndownPoint } from '../types/board';

export function buildBurndownConfigFromColumns(columns: { id: number; name: string }[]): BurndownConfig {
  const done = columns.filter((c) => c.name.includes('完成')).map((c) => c.id);
  const todo = columns.filter((c) => !c.name.includes('完成')).map((c) => c.id);
  return {
    mode: 'workload',
    method: 'cumulative',
    workdaysOnly: true,
    doneColumnIds: done,
    todoColumnIds: todo,
  };
}

export function buildBurndownChartOption(burndown: BurndownPoint[], mode: 'workload' | 'count') {
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['实际剩余', '参考线'] },
    xAxis: { type: 'category', data: burndown.map((d) => d.date) },
    yAxis: { type: 'value', name: mode === 'workload' ? '工作量(SP)' : '卡片数' },
    series: [
      {
        name: '实际剩余',
        type: 'line',
        data: burndown.map((d) => d.remaining),
        itemStyle: { color: '#1677ff' },
        smooth: true,
      },
      {
        name: '参考线',
        type: 'line',
        data: burndown.map((d) => d.reference),
        lineStyle: { type: 'dashed', color: '#8f959e' },
      },
    ],
  };
}
