package com.scrum.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import java.util.*;

@Service
public class NavigationService {
    @Autowired private JdbcTemplate jdbcTemplate;

    public Map<String, Object> getNavigation(Long userId, String keyword) {
        Map<String, Object> result = new HashMap<>();

        result.put("recentVisits", jdbcTemplate.queryForList(
            "SELECT id, target_type as type, target_id as targetId, name, visited_at as visitedAt " +
            "FROM recent_visits WHERE user_id = ? ORDER BY visited_at DESC LIMIT 50", userId));

        List<Map<String, Object>> projects = jdbcTemplate.queryForList(
            "SELECT p.id, p.name FROM projects p " +
            "JOIN project_members pm ON p.id = pm.project_id " +
            "WHERE pm.user_id = ? AND (p.archived IS NULL OR p.archived = FALSE) ORDER BY p.name",
            userId);

        List<Map<String, Object>> tree = new ArrayList<>();
        for (Map<String, Object> proj : projects) {
            Long pid = ((Number) proj.get("id")).longValue();
            String sql = "SELECT b.id, b.name, b.type FROM boards b WHERE b.project_id = ? AND (b.archived IS NULL OR b.archived = FALSE)";
            List<Object> params = new ArrayList<>(List.of(pid));
            if (StringUtils.hasText(keyword)) {
                sql += " AND b.name LIKE ?";
                params.add("%" + keyword + "%");
            }
            sql += " ORDER BY b.sort_order, b.id";
            List<Map<String, Object>> boards = jdbcTemplate.queryForList(sql, params.toArray());
            Map<String, Object> node = new HashMap<>();
            node.put("projectId", pid);
            node.put("projectName", proj.get("name"));
            node.put("boards", boards);
            if (!boards.isEmpty() || !StringUtils.hasText(keyword)) tree.add(node);
        }
        result.put("boardTree", tree);

        result.put("archivedBoards", jdbcTemplate.queryForList(
            "SELECT b.id, b.name, p.name as projectName FROM boards b " +
            "JOIN projects p ON b.project_id = p.id " +
            "JOIN project_members pm ON p.id = pm.project_id " +
            "WHERE pm.user_id = ? AND b.archived = TRUE", userId));

        result.put("archivedProjects", jdbcTemplate.queryForList(
            "SELECT p.id, p.name FROM projects p " +
            "JOIN project_members pm ON p.id = pm.project_id " +
            "WHERE pm.user_id = ? AND p.archived = TRUE", userId));

        return result;
    }

    public void recordVisit(Long userId, String type, Long targetId, String name) {
        jdbcTemplate.update(
            "INSERT INTO recent_visits (user_id, target_type, target_id, name) VALUES (?, ?, ?, ?)",
            userId, type, targetId, name);
    }
}
