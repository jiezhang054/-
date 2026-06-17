import { Card, Timeline, Dropdown, Empty } from 'antd';
import { AppstoreOutlined, ProjectOutlined, NodeIndexOutlined, ExportOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { MenuProps } from 'antd';
import type { RecentVisit } from '../../types/board';

const ICONS = {
  board: <AppstoreOutlined />,
  project: <ProjectOutlined />,
  mindmap: <NodeIndexOutlined />,
};

interface Props {
  visits: RecentVisit[];
  onRemove?: (id: number) => void;
}

export function RecentVisits({ visits, onRemove }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const go = (v: RecentVisit) => {
    if (v.type === 'board') navigate(`/board/${v.targetId}`);
    else if (v.type === 'project') navigate(`/projects/${v.targetId}`);
    else navigate(`/mindmap/${v.targetId}`);
  };

  const menu = (v: RecentVisit): MenuProps['items'] => [
    { key: 'open', label: '打开', onClick: () => go(v) },
    {
      key: 'newtab',
      label: '新标签页打开',
      icon: <ExportOutlined />,
      onClick: () => {
        const path = v.type === 'board' ? `/board/${v.targetId}` : v.type === 'project' ? `/projects/${v.targetId}` : `/mindmap/${v.targetId}`;
        window.open(path, '_blank');
      },
    },
    { key: 'remove', label: '移除记录', icon: <DeleteOutlined />, danger: true, onClick: () => onRemove?.(v.id) },
  ];

  return (
    <Card title={t('recentVisits')} size="small">
      {visits.length === 0 ? (
        <Empty description="暂无最近访问" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Timeline
          items={visits.map((v) => ({
            dot: ICONS[v.type],
            children: (
              <Dropdown menu={{ items: menu(v) }} trigger={['contextMenu']}>
                <span style={{ cursor: 'pointer' }} onClick={() => go(v)}>
                  {v.name}
                  <span style={{ color: '#8f959e', marginLeft: 8, fontSize: 11 }}>
                    {dayjs(v.visitedAt).format('MM-DD HH:mm')}
                  </span>
                </span>
              </Dropdown>
            ),
          }))}
        />
      )}
    </Card>
  );
}
