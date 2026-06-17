package com.scrum.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scrum.entity.Board;
import com.scrum.entity.Card;
import com.scrum.mapper.BoardMapper;
import com.scrum.mapper.CardMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class WorkspaceService {
    @Autowired private CardMapper cardMapper;
    @Autowired private BoardMapper boardMapper;
    @Autowired private JdbcTemplate jdbcTemplate;

    public Map<String, Object> getDashboard(Long userId) {
        Map<String, Object> result = new HashMap<>();
        result.put("recentTasks", getRecentTasks(userId));
        result.put("starredBoards", getStarredBoards(userId));
        result.put("recentVisits", getRecentVisits(userId));
        result.put("activities", getActivities(userId, 0, 20));
        return result;
    }

    public List<Map<String, Object>> getRecentTasks(Long userId) {
        List<Map<String, Object>> tasks = jdbcTemplate.queryForList(
            "SELECT c.id, c.title, c.type, c.workload, c.due_date as dueDate, c.start_date as startDate, " +
            "c.board_id as boardId, c.column_id as columnId, b.name as boardName, b.type as boardType, " +
            "p.name as projectName, p.id as projectId, bc.name as columnName " +
            "FROM cards c " +
            "JOIN card_members cm ON c.id = cm.card_id " +
            "JOIN boards b ON c.board_id = b.id " +
            "JOIN projects p ON b.project_id = p.id " +
            "JOIN board_columns bc ON c.column_id = bc.id " +
            "WHERE cm.user_id = ? AND c.deleted = FALSE AND (b.archived IS NULL OR b.archived = FALSE) " +
            "AND bc.name NOT LIKE '%已完成%' AND bc.name NOT LIKE '%关闭%' " +
            "ORDER BY CASE WHEN c.due_date IS NULL THEN 1 ELSE 0 END, c.due_date ASC LIMIT 20",
            userId);

        for (Map<String, Object> task : tasks) {
            Long cardId = ((Number) task.get("id")).longValue();
            List<Long> memberIds = jdbcTemplate.queryForList(
                "SELECT user_id FROM card_members WHERE card_id = ?", Long.class, cardId);
            task.put("memberIds", memberIds);
        }
        return tasks;
    }

    public List<Map<String, Object>> getStarredBoards(Long userId) {
        return jdbcTemplate.queryForList(
            "SELECT b.id, b.name, p.name as projectName FROM starred_boards sb " +
            "JOIN boards b ON sb.board_id = b.id JOIN projects p ON b.project_id = p.id " +
            "WHERE sb.user_id = ? AND (b.archived IS NULL OR b.archived = FALSE) ORDER BY sb.id DESC",
            userId);
    }

    public List<Map<String, Object>> getRecentVisits(Long userId) {
        return jdbcTemplate.queryForList(
            "SELECT id, target_type as type, target_id as targetId, name, visited_at as visitedAt " +
            "FROM recent_visits WHERE user_id = ? ORDER BY visited_at DESC LIMIT 50", userId);
    }

    public List<Map<String, Object>> getActivities(Long userId, int offset, int limit) {
        return jdbcTemplate.queryForList(
            "SELECT al.id, al.user_id as userId, u.display_name as userName, al.action, " +
            "c.title as cardTitle, al.card_id as cardId, al.board_id as boardId, al.created_at as createdAt " +
            "FROM activity_logs al JOIN users u ON al.user_id = u.id " +
            "LEFT JOIN cards c ON al.card_id = c.id " +
            "WHERE al.user_id = ? OR al.card_id IN (SELECT card_id FROM card_members WHERE user_id = ?) " +
            "ORDER BY al.created_at DESC LIMIT ? OFFSET ?",
            userId, userId, limit, offset);
    }

    @Transactional
    public void starBoard(Long userId, Long boardId) {
        Integer exists = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM starred_boards WHERE user_id = ? AND board_id = ?", Integer.class, userId, boardId);
        if (exists == null || exists == 0) {
            jdbcTemplate.update("INSERT INTO starred_boards (user_id, board_id) VALUES (?, ?)", userId, boardId);
        }
    }

    @Transactional
    public void unstarBoard(Long userId, Long boardId) {
        jdbcTemplate.update("DELETE FROM starred_boards WHERE user_id = ? AND board_id = ?", userId, boardId);
    }

    @Transactional
    public void removeVisit(Long userId, Long visitId) {
        jdbcTemplate.update("DELETE FROM recent_visits WHERE id = ? AND user_id = ?", visitId, userId);
    }

    @Transactional
    public void archiveBoard(Long userId, Long boardId) {
        Board board = boardMapper.selectById(boardId);
        if (board == null) throw new IllegalArgumentException("看板不存在");
        board.setArchived(true);
        boardMapper.updateById(board);
        jdbcTemplate.update("DELETE FROM starred_boards WHERE user_id = ? AND board_id = ?", userId, boardId);
    }

    @Transactional
    public Map<String, Object> quickMoveCard(Long userId, Long cardId, Long columnId) {
        Card card = cardMapper.selectById(cardId);
        if (card == null) throw new IllegalArgumentException("卡片不存在");
        Integer member = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM card_members WHERE card_id = ? AND user_id = ?", Integer.class, cardId, userId);
        if (member == null || member == 0) throw new IllegalArgumentException("无权操作该卡片");

        card.setColumnId(columnId);
        card.setVersion(card.getVersion() + 1);
        cardMapper.updateById(card);

        jdbcTemplate.update(
            "INSERT INTO activity_logs (user_id, action, card_id, board_id) VALUES (?, ?, ?, ?)",
            userId, "快速变更了卡片状态", cardId, card.getBoardId());

        Map<String, Object> result = new HashMap<>();
        result.put("id", card.getId());
        result.put("columnId", card.getColumnId());
        result.put("boardId", card.getBoardId());
        return result;
    }

    public List<Map<String, Object>> getBoardColumns(Long boardId) {
        return jdbcTemplate.queryForList(
            "SELECT id, name, sort_order as sortOrder FROM board_columns WHERE board_id = ? ORDER BY sort_order",
            boardId);
    }
}
