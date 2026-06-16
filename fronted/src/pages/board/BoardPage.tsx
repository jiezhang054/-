import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Spin } from 'antd';
import { BoardHeader } from '../../components/board/BoardHeader';
import { BoardToolbar } from '../../components/board/BoardToolbar';
import { BoardView } from '../../components/board/BoardView';
import { BoardDndContext } from '../../components/board/BoardDndContext';
import { CardDetailDrawer } from '../../components/board/CardDetailDrawer';
import { SprintPlanModal } from '../../components/board/SprintPlanModal';
import { MilestonePlanModal } from '../../components/board/MilestonePlanModal';
import { useBoardStore, useUIStore } from '../../stores/useUIStore';
import { MOCK_BOARDS } from '../../mocks/boards';
import { boardsApi } from '../../api/boards';
import { useBoardWebSocket } from '../../hooks/useBoardWebSocket';
import { normalizeBoard, getStoriesFromDoneColumn } from '../../utils/board';

export function BoardPage() {
  const { boardId } = useParams();
  const id = Number(boardId);
  const { board, setBoard, getCard } = useBoardStore();
  const {
    selectedCardId, cardDrawerOpen, openCardDrawer, closeCardDrawer,
    sprintPlanOpen, setSprintPlanOpen, milestonePlanOpen, setMilestonePlanOpen,
  } = useUIStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['board', id],
    queryFn: async () => {
      try {
        const res = await boardsApi.getById(id);
        return normalizeBoard(res);
      } catch {
        const mock = MOCK_BOARDS[id];
        if (!mock) throw new Error('看板不存在');
        return normalizeBoard(mock);
      }
    },
  });

  useEffect(() => {
    setBoard(null);
    return () => setBoard(null);
  }, [id, setBoard]);

  useEffect(() => {
    if (data) setBoard(data);
  }, [data, setBoard]);

  const wsEnabled = !isLoading && !!data;
  useBoardWebSocket(id, wsEnabled);

  if (isLoading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;
  if (isError || !board) return <div style={{ padding: 24 }}>看板加载失败，请刷新重试</div>;

  const selectedCard = selectedCardId ? getCard(selectedCardId) ?? null : null;
  const availableStories = getStoriesFromDoneColumn(board);
  const epics = board.cards.filter((c) => c.type === 'EPIC');

  const handleMoveCard = async (cardId: number, columnId: number, swimlaneId?: number) => {
    try {
      await boardsApi.updateCardPosition(board.id, [{ cardId, columnId, swimlaneId, sortOrder: 0 }]);
    } catch { /* fallback to local state */ }
  };

  return (
    <div>
      <BoardHeader board={board} />
      <BoardToolbar />
      <BoardDndContext board={board} onMoveCard={handleMoveCard}>
        <BoardView board={board} onCardClick={openCardDrawer} />
      </BoardDndContext>
      <CardDetailDrawer card={selectedCard} open={cardDrawerOpen} onClose={closeCardDrawer} />
      <SprintPlanModal
        open={sprintPlanOpen}
        onClose={() => setSprintPlanOpen(false)}
        availableStories={availableStories.length ? availableStories : board.cards.filter((c) => c.type === 'USER_STORY')}
        onConfirm={(sprints) => boardsApi.sprintPlan(board.id, { sprints: sprints.map((s) => ({
          name: s.name, startDate: s.startDate, endDate: s.endDate, storyIds: s.stories.map((st) => st.id),
        })) }).catch(() => {})}
      />
      <MilestonePlanModal
        open={milestonePlanOpen}
        onClose={() => setMilestonePlanOpen(false)}
        epics={epics}
        onConfirm={(data) => boardsApi.milestonePlan(board.id, data).catch(() => {})}
      />
    </div>
  );
}
