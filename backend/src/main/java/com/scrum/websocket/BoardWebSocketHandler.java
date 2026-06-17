package com.scrum.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
public class BoardWebSocketHandler extends TextWebSocketHandler {
    private final Map<String, CopyOnWriteArraySet<WebSocketSession>> boardSessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String boardId = extractBoardId(session);
        boardSessions.computeIfAbsent(boardId, k -> new CopyOnWriteArraySet<>()).add(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String boardId = extractBoardId(session);
        broadcastRaw(boardId, message.getPayload(), session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String boardId = extractBoardId(session);
        var sessions = boardSessions.get(boardId);
        if (sessions != null) sessions.remove(session);
    }

    public void notifyBoard(Long boardId, String type, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(Map.of("type", type, "payload", payload));
            broadcastRaw(String.valueOf(boardId), json, null);
        } catch (Exception ignored) { }
    }

    private void broadcastRaw(String boardId, String json, String excludeSessionId) {
        var sessions = boardSessions.get(boardId);
        if (sessions == null) return;
        TextMessage message = new TextMessage(json);
        for (WebSocketSession s : sessions) {
            try {
                if (s.isOpen() && (excludeSessionId == null || !s.getId().equals(excludeSessionId))) {
                    s.sendMessage(message);
                }
            } catch (Exception ignored) { }
        }
    }

    private String extractBoardId(WebSocketSession session) {
        String path = session.getUri() != null ? session.getUri().getPath() : "";
        String[] parts = path.split("/");
        return parts.length > 0 ? parts[parts.length - 1] : "0";
    }
}
