import { useQuery } from '@tanstack/react-query';
import { boardsApi } from '../../api/boards';
import { MOCK_BOARDS } from '../../mocks/boards';
import { normalizeBoard } from '../../utils/board';

async function fetchBoard(id: number) {
  try {
    return normalizeBoard(await boardsApi.getById(id));
  } catch {
    const mock = MOCK_BOARDS[id];
    if (!mock) throw new Error('看板不存在');
    return normalizeBoard(mock);
  }
}

export function useBoardData(boardId: number) {
  return useQuery({
    queryKey: ['board', boardId],
    queryFn: () => fetchBoard(boardId),
  });
}
