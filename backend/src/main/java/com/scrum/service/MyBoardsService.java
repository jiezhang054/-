package com.scrum.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scrum.entity.*;
import com.scrum.mapper.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import java.util.*;

@Service
public class MyBoardsService {
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private BoardMapper boardMapper;
    @Autowired private BoardColumnMapper columnMapper;
    @Autowired private CardMapper cardMapper;
    @Autowired private UserMapper userMapper;
    @Autowired private BoardService boardService;
    @Autowired private ProjectService projectService;

    public List<Map<String, Object>> listBoards(Long userId, String filter, String sortBy, String sortDir) {
        StringBuilder sql = new StringBuilder(
            "SELECT b.id, b.name, b.type, b.project_id as projectId, p.name as projectName, " +
            "CASE WHEN sb.id IS NOT NULL THEN TRUE ELSE FALSE END as starred, " +
            "rv.visited_at as lastVisitedAt, COALESCE(ubo.sort_order, 9999) as userSortOrder, b.id as boardId " +
            "FROM boards b " +
            "JOIN projects p ON b.project_id = p.id " +
            "JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ? " +
            "LEFT JOIN starred_boards sb ON sb.board_id = b.id AND sb.user_id = ? " +
            "LEFT JOIN user_board_orders ubo ON ubo.board_id = b.id AND ubo.user_id = ? " +
            "LEFT JOIN (SELECT target_id, MAX(visited_at) as visited_at FROM recent_visits " +
            "WHERE user_id = ? AND target_type = 'board' GROUP BY target_id) rv ON rv.target_id = b.id " +
            "WHERE (b.archived IS NULL OR b.archived = FALSE) AND (p.archived IS NULL OR p.archived = FALSE)");

        List<Object> params = new ArrayList<>(List.of(userId, userId, userId, userId));

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql.toString(), params.toArray());
        List<Map<String, Object>> result = new ArrayList<>();

        for (Map<String, Object> row : rows) {
            Long boardId = ((Number) row.get("id")).longValue();
            boolean completed = isBoardCompleted(boardId);
            if ("incomplete".equals(filter) && completed) continue;
            if ("complete".equals(filter) && !completed) continue;

            long cardCount = cardMapper.selectCount(
                new LambdaQueryWrapper<Card>().eq(Card::getBoardId, boardId).eq(Card::getDeleted, false));

            Map<String, Object> item = new HashMap<>();
            item.put("id", boardId);
            item.put("name", row.get("name"));
            item.put("type", row.get("type"));
            item.put("projectId", getLong(row, "projectId", "PROJECTID"));
            item.put("projectName", firstNonNull(row, "projectName", "PROJECTNAME"));
            item.put("starred", toBoolean(firstNonNull(row, "starred", "STARRED")));
            item.put("lastVisitedAt", firstNonNull(row, "lastVisitedAt", "LASTVISITEDAT"));
            item.put("userSortOrder", getInt(row, "userSortOrder", "USERSORTORDER", 9999));
            item.put("cardCount", cardCount);
            item.put("completed", completed);
            result.add(item);
        }

        Comparator<Map<String, Object>> comparator;
        String sort = sortBy != null ? sortBy : "custom";
        if ("name".equals(sort)) {
            comparator = "asc".equalsIgnoreCase(sortDir)
                ? Comparator.comparing(m -> String.valueOf(m.get("name")))
                : Comparator.comparing(m -> String.valueOf(m.get("name")), Comparator.reverseOrder());
        } else if ("visited".equals(sort)) {
            comparator = "asc".equalsIgnoreCase(sortDir)
                ? Comparator.comparing(m -> m.get("lastVisitedAt") != null ? m.get("lastVisitedAt").toString() : "")
                : Comparator.comparing(m -> m.get("lastVisitedAt") != null ? m.get("lastVisitedAt").toString() : "", Comparator.reverseOrder());
        } else {
            comparator = Comparator
                .comparing((Map<String, Object> m) -> ((Number) m.get("userSortOrder")).intValue())
                .thenComparing(m -> m.get("lastVisitedAt") != null ? m.get("lastVisitedAt").toString() : "", Comparator.reverseOrder());
        }
        result.sort(comparator);
        return result;
    }

    public List<Map<String, Object>> listArchivedBoards(Long userId) {
        return jdbcTemplate.queryForList(
            "SELECT b.id, b.name, b.type, p.name as projectName FROM boards b " +
            "JOIN projects p ON b.project_id = p.id " +
            "JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ? " +
            "WHERE b.archived = TRUE ORDER BY b.id DESC", userId);
    }

    @Transactional
    public void reorderBoards(Long userId, List<Long> boardIds) {
        for (int i = 0; i < boardIds.size(); i++) {
            Long boardId = boardIds.get(i);
            Integer exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM user_board_orders WHERE user_id = ? AND board_id = ?",
                Integer.class, userId, boardId);
            if (exists != null && exists > 0) {
                jdbcTemplate.update("UPDATE user_board_orders SET sort_order = ? WHERE user_id = ? AND board_id = ?",
                    i, userId, boardId);
            } else {
                jdbcTemplate.update("INSERT INTO user_board_orders (user_id, board_id, sort_order) VALUES (?, ?, ?)",
                    userId, boardId, i);
            }
        }
    }

    @Transactional
    public Map<String, Object> createBoard(Long userId, String name, String template, Long projectId, boolean addProjectMembers) {
        Long pid = projectId;
        if (pid == null) pid = ensurePersonalProject(userId);
        ensureProjectMember(pid, userId);
        return boardService.createBoard(pid, name,
            template != null ? template : "NORMAL",
            template != null ? template : "NORMAL",
            addProjectMembers);
    }

    @Transactional
    public Map<String, Object> createBoard(Long userId, String name, String template, Long projectId) {
        return createBoard(userId, name, template, projectId, false);
    }

    private Long ensurePersonalProject(Long userId) {
        List<Long> ids = jdbcTemplate.queryForList(
            "SELECT p.id FROM projects p JOIN project_members pm ON p.id = pm.project_id " +
            "WHERE pm.user_id = ? AND p.name = '个人空间' LIMIT 1", Long.class, userId);
        if (!ids.isEmpty()) return ids.get(0);

        User user = userMapper.selectById(userId);
        String displayName = user != null ? user.getDisplayName() : "用户";
        Map<String, Object> project = projectService.create(userId, displayName + "的个人空间", "个人看板与脑图", "LIGHT");
        return ((Number) project.get("id")).longValue();
    }

    private void ensureProjectMember(Long projectId, Long userId) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM project_members WHERE project_id = ? AND user_id = ?",
            Integer.class, projectId, userId);
        if (count == null || count == 0) throw new IllegalArgumentException("无权在该项目下创建看板");
    }

    private void ensureBoardAccess(Long userId, Long boardId) {
        Board board = boardMapper.selectById(boardId);
        if (board == null) throw new IllegalArgumentException("看板不存在");
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM project_members pm JOIN boards b ON b.project_id = pm.project_id " +
            "WHERE pm.user_id = ? AND b.id = ?", Integer.class, userId, boardId);
        if (count == null || count == 0) throw new IllegalArgumentException("无权操作该看板");
    }

    public void renameBoard(Long userId, Long boardId, String name) {
        ensureBoardAccess(userId, boardId);
        boardService.renameBoard(boardId, name);
    }

    public void moveBoard(Long userId, Long boardId, Long projectId) {
        ensureBoardAccess(userId, boardId);
        ensureProjectMember(projectId, userId);
        boardService.moveBoard(boardId, projectId);
    }

    public Map<String, Object> copyBoard(Long userId, Long boardId) {
        ensureBoardAccess(userId, boardId);
        return boardService.copyBoard(boardId);
    }

    public void deleteBoard(Long userId, Long boardId) {
        ensureBoardAccess(userId, boardId);
        boardService.deleteBoard(boardId);
    }

    public void restoreBoard(Long userId, Long boardId) {
        ensureBoardAccess(userId, boardId);
        boardService.restoreBoard(boardId);
    }

    private boolean isBoardCompleted(Long boardId) {
        List<BoardColumn> cols = columnMapper.selectList(
            new LambdaQueryWrapper<BoardColumn>().eq(BoardColumn::getBoardId, boardId)
                .orderByDesc(BoardColumn::getSortOrder).last("LIMIT 1"));
        if (cols.isEmpty()) return true;
        Long doneColId = cols.get(0).getId();
        long total = cardMapper.selectCount(
            new LambdaQueryWrapper<Card>().eq(Card::getBoardId, boardId).eq(Card::getDeleted, false));
        if (total == 0) return true;
        long inDone = cardMapper.selectCount(
            new LambdaQueryWrapper<Card>().eq(Card::getBoardId, boardId).eq(Card::getDeleted, false)
                .eq(Card::getColumnId, doneColId));
        return total == inDone;
    }

    private Object firstNonNull(Map<String, Object> row, String... keys) {
        for (String key : keys) {
            if (row.get(key) != null) return row.get(key);
        }
        return null;
    }

    private Long getLong(Map<String, Object> row, String... keys) {
        Object val = firstNonNull(row, keys);
        return val != null ? ((Number) val).longValue() : null;
    }

    private int getInt(Map<String, Object> row, String key1, String key2, int defaultVal) {
        Object val = firstNonNull(row, key1, key2);
        return val != null ? ((Number) val).intValue() : defaultVal;
    }

    private boolean toBoolean(Object val) {
        if (val == null) return false;
        if (val instanceof Boolean b) return b;
        if (val instanceof Number n) return n.intValue() != 0;
        return Boolean.parseBoolean(val.toString());
    }
}
