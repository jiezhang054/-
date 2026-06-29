import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Spin, message, Alert } from 'antd';
import { BoardHeader } from '../../components/board/BoardHeader';
import { BoardToolbar } from '../../components/board/BoardToolbar';
import { BoardView } from '../../components/board/BoardView';
import { BoardDndContext } from '../../components/board/BoardDndContext';
import { CardDetailDrawer } from '../../components/board/CardDetailDrawer';
import { SprintPlanModal } from '../../components/board/SprintPlanModal';
import { MilestonePlanModal } from '../../components/board/MilestonePlanModal';
import { BoardMembersModal } from '../../components/board/BoardMembersModal';
import { BoardSettingsModal } from '../../components/board/BoardSettingsModal';
import { BoardActivityDrawer } from '../../components/board/BoardActivityDrawer';
import { useBoardStore, useUIStore } from '../../stores/useUIStore';
import { boardsApi } from '../../api/boards';
import { globalApi } from '../../api/global';
import { useBoardWebSocket } from '../../hooks/useBoardWebSocket';
import { normalizeBoard, getStoriesFromDoneColumn } from '../../utils/board';
import type { Board, CardItem } from '../../types/board';

function filterCards(cards: CardItem[], filter: { keyword: string; label?: string; memberId?: number }) {
  return cards.filter((c) => {
    if (filter.keyword && !c.title.toLowerCase().includes(filter.keyword.toLowerCase())) return false;
    if (filter.label && !c.labels?.some((l) => l.name === filter.label)) return false;
    if (filter.memberId && !c.memberIds?.includes(filter.memberId)) return false;
    return true;
  });
}

export function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const id = Number(boardId);
  const queryClient = useQueryClient();
  const { board, setBoard, setMembers, getCard } = useBoardStore();
  const {
    selectedCardId, cardDrawerOpen, openCardDrawer, closeCardDrawer,
    sprintPlanOpen, setSprintPlanOpen, milestonePlanOpen, setMilestonePlanOpen,
    membersModalOpen, setMembersModalOpen, activityDrawerOpen, setActivityDrawerOpen,
    settingsModalOpen, setSettingsModalOpen, boardFilter,
  } = useUIStore();

  const [sprintPlanLoading, setSprintPlanLoading] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['board', id],
    queryFn: async () => normalizeBoard(await boardsApi.getById(id)),
    retry: false,
  });

  useEffect(() => {
    setBoard(null);
    return () => setBoard(null);
  }, [id, setBoard]);

  useEffect(() => {
    if (data) {
      setBoard(data);
      globalApi.recordVisit('board', data.id, data.name).catch(() => {});
    }
  }, [data, setBoard]);

  useEffect(() => {
    boardsApi.getMembers(id).then(setMembers).catch(() => {});
  }, [id, setMembers, data]);

  useEffect(() => {
    const cardParam = new URLSearchParams(location.search).get('card');
    if (cardParam && board) {
      openCardDrawer(Number(cardParam));
    }
  }, [location.search, board, openCardDrawer]);

  const { broadcast } = useBoardWebSocket(id, !isLoading && !!data);

  const displayBoard = useMemo(() => {
    if (!board) return null;
    return { ...board, cards: filterCards(board.cards, boardFilter) };
  }, [board, boardFilter]);

  const handleMoveCard = async (cardId: number, columnId: number, swimlaneId?: number) => {
    if (!board) return;
    broadcast('CARD_MOVED', { cardId, columnId, swimlaneId });
    try {
      await boardsApi.updateCardPosition(board.id, [{ cardId, columnId, swimlaneId, sortOrder: 0 }]);
    } catch { /* local state already updated */ }
  };

  const handleBoardUpdated = (updated: Board) => {
    setBoard(normalizeBoard(updated));
    queryClient.invalidateQueries({ queryKey: ['board', id] });
  };

  if (isLoading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;
  if (isError || !board || !displayBoard) return <div style={{ padding: 24 }}>看板加载失败，请刷新重试</div>;

  const selectedCard = selectedCardId ? getCard(selectedCardId) ?? null : null;
  const availableStories = getStoriesFromDoneColumn(board);
  const epics = board.cards.filter((c) => c.type === 'EPIC');
  const canWrite = board.permissions?.canWrite !== false;
  const chainLocked = board.chainLocked ?? board.permissions?.chainLocked;

  const cardContextMenu = (card: CardItem) => [
    { key: 'open', label: '查看详情' },
    ...(canWrite ? [{ key: 'delete', label: '删除' }] : []),
  ];

  return (
    <div onContextMenu={(e) => e.preventDefault()}>
      <BoardHeader
        board={board}
        canWrite={canWrite}
        onArchived={() => navigate('/my/boards')}
        onSettings={() => setSettingsModalOpen(true)}
        onRefresh={() => refetch()}
        onBoardUpdated={handleBoardUpdated}
      />
      {chainLocked && board.chainMessage && (
        <Alert type="warning" showIcon message={board.chainMessage} banner style={{ marginBottom: 0 }} />
      )}
      <BoardToolbar boardId={board.id} canWrite={canWrite} columns={board.columns} onRefresh={() => refetch()} />
      <BoardDndContext board={displayBoard} onMoveCard={canWrite ? handleMoveCard : undefined}>
        <BoardView
          board={displayBoard}
          canWrite={canWrite}
          onCardClick={openCardDrawer}
          onRefresh={() => refetch()}
          onCardContextMenu={(card, e) => {
            e.preventDefault();
            if (cardContextMenu(card).some((i) => i.key === 'delete') && e.shiftKey && canWrite) {
              boardsApi.deleteCard(card.id).then(() => { message.success('已移入回收站'); refetch(); });
            } else {
              openCardDrawer(card.id);
            }
          }}
        />
      </BoardDndContext>
      <CardDetailDrawer
        card={selectedCard}
        open={cardDrawerOpen}
        canWrite={canWrite}
        onClose={closeCardDrawer}
        onRefresh={() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ['workspace'] });
        }}
      />
      <BoardMembersModal open={membersModalOpen} boardId={board.id} onClose={() => setMembersModalOpen(false)} />
      <BoardSettingsModal open={settingsModalOpen} board={board} onClose={() => setSettingsModalOpen(false)} onUpdated={handleBoardUpdated} />
      <BoardActivityDrawer
        open={activityDrawerOpen}
        boardId={board.id}
        onClose={() => setActivityDrawerOpen(false)}
        onLocateCard={openCardDrawer}
      />
      <SprintPlanModal
        open={sprintPlanOpen}
        onClose={() => setSprintPlanOpen(false)}
        loading={sprintPlanLoading}
        milestoneStart={board.startDate}
        milestoneEnd={board.endDate}
        availableStories={availableStories.length ? availableStories : board.cards.filter((c) => c.type === 'USER_STORY')}
        onConfirm={async (sprints) => {
          setSprintPlanLoading(true);
          try {
            const res = await boardsApi.sprintPlan(board.id, {
              sprints: sprints
                .filter((s) => s.stories.length > 0)
                .map((s) => ({
                  name: s.name,
                  startDate: s.startDate,
                  endDate: s.endDate,
                  storyIds: s.stories.map((st) => st.id),
                })),
            });
            setSprintPlanOpen(false);
            message.success('Sprint 看板已创建');
            queryClient.invalidateQueries({ queryKey: ['project', board.projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            if (res?.id) navigate(`/board/${res.id}`);
          } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            message.error(msg || 'Sprint 规划失败');
          } finally {
            setSprintPlanLoading(false);
          }
        }}
      />
      <MilestonePlanModal
        open={milestonePlanOpen}
        onClose={() => setMilestonePlanOpen(false)}
        epics={epics}
        onConfirm={async (data) => {
          try {
            const res = await boardsApi.milestonePlan(board.id, data);
            message.success('里程碑看板已创建');
            if (res?.id) navigate(`/board/${res.id}`);
          } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            message.error(msg || '里程碑规划失败');
          }
        }}
      />
    </div>
  );
}
