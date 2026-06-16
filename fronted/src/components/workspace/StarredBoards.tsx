import { Card, List } from 'antd';
import { StarFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Props {
  boards: { id: number; name: string; projectName: string }[];
}

export function StarredBoards({ boards }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Card title={t('starredBoards')} size="small">
      <List
        dataSource={boards}
        renderItem={(b) => (
          <List.Item style={{ cursor: 'pointer' }} onClick={() => navigate(`/board/${b.id}`)}>
            <StarFilled style={{ color: '#faad14', marginRight: 8 }} />
            <span>{b.name}</span>
            <span style={{ color: '#8f959e', marginLeft: 8, fontSize: 12 }}>{b.projectName}</span>
          </List.Item>
        )}
      />
    </Card>
  );
}
