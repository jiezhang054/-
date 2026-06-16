import { useParams } from 'react-router-dom';
import { Typography, Tabs, Row, Col } from 'antd';
import { StarFilled } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { BoardGridCard } from '../../components/project/BoardGridCard';
import { MOCK_PROJECTS } from '../../mocks/projects';
import { projectsApi } from '../../api/boards';

const { Title } = Typography;

export function ProjectPage() {
  const { projectId } = useParams();
  const id = Number(projectId);

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getById(id).catch(() => MOCK_PROJECTS.find((p) => p.id === id)),
  });

  if (!project) return <div>项目不存在</div>;

  const boards = project.boards ?? [];
  const starred = boards.filter((b) => b.starred);
  const normal = boards.filter((b) => !b.starred);

  const tabItems = boards.map((b) => ({
    key: String(b.id),
    label: b.name,
    children: (
      <Row gutter={[16, 16]}>
        {boards.map((board) => (
          <Col key={board.id}><BoardGridCard board={board} /></Col>
        ))}
      </Row>
    ),
  }));

  return (
    <div>
      <Title level={3}>{project.name}</Title>
      <Tabs type="card" items={tabItems} style={{ marginBottom: 16 }} />
      {starred.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}><StarFilled style={{ color: '#faad14' }} /> 星标看板</div>
          <Row gutter={[16, 16]}>
            {starred.map((b) => <Col key={b.id}><BoardGridCard board={b} /></Col>)}
          </Row>
        </div>
      )}
      <Row gutter={[16, 16]}>
        {normal.map((b) => <Col key={b.id}><BoardGridCard board={b} /></Col>)}
      </Row>
    </div>
  );
}
