import { useEffect, useRef } from 'react';
import { useBoardStore } from '../stores/useUIStore';

export function useBoardWebSocket(boardId: number, enabled = true) {
  const wsRef = useRef<WebSocket | null>(null);
  const { moveCard, setBoard } = useBoardStore();

  useEffect(() => {
    if (!enabled || !boardId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.hostname}:8080/ws/boards/${boardId}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'CARD_MOVED' && msg.payload) {
          moveCard(msg.payload.cardId, msg.payload.columnId, msg.payload.swimlaneId);
        } else if (msg.type === 'BOARD_UPDATE' && msg.payload) {
          setBoard(msg.payload);
        }
      } catch { /* ignore */ }
    };

    return () => ws.close();
  }, [boardId, enabled, moveCard, setBoard]);

  const broadcast = (type: string, payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  return { broadcast };
}
