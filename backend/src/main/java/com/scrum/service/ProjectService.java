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
public class ProjectService {
    @Autowired private ProjectMapper projectMapper;
    @Autowired private BoardMapper boardMapper;
    @Autowired private BoardColumnMapper columnMapper;
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

    private Map<String, Object> toProjectMap(Project p, Long userId) {
        Map<String, Object> pm = new HashMap<>();
        pm.put("id", p.getId());
        pm.put("name", p.getName());
        pm.put("description", p.getDescription());
        pm.put("template", p.getTemplate());

        List<Board> boards = boardMapper.selectList(
            new LambdaQueryWrapper<Board>().eq(Board::getProjectId, p.getId()).eq(Board::getArchived, false));
        List<Map<String, Object>> boardSummaries = new ArrayList<>();
        for (Board b : boards) {
            Map<String, Object> bs = new HashMap<>();
            bs.put("id", b.getId());
            bs.put("name", b.getName());
            bs.put("type", b.getType());
            bs.put("starred", isStarred(userId, b.getId()));
            boardSummaries.add(bs);
        }
        pm.put("boards", boardSummaries);
        return pm;
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
}
