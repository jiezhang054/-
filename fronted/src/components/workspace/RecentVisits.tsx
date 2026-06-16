import { Card, Timeline } from 'antd';
import { AppstoreOutlined, ProjectOutlined, NodeIndexOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { RecentVisit } from '../../types/board';

const ICONS = {
  board: <AppstoreOutlined />,
  project: <ProjectOutlined />,
  mindmap: <NodeIndexOutlined />,
};

interface Props {
  visits: RecentVisit[];
}

export function RecentVisits({ visits }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const go = (v: RecentVisit) => {
    if (v.type === 'board') navigate(`/board/${v.targetId}`);
    else if (v.type === 'project') navigate(`/projects/${v.targetId}`);
    else navigate(`/mindmap/${v.targetId}`);
  };

  return (
    <Card title={t('recentVisits')} size="small">
      <Timeline
        items={visits.map((v) => ({
          dot: ICONS[v.type],
          children: (
            <span style={{ cursor: 'pointer' }} onClick={() => go(v)}>
              {v.name}
              <span style={{ color: '#8f959e', marginLeft: 8, fontSize: 11 }}>
                {dayjs(v.visitedAt).format('MM-DD HH:mm')}
              </span>
            </span>
          ),
        }))}
      />
    </Card>
  );
}
