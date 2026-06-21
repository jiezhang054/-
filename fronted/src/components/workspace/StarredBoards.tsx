import { Card, List, Dropdown, Empty } from 'antd';
import { StarFilled, ExportOutlined, StarOutlined, InboxOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MenuProps } from 'antd';

interface Props {
  boards: { id: number; name: string; projectName: string }[];
  onUnstar?: (boardId: number) => void;
  onArchive?: (boardId: number) => void;
}

export function StarredBoards({ boards, onUnstar, onArchive }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const menu = (b: { id: number; name: string }): MenuProps['items'] => [
    { key: 'open', label: '打开', onClick: () => navigate(`/board/${b.id}`) },
    { key: 'newtab', label: '新标签页打开', icon: <ExportOutlined />, onClick: () => window.open(`/board/${b.id}`, '_blank') },
    { key: 'unstar', label: '取消星标', icon: <StarOutlined />, onClick: () => onUnstar?.(b.id) },
    { key: 'archive', label: '归档', icon: <InboxOutlined />, onClick: () => onArchive?.(b.id) },
  ];

  return (
    <Card className="workspace-panel workspace-panel--starred" title={t('starredBoards')} size="small">
      {boards.length === 0 ? (
        <Empty description="暂无星标看板，去看板列表中点击☆标星" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div className="workspace-panel__scroll">
          <List
            dataSource={boards}
            split={false}
            renderItem={(b) => (
            <Dropdown menu={{ items: menu(b) }} trigger={['contextMenu']}>
              <List.Item style={{ cursor: 'pointer' }} onClick={() => navigate(`/board/${b.id}`)}>
                <StarFilled style={{ color: '#faad14', marginRight: 8 }} />
                <span>{b.name}</span>
                <span style={{ color: '#8f959e', marginLeft: 8, fontSize: 12 }}>{b.projectName}</span>
              </List.Item>
            </Dropdown>
          )}
          />
        </div>
      )}
    </Card>
  );
}
