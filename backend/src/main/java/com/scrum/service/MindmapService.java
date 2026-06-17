package com.scrum.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import java.util.*;

@Service
public class MindmapService {
    @Autowired private JdbcTemplate jdbcTemplate;

    public List<Map<String, Object>> listForUser(Long userId) {
        return jdbcTemplate.queryForList(
            "SELECT m.id, m.name, m.project_id as projectId, p.name as projectName, m.updated_at as updatedAt " +
            "FROM mindmaps m LEFT JOIN projects p ON m.project_id = p.id " +
            "WHERE m.owner_id = ? AND (m.archived IS NULL OR m.archived = FALSE) ORDER BY m.updated_at DESC",
            userId);
    }

    public Map<String, Object> create(Long userId, String name, Long projectId, String content) {
        if (!StringUtils.hasText(name)) throw new IllegalArgumentException("脑图名称不能为空");
        jdbcTemplate.update(
            "INSERT INTO mindmaps (name, project_id, owner_id, content) VALUES (?, ?, ?, ?)",
            name, projectId, userId, content);
        Long id = jdbcTemplate.queryForObject("SELECT MAX(id) FROM mindmaps WHERE owner_id = ?", Long.class, userId);
        Map<String, Object> m = new HashMap<>();
        m.put("id", id);
        m.put("name", name);
        m.put("projectId", projectId);
        return m;
    }
}
