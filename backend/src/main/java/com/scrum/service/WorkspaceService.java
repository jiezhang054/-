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
    @Autowired private ActivityLogService activityLogService;
    @Autowired private PermissionService permissionService;

    public Map<String, Object> getDashboard(Long userId) {
        Long teamId = permissionService.getCurrentTeamId(userId);
        Map<String, Object> result = new HashMap<>();
        result.put("recentTasks", getRecentTasks(userId, teamId));
        result.put("starredBoards", getStarredBoards(userId, teamId));
        result.put("recentVisits", getRecentVisits(userId, teamId));
        result.put("activities", getActivities(userId, teamId, 0, 10));
        return result;
    }

    public List<Map<String, Object>> getRecentTasks(Long userId, Long teamId) {
        String teamFilter = teamId == null ? "p.team_id IS NULL" : "p.team_id = ?";
        String sql =
            "SELECT c.id, c.title, c.type, c.workload, c.due_date as dueDate, c.start_date as startDate, " +
            "c.board_id as boardId, c.column_id as columnId, b.name as boardName, b.type as boardType, " +
            "p.name as projectName, p.id as projectId, bc.name as columnName " +
            "FROM cards c " +
            "JOIN card_members cm ON c.id = cm.card_id AND cm.user_id = ? " +
            "JOIN boards b ON c.board_id = b.id " +
            "JOIN projects p ON b.project_id = p.id " +
            "JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ? " +
            "JOIN board_columns bc ON c.column_id = bc.id " +
            "WHERE c.deleted = FALSE AND (b.archived IS NULL OR b.archived = FALSE) " +
            "AND (p.archived IS NULL OR p.archived = FALSE) AND " + teamFilter + " " +
            "AND bc.name NOT LIKE '%已完成%' AND bc.name NOT LIKE '%关闭%' " +
            "ORDER BY CASE WHEN c.due_date IS NULL THEN 1 ELSE 0 END, c.due_date ASC LIMIT 20";

        List<Map<String, Object>> tasks = teamId == null
            ? jdbcTemplate.queryForList(sql, userId, userId)
            : jdbcTemplate.queryForList(sql, userId, userId, teamId);

        for (Map<String, Object> task : tasks) {
            Long cardId = ((Number) task.get("id")).longValue();
            List<Long> memberIds = jdbcTemplate.queryForList(
                "SELECT user_id FROM card_members WHERE card_id = ?", Long.class, cardId);
            task.put("memberIds", memberIds);
        }
        return tasks.stream().map(this::normalizeRecentTask).toList();
    }

    private Map<String, Object> normalizeRecentTask(Map<String, Object> row) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", rowVal(row, "id"));
        m.put("title", rowVal(row, "title"));
        m.put("type", rowVal(row, "type"));
        m.put("workload", rowVal(row, "workload"));
        m.put("dueDate", rowVal(row, "dueDate"));
        m.put("startDate", rowVal(row, "startDate"));
        m.put("boardId", rowVal(row, "boardId"));
        m.put("columnId", rowVal(row, "columnId"));
        m.put("boardName", rowVal(row, "boardName"));
        m.put("boardType", rowVal(row, "boardType"));
        m.put("projectName", rowVal(row, "projectName"));
        m.put("projectId", rowVal(row, "projectId"));
        m.put("columnName", rowVal(row, "columnName"));
        m.put("memberIds", row.get("memberIds"));
        return m;
    }

    private Object rowVal(Map<String, Object> row, String key) {
        if (row.containsKey(key)) return row.get(key);
        return row.get(key.toLowerCase());
    }

    private List<Map<String, Object>> normalizeRows(List<Map<String, Object>> rows, String... keys) {
        return rows.stream().map(row -> {
            Map<String, Object> m = new LinkedHashMap<>();
            for (String key : keys) {
                m.put(key, rowVal(row, key));
            }
            return m;
        }).toList();
    }

    public List<Map<String, Object>> getStarredBoards(Long userId, Long teamId) {
        String teamFilter = teamId == null ? "p.team_id IS NULL" : "p.team_id = ?";
        String sql =
            "SELECT b.id, b.name, p.name as projectName FROM starred_boards sb " +
            "JOIN boards b ON sb.board_id = b.id " +
            "JOIN projects p ON b.project_id = p.id " +
            "JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ? " +
            "WHERE sb.user_id = ? AND (b.archived IS NULL OR b.archived = FALSE) " +
            "AND (p.archived IS NULL OR p.archived = FALSE) AND " + teamFilter + " " +
            "ORDER BY sb.id DESC";
        List<Map<String, Object>> rows = teamId == null
            ? jdbcTemplate.queryForList(sql, userId, userId)
            : jdbcTemplate.queryForList(sql, userId, userId, teamId);
        return normalizeRows(rows, "id", "name", "projectName");
    }

    public List<Map<String, Object>> getRecentVisits(Long userId, Long teamId) {
        String teamFilter = teamId == null ? "p.team_id IS NULL" : "p.team_id = ?";
        String projectScope =
            "EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ? " +
            "WHERE p.id = rv.target_id AND (p.archived IS NULL OR p.archived = FALSE) AND " + teamFilter + ")";
        String boardScope =
            "EXISTS (SELECT 1 FROM boards b JOIN projects p ON b.project_id = p.id " +
            "JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ? " +
            "WHERE b.id = rv.target_id AND (p.archived IS NULL OR p.archived = FALSE) AND " + teamFilter + ")";
        String mindmapScope =
            "EXISTS (SELECT 1 FROM mindmaps m JOIN projects p ON m.project_id = p.id " +
            "JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ? " +
            "WHERE m.id = rv.target_id AND (p.archived IS NULL OR p.archived = FALSE) AND " + teamFilter + ")";

        String sql =
            "SELECT rv.id, rv.target_type as type, rv.target_id as targetId, rv.name, rv.visited_at as visitedAt " +
            "FROM recent_visits rv WHERE rv.user_id = ? AND (" +
            "(rv.target_type = 'project' AND " + projectScope + ") OR " +
            "(rv.target_type = 'board' AND " + boardScope + ") OR " +
            "(rv.target_type = 'mindmap' AND " + mindmapScope + ")" +
            ") ORDER BY rv.visited_at DESC LIMIT 15";

        List<Map<String, Object>> rows;
        if (teamId == null) {
            rows = jdbcTemplate.queryForList(sql, userId, userId, userId, userId);
        } else {
            rows = jdbcTemplate.queryForList(sql, userId, userId, teamId, userId, teamId, userId, teamId);
        }
        return normalizeRows(rows, "id", "type", "targetId", "name", "visitedAt");
    }

    public List<Map<String, Object>> getActivities(Long userId, int offset, int limit) {
        Long teamId = permissionService.getCurrentTeamId(userId);
        return getActivities(userId, teamId, offset, limit);
    }

    public List<Map<String, Object>> getActivities(Long userId, Long teamId, int offset, int limit) {
        String teamFilter = teamId == null ? "p.team_id IS NULL" : "p.team_id = ?";
        String boardScope =
            "al.board_id IS NULL OR EXISTS (SELECT 1 FROM boards b JOIN projects p ON b.project_id = p.id " +
            "JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ? " +
            "WHERE b.id = al.board_id AND (p.archived IS NULL OR p.archived = FALSE) AND " + teamFilter + ")";

        String sql =
            "SELECT al.id, al.user_id as userId, u.display_name as userName, al.action, " +
            "c.title as cardTitle, al.card_id as cardId, al.board_id as boardId, al.created_at as createdAt " +
            "FROM activity_logs al JOIN users u ON al.user_id = u.id " +
            "LEFT JOIN cards c ON al.card_id = c.id " +
            "WHERE (al.user_id = ? OR al.card_id IN (SELECT card_id FROM card_members WHERE user_id = ?)) " +
            "AND (" + boardScope + ") " +
            "ORDER BY al.created_at DESC LIMIT ? OFFSET ?";

        List<Map<String, Object>> rows;
        if (teamId == null) {
            rows = jdbcTemplate.queryForList(sql, userId, userId, userId, limit, offset);
        } else {
            rows = jdbcTemplate.queryForList(sql, userId, userId, userId, teamId, limit, offset);
        }
        return normalizeRows(rows, "id", "userId", "userName", "action", "cardTitle", "cardId", "boardId", "createdAt");
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

        String colName = jdbcTemplate.queryForObject(
            "SELECT name FROM board_columns WHERE id = ?", String.class, columnId);
        activityLogService.record(userId, card.getBoardId(), cardId,
            "移动了卡片「" + card.getTitle() + "」到「" + (colName != null ? colName : "目标列") + "」");

        Map<String, Object> result = new HashMap<>();
        result.put("id", card.getId());
        result.put("columnId", card.getColumnId());
        result.put("boardId", card.getBoardId());
        return result;
    }

    public List<Map<String, Object>> getBoardColumns(Long boardId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT id, name, sort_order as sortOrder FROM board_columns WHERE board_id = ? ORDER BY sort_order",
            boardId);
        return normalizeRows(rows, "id", "name", "sortOrder");
    }
}
