import { useParams } from 'react-router-dom';
import { Card, Typography } from 'antd';
import { useBoardData } from './useBoardData';
import { Spin } from 'antd';
import dayjs from 'dayjs';

const { Title } = Typography;

export function BoardTimelinePage() {
  const { boardId } = useParams();
  const id = Number(boardId);
  const { data: board, isLoading } = useBoardData(id);

  if (isLoading || !board) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

  const cardsWithDates = board.cards.filter((c) => c.dueDate || c.startDate);

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>{board.name} - 时间线</Title>
      <Card>
        <div style={{ overflowX: 'auto' }}>
          {cardsWithDates.map((card) => {
            const start = card.startDate || dayjs().format('YYYY-MM-DD');
            const end = card.dueDate || dayjs().add(7, 'day').format('YYYY-MM-DD');
            const width = dayjs(end).diff(dayjs(start), 'day') * 20 + 100;
            return (
              <div key={card.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ width: 150, fontSize: 13 }}>{card.title}</div>
                <div style={{
                  height: 28, width, background: '#1677ff', borderRadius: 4, opacity: 0.8,
                  display: 'flex', alignItems: 'center', paddingLeft: 8, color: '#fff', fontSize: 12
                }}>
                  {dayjs(start).format('MM-DD')} → {dayjs(end).format('MM-DD')}
                </div>
              </div>
            );
          })}
          {cardsWithDates.length === 0 && <div style={{ color: '#8f959e' }}>暂无带日期的卡片</div>}
        </div>
      </Card>
    </div>
  );
}
