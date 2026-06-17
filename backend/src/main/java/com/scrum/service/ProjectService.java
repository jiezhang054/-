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
import java.util.stream.Collectors;

@Service
public class ProjectService {
    @Autowired private ProjectMapper projectMapper;
    @Autowired private BoardMapper boardMapper;
    @Autowired private BoardColumnMapper columnMapper;
    @Autowired private CardMapper cardMapper;
    @Autowired private UserMapper userMapper;
    @Autowired private BoardService boardService;
    @Autowired private JdbcTemplate jdbcTemplate;

    public List<Map<String, Object>> listForUser(Long userId) {
        List<Long> projectIds = jdbcTemplate.queryForList(
            "SELECT project_id FROM project_members WHERE user_id = ?", Long.class, userId);
        if (projectIds.isEmpty()) return List.of();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Long pid : projectIds) {
            Project p = projectMapper.selectById(pid);
            if (p == null || Boolean.TRUE.equals(p.getArchived())) continue;
            result.add(toProjectMap(p, userId));
        }
        result.sort((a, b) -> String.valueOf(a.get("name")).compareTo(String.valueOf(b.get("name"))));
        return result;
    }

    public List<Map<String, Object>> listArchived(Long userId) {
        List<Long> projectIds = jdbcTemplate.queryForList(
            "SELECT project_id FROM project_members WHERE user_id = ?", Long.class, userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Long pid : projectIds) {
            Project p = projectMapper.selectById(pid);
            if (p == null || !Boolean.TRUE.equals(p.getArchived())) continue;
            Map<String, Object> m = new HashMap<>();
            m.put("id", p.getId());
            m.put("name", p.getName());
            m.put("description", p.getDescription());
            result.add(m);
        }
        return result;
    }

    public Map<String, Object> getById(Long id, Long userId) {
        ensureMember(id, userId);
        Project p = projectMapper.selectById(id);
        if (p == null) throw new IllegalArgumentException("项目不存在");
        return toProjectMap(p, userId);
    }

    @Transactional
    public Map<String, Object> create(Long userId, String name, String description, String template) {
        if (!StringUtils.hasText(name)) throw new IllegalArgumentException("项目名称不能为空");
        Project p = new Project();
        p.setName(name);
        p.setDescription(description);
        p.setOwnerId(userId);
        p.setTemplate(StringUtils.hasText(template) ? template : "SCRUM");
        p.setArchived(false);
        projectMapper.insert(p);

        jdbcTemplate.update("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, 'OWNER')",
            p.getId(), userId);

        if ("SCRUM".equalsIgnoreCase(p.getTemplate())) {
            boardService.createBoard(p.getId(), "产品路线图", "ROADMAP", "ROADMAP");
        }

        return toProjectMap(p, userId);
    }

    @Transactional
    public Map<String, Object> update(Long projectId, Long userId, String name, String description) {
        ensureOwnerOrAdmin(projectId, userId);
        Project p = projectMapper.selectById(projectId);
        if (p == null) throw new IllegalArgumentException("项目不存在");
        if (StringUtils.hasText(name)) p.setName(name);
        if (description != null) p.setDescription(description);
        projectMapper.updateById(p);
        return toProjectMap(p, userId);
    }

    @Transactional
    public void archive(Long projectId, Long userId) {
        ensureOwnerOrAdmin(projectId, userId);
        Project p = projectMapper.selectById(projectId);
        if (p == null) throw new IllegalArgumentException("项目不存在");
        p.setArchived(true);
        projectMapper.updateById(p);
    }

    @Transactional
    public void restore(Long projectId, Long userId) {
        ensureOwnerOrAdmin(projectId, userId);
        Project p = projectMapper.selectById(projectId);
        if (p == null) throw new IllegalArgumentException("项目不存在");
        p.setArchived(false);
        projectMapper.updateById(p);
    }

    @Transactional
    public void delete(Long projectId, Long userId) {
        ensureOwner(projectId, userId);
        Project p = projectMapper.selectById(projectId);
        if (p == null) throw new IllegalArgumentException("项目不存在");

        List<Board> boards = boardMapper.selectList(
            new LambdaQueryWrapper<Board>().eq(Board::getProjectId, projectId));
        for (Board b : boards) {
            jdbcTemplate.update("DELETE FROM starred_boards WHERE board_id = ?", b.getId());
            jdbcTemplate.update("DELETE FROM card_members WHERE card_id IN (SELECT id FROM cards WHERE board_id = ?)", b.getId());
            jdbcTemplate.update("DELETE FROM cards WHERE board_id = ?", b.getId());
            jdbcTemplate.update("DELETE FROM board_columns WHERE board_id = ?", b.getId());
            jdbcTemplate.update("DELETE FROM swimlanes WHERE board_id = ?", b.getId());
            jdbcTemplate.update("DELETE FROM burndown_snapshots WHERE board_id = ?", b.getId());
            jdbcTemplate.update("DELETE FROM activity_logs WHERE board_id = ?", b.getId());
            boardMapper.deleteById(b.getId());
        }

        jdbcTemplate.update("DELETE FROM mindmaps WHERE project_id = ?", projectId);
        jdbcTemplate.update("DELETE FROM recent_visits WHERE target_type = 'project' AND target_id = ?", projectId);
        jdbcTemplate.update("DELETE FROM project_members WHERE project_id = ?", projectId);
        projectMapper.deleteById(projectId);
    }

    public List<Map<String, Object>> listMembers(Long projectId, Long userId) {
        ensureMember(projectId, userId);
        return jdbcTemplate.query(
            "SELECT u.id, u.username, u.display_name as displayName, u.email, u.avatar, pm.role " +
            "FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = ? ORDER BY pm.role, u.display_name",
            (rs, i) -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", rs.getLong("id"));
                m.put("username", rs.getString("username"));
                m.put("displayName", rs.getString("displayName"));
                m.put("email", rs.getString("email"));
                m.put("avatar", rs.getString("avatar"));
                m.put("role", rs.getString("role"));
                return m;
            }, projectId);
    }

    @Transactional
    public Map<String, Object> inviteMember(Long projectId, Long userId, String identifier, String role) {
        ensureOwnerOrAdmin(projectId, userId);
        if (!StringUtils.hasText(identifier)) throw new IllegalArgumentException("请输入用户名或邮箱");
        String r = StringUtils.hasText(role) ? role.toUpperCase() : "MEMBER";
        if (!Set.of("OWNER", "MEMBER", "READONLY").contains(r)) throw new IllegalArgumentException("无效的角色");

        List<User> users = userMapper.selectList(new LambdaQueryWrapper<User>()
            .eq(User::getUsername, identifier.trim()).or().eq(User::getEmail, identifier.trim()));
        if (users.isEmpty()) throw new IllegalArgumentException("用户不存在");
        User target = users.get(0);

        Integer exists = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM project_members WHERE project_id = ? AND user_id = ?",
            Integer.class, projectId, target.getId());
        if (exists != null && exists > 0) throw new IllegalArgumentException("用户已是项目成员");

        jdbcTemplate.update("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)",
            projectId, target.getId(), r);

        Map<String, Object> m = new HashMap<>();
        m.put("id", target.getId());
        m.put("username", target.getUsername());
        m.put("displayName", target.getDisplayName());
        m.put("email", target.getEmail());
        m.put("avatar", target.getAvatar());
        m.put("role", r);
        return m;
    }

    @Transactional
    public void removeMember(Long projectId, Long userId, Long memberId) {
        ensureOwner(projectId, userId);
        if (userId.equals(memberId)) throw new IllegalArgumentException("不能移除自己");
        Project p = projectMapper.selectById(projectId);
        if (p != null && memberId.equals(p.getOwnerId())) throw new IllegalArgumentException("不能移除项目所有者");
        jdbcTemplate.update("DELETE FROM project_members WHERE project_id = ? AND user_id = ?", projectId, memberId);
    }

    @Transactional
    public void updateMemberRole(Long projectId, Long userId, Long memberId, String role) {
        ensureOwner(projectId, userId);
        if (!StringUtils.hasText(role)) throw new IllegalArgumentException("角色不能为空");
        String r = role.toUpperCase();
        if (!Set.of("OWNER", "MEMBER", "READONLY").contains(r)) throw new IllegalArgumentException("无效的角色");
        jdbcTemplate.update("UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?",
            r, projectId, memberId);
        if ("OWNER".equals(r)) {
            Project p = projectMapper.selectById(projectId);
            if (p != null) {
                p.setOwnerId(memberId);
                projectMapper.updateById(p);
            }
        }
    }

    @Transactional
    public void reorderBoards(Long projectId, Long userId, List<Long> boardIds) {
        ensureMember(projectId, userId);
        for (int i = 0; i < boardIds.size(); i++) {
            Board b = boardMapper.selectById(boardIds.get(i));
            if (b != null && projectId.equals(b.getProjectId())) {
                b.setSortOrder(i);
                boardMapper.updateById(b);
            }
        }
    }

    public Map<String, Object> getStats(Long projectId, Long userId) {
        ensureMember(projectId, userId);
        Map<String, Object> stats = new HashMap<>();

        List<Board> boards = boardMapper.selectList(
            new LambdaQueryWrapper<Board>().eq(Board::getProjectId, projectId).eq(Board::getArchived, false));

        List<Map<String, Object>> backlogProgress = new ArrayList<>();
        List<Map<String, Object>> sprintStats = new ArrayList<>();
        List<Map<String, Object>> defectDist = new ArrayList<>();

        for (Board b : boards) {
            List<BoardColumn> cols = columnMapper.selectList(
                new LambdaQueryWrapper<BoardColumn>().eq(BoardColumn::getBoardId, b.getId())
                    .orderByAsc(BoardColumn::getSortOrder));
            if (cols.isEmpty()) continue;
            Long doneColId = cols.get(cols.size() - 1).getId();

            List<Card> cards = cardMapper.selectList(
                new LambdaQueryWrapper<Card>().eq(Card::getBoardId, b.getId()).eq(Card::getDeleted, false));

            if ("ROADMAP".equals(b.getType()) || "MILESTONE".equals(b.getType()) || "NORMAL".equals(b.getType())) {
                Map<String, Integer> colCounts = new LinkedHashMap<>();
                for (BoardColumn c : cols) colCounts.put(c.getName(), 0);
                for (Card c : cards) {
                    String colName = cols.stream().filter(col -> col.getId().equals(c.getColumnId()))
                        .map(BoardColumn::getName).findFirst().orElse("未知");
                    colCounts.merge(colName, 1, Integer::sum);
                }
                Map<String, Object> bp = new HashMap<>();
                bp.put("boardId", b.getId());
                bp.put("boardName", b.getName());
                bp.put("columns", colCounts.entrySet().stream().map(e -> Map.of("name", e.getKey(), "count", e.getValue())).collect(Collectors.toList()));
                backlogProgress.add(bp);
            }

            if ("SPRINT".equals(b.getType())) {
                int total = cards.stream().mapToInt(c -> c.getWorkload() != null ? c.getWorkload() : 1).sum();
                int done = cards.stream().filter(c -> doneColId.equals(c.getColumnId()))
                    .mapToInt(c -> c.getWorkload() != null ? c.getWorkload() : 1).sum();
                Map<String, Object> ss = new HashMap<>();
                ss.put("boardId", b.getId());
                ss.put("boardName", b.getName());
                ss.put("planned", total);
                ss.put("completed", done);
                ss.put("rate", total > 0 ? Math.round(done * 100.0 / total) : 0);
                sprintStats.add(ss);
            }

            long bugCount = cards.stream().filter(c -> "BUG".equals(c.getType())).count();
            if (bugCount > 0 || "DEFECT".equals(b.getType())) {
                Map<String, Integer> bugCols = new LinkedHashMap<>();
                for (BoardColumn c : cols) bugCols.put(c.getName(), 0);
                for (Card c : cards) {
                    if (!"BUG".equals(c.getType())) continue;
                    String colName = cols.stream().filter(col -> col.getId().equals(c.getColumnId()))
                        .map(BoardColumn::getName).findFirst().orElse("未知");
                    bugCols.merge(colName, 1, Integer::sum);
                }
                Map<String, Object> dd = new HashMap<>();
                dd.put("boardId", b.getId());
                dd.put("boardName", b.getName());
                dd.put("columns", bugCols.entrySet().stream().map(e -> Map.of("name", e.getKey(), "count", e.getValue())).collect(Collectors.toList()));
                defectDist.add(dd);
            }
        }

        stats.put("backlogProgress", backlogProgress);
        stats.put("sprintStats", sprintStats);
        stats.put("defectDistribution", defectDist);
        return stats;
    }

    private Map<String, Object> toProjectMap(Project p, Long userId) {
        Map<String, Object> pm = new HashMap<>();
        pm.put("id", p.getId());
        pm.put("name", p.getName());
        pm.put("description", p.getDescription());
        pm.put("template", p.getTemplate());
        pm.put("archived", Boolean.TRUE.equals(p.getArchived()));
        pm.put("role", getUserRole(p.getId(), userId));

        List<Board> boards = boardMapper.selectList(
            new LambdaQueryWrapper<Board>().eq(Board::getProjectId, p.getId()).eq(Board::getArchived, false)
                .orderByAsc(Board::getSortOrder).orderByAsc(Board::getId));

        List<Map<String, Object>> boardSummaries = new ArrayList<>();
        for (Board b : boards) {
            boardSummaries.add(toBoardSummary(b, userId));
        }
        pm.put("boards", boardSummaries);

        List<Map<String, Object>> tabs = new ArrayList<>();
        for (Board b : boards) {
            if (Set.of("ROADMAP", "MILESTONE", "SPRINT").contains(b.getType())) {
                Map<String, Object> tab = new HashMap<>();
                tab.put("key", b.getType().toLowerCase() + "-" + b.getId());
                tab.put("boardId", b.getId());
                tab.put("label", b.getName());
                tab.put("type", b.getType());
                tabs.add(tab);
            }
        }
        pm.put("tabs", tabs);

        List<Map<String, Object>> mindmaps = jdbcTemplate.queryForList(
            "SELECT id, name FROM mindmaps WHERE project_id = ? AND (archived IS NULL OR archived = FALSE) LIMIT 1", p.getId());
        if (!mindmaps.isEmpty()) {
            pm.put("mindmapId", mindmaps.get(0).get("id"));
            pm.put("mindmapName", mindmaps.get(0).get("name"));
        }

        return pm;
    }

    private Map<String, Object> toBoardSummary(Board b, Long userId) {
        Map<String, Object> bs = new HashMap<>();
        bs.put("id", b.getId());
        bs.put("name", b.getName());
        bs.put("type", b.getType());
        bs.put("starred", isStarred(userId, b.getId()));
        bs.put("sortOrder", b.getSortOrder() != null ? b.getSortOrder() : 0);
        bs.put("startDate", b.getStartDate() != null ? b.getStartDate().toString() : null);
        bs.put("endDate", b.getEndDate() != null ? b.getEndDate().toString() : null);

        long cardCount = cardMapper.selectCount(
            new LambdaQueryWrapper<Card>().eq(Card::getBoardId, b.getId()).eq(Card::getDeleted, false));
        bs.put("cardCount", cardCount);
        bs.put("completed", isBoardCompleted(b.getId()));
        return bs;
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

    private String getUserRole(Long projectId, Long userId) {
        if (userId == null) return "READONLY";
        List<String> roles = jdbcTemplate.queryForList(
            "SELECT role FROM project_members WHERE project_id = ? AND user_id = ?", String.class, projectId, userId);
        return roles.isEmpty() ? "READONLY" : roles.get(0);
    }

    private boolean isStarred(Long userId, Long boardId) {
        if (userId == null) return false;
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM starred_boards WHERE user_id = ? AND board_id = ?", Integer.class, userId, boardId);
        return count != null && count > 0;
    }

    private void ensureMember(Long projectId, Long userId) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM project_members WHERE project_id = ? AND user_id = ?",
            Integer.class, projectId, userId);
        if (count == null || count == 0) throw new IllegalArgumentException("无权访问该项目");
    }

    private void ensureOwner(Long projectId, Long userId) {
        String role = getUserRole(projectId, userId);
        if (!"OWNER".equals(role)) throw new IllegalArgumentException("仅项目所有者可执行此操作");
    }

    private void ensureOwnerOrAdmin(Long projectId, Long userId) {
        String role = getUserRole(projectId, userId);
        if (!"OWNER".equals(role)) throw new IllegalArgumentException("无权执行此操作");
    }
}
