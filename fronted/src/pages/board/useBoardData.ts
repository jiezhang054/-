import { useQuery } from '@tanstack/react-query';
import { boardsApi } from '../../api/boards';
import { normalizeBoard } from '../../utils/board';

export function useBoardData(boardId: number) {
  return useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => normalizeBoard(await boardsApi.getById(boardId)),
    retry: false,
  });
}
