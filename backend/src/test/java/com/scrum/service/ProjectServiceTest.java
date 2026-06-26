package com.scrum.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scrum.entity.Board;
import com.scrum.entity.User;
import com.scrum.mapper.BoardMapper;
import com.scrum.mapper.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class ProjectServiceTest {
    @Autowired private ProjectService projectService;
    @Autowired private UserMapper userMapper;
    @Autowired private BoardMapper boardMapper;

    private Long zhongId;

    @BeforeEach
    void setUp() {
        User zhong = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, "zhong"));
        assertNotNull(zhong);
        zhongId = zhong.getId();
    }

    @Test
    void getProjectDetailWithBoardsAndTabs() {
        Map<String, Object> project = projectService.getById(1L, zhongId);
        assertEquals("电商重构项目", project.get("name"));
        assertEquals("OWNER", project.get("role"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> boards = (List<Map<String, Object>>) project.get("boards");
        assertFalse(boards.isEmpty());
        assertTrue(boards.stream().anyMatch(b -> Boolean.TRUE.equals(b.get("starred"))));
        assertTrue(boards.stream().allMatch(b -> b.containsKey("cardCount")));
        assertTrue(boards.stream().allMatch(b -> b.containsKey("completed")));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> tabs = (List<Map<String, Object>>) project.get("tabs");
        assertFalse(tabs.isEmpty());
        assertNotNull(project.get("mindmapId"));
    }

    @Test
    void createUpdateAndStats() {
        Map<String, Object> created = projectService.create(zhongId, "测试项目", "描述", "SCRUM", null);
        Long projectId = ((Number) created.get("id")).longValue();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> boards = (List<Map<String, Object>>) created.get("boards");
        assertEquals(5, boards.size());
        assertTrue(boards.stream().anyMatch(b -> "ROADMAP".equals(b.get("type"))));
        assertTrue(boards.stream().anyMatch(b -> "MILESTONE".equals(b.get("type"))));
        assertTrue(boards.stream().anyMatch(b -> "SPRINT".equals(b.get("type"))));
        assertTrue(boards.stream().anyMatch(b -> "DEFECT".equals(b.get("type"))));
        assertTrue(boards.stream().anyMatch(b -> "RETROSPECTIVE".equals(b.get("type"))));

        Map<String, Object> updated = projectService.update(projectId, zhongId, "测试项目2", "新描述");
        assertEquals("测试项目2", updated.get("name"));

        Map<String, Object> stats = projectService.getStats(projectId, zhongId);
        assertNotNull(stats.get("backlogProgress"));
        assertNotNull(stats.get("sprintStats"));
    }

    @Test
    void memberManagement() {
        User yin = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, "yin"));
        assertNotNull(yin);

        List<Map<String, Object>> members = projectService.listMembers(1L, zhongId);
        assertTrue(members.size() >= 2);

        Map<String, Object> project = projectService.create(zhongId, "成员测试", null, "LIGHT", null);
        Long projectId = ((Number) project.get("id")).longValue();

        Map<String, Object> invited = projectService.inviteMember(projectId, zhongId, "yin", "MEMBER");
        assertEquals("yin", invited.get("username"));

        projectService.updateMemberRole(projectId, zhongId, yin.getId(), "READONLY");
        members = projectService.listMembers(projectId, zhongId);
        assertTrue(members.stream().anyMatch(m -> "READONLY".equals(m.get("role")) && yin.getId().equals(m.get("id"))));

        projectService.removeMember(projectId, zhongId, yin.getId());
        members = projectService.listMembers(projectId, zhongId);
        assertTrue(members.stream().noneMatch(m -> yin.getId().equals(m.get("id"))));
    }

    @Test
    void repairIncompleteScrumTemplate() {
        Map<String, Object> created = projectService.create(zhongId, "残缺模板项目", "描述", "SCRUM", null);
        Long projectId = ((Number) created.get("id")).longValue();

        Board roadmap = boardMapper.selectOne(new LambdaQueryWrapper<Board>()
            .eq(Board::getProjectId, projectId).eq(Board::getType, "ROADMAP"));
        assertNotNull(roadmap);
        boardMapper.delete(new LambdaQueryWrapper<Board>()
            .eq(Board::getProjectId, projectId).ne(Board::getId, roadmap.getId()));

        Map<String, Object> repaired = projectService.getById(projectId, zhongId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> boards = (List<Map<String, Object>>) repaired.get("boards");
        assertEquals(5, boards.size());
    }

    @Test
    void reorderBoards() {
        Map<String, Object> project = projectService.getById(1L, zhongId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> boards = (List<Map<String, Object>>) project.get("boards");
        List<Long> reversed = boards.stream()
            .map(b -> ((Number) b.get("id")).longValue())
            .sorted((a, b) -> Long.compare(b, a))
            .toList();

        projectService.reorderBoards(1L, zhongId, reversed);

        Map<String, Object> after = projectService.getById(1L, zhongId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> reordered = (List<Map<String, Object>>) after.get("boards");
        assertEquals(reversed.get(0), ((Number) reordered.get(0).get("id")).longValue());
    }

    @Test
    void archiveRestoreAndListArchived() {
        Map<String, Object> project = projectService.create(zhongId, "归档测试", null, "LIGHT", null);
        Long projectId = ((Number) project.get("id")).longValue();

        projectService.archive(projectId, zhongId);
        Map<String, Object> archivedProject = projectService.getById(projectId, zhongId);
        assertTrue(Boolean.TRUE.equals(archivedProject.get("archived")));

        List<Map<String, Object>> active = projectService.listForUser(zhongId, null);
        assertTrue(active.stream().noneMatch(p -> projectId.equals(((Number) p.get("id")).longValue())));

        List<Map<String, Object>> archived = projectService.listArchived(zhongId);
        assertTrue(archived.stream().anyMatch(p -> projectId.equals(((Number) p.get("id")).longValue())));

        projectService.restore(projectId, zhongId);
        Map<String, Object> restored = projectService.getById(projectId, zhongId);
        assertEquals("归档测试", restored.get("name"));
        assertFalse(Boolean.TRUE.equals(restored.get("archived")));
    }
}
