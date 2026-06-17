import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Typography, Card, Row, Col, Progress, Table, Button, Spin, Empty } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { projectsApi } from '../../api/global';

const { Title } = Typography;

export function ProjectStatsPage() {
  const { projectId } = useParams();
  const id = Number(projectId);
  const navigate = useNavigate();

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getById(id),
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['project-stats', id],
    queryFn: () => projectsApi.getStats(id),
  });

  if (isLoading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;
  if (!stats) return <Empty description="暂无统计数据" />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/projects/${id}`)}>返回项目</Button>
        <Title level={3} style={{ margin: 0 }}>{project?.name ?? '项目'} - 统计</Title>
      </div>

      <Row gutter={[16, 16]}>
        {stats.backlogProgress.map((bp) => (
          <Col key={bp.boardId} xs={24} lg={12}>
            <Card title={`Backlog · ${bp.boardName}`} size="small">
              <ReactECharts
                style={{ height: 240 }}
                option={{
                  tooltip: { trigger: 'item' },
                  series: [{
                    type: 'pie',
                    radius: '65%',
                    data: bp.columns.map((c) => ({ name: c.name, value: c.count })),
                  }],
                }}
              />
            </Card>
          </Col>
        ))}

        {stats.sprintStats.map((ss) => (
          <Col key={ss.boardId} xs={24} lg={12}>
            <Card title={`Sprint · ${ss.boardName}`} size="small">
              <div style={{ marginBottom: 12 }}>
                计划 {ss.planned} SP · 已完成 {ss.completed} SP
              </div>
              <Progress percent={ss.rate} status={ss.rate >= 100 ? 'success' : 'active'} />
            </Card>
          </Col>
        ))}

        {stats.defectDistribution.map((dd) => (
          <Col key={dd.boardId} xs={24} lg={12}>
            <Card title={`缺陷分布 · ${dd.boardName}`} size="small">
              <Table
                size="small"
                pagination={false}
                dataSource={dd.columns}
                rowKey="name"
                columns={[
                  { title: '列', dataIndex: 'name' },
                  { title: '缺陷数', dataIndex: 'count' },
                ]}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {stats.backlogProgress.length === 0 && stats.sprintStats.length === 0 && stats.defectDistribution.length === 0 && (
        <Empty description="暂无统计数据" />
      )}
    </div>
  );
}
