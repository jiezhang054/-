package com.scrum.service;

import com.scrum.entity.Board;
import com.scrum.entity.Project;
import com.scrum.mapper.BoardMapper;
import com.scrum.mapper.ProjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class PermissionService {
    private static final Set<String> TEAM_ROLES = Set.of("ADMIN", "OWNER", "MEMBER");
    private static final Set<String> PROJECT_WRITE_ROLES = Set.of("OWNER", "MEMBER");
    private static final Set<String> BOARD_WRITE_ROLES = Set.of("ADMIN", "MEMBER", "OWNER");

    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private ProjectMapper projectMapper;
    @Autowired private BoardMapper boardMapper;
    @Autowired private BoardChainService boardChainService;

    public int teamLevel(String role) {
        if (role == null) return 0;
        return switch (role.toUpperCase()) {
            case "ADMIN" -> 3;
            case "OWNER" -> 2;
            case "MEMBER" -> 1;
            default -> 0;
        };
    }

    public String resolveTeamRole(Long teamId, Long userId) {
        if (teamId == null || userId == null) return null;
        List<String> roles = jdbcTemplate.queryForList(
            "SELECT role FROM team_members WHERE team_id = ? AND user_id = ?", String.class, teamId, userId);
        return roles.isEmpty() ? null : roles.get(0);
    }

    public String resolveProjectRole(Long projectId, Long userId) {
        if (projectId == null || userId == null) return null;
        List<String> roles = jdbcTemplate.queryForList(
            "SELECT role FROM project_members WHERE project_id = ? AND user_id = ?", String.class, projectId, userId);
        return roles.isEmpty() ? null : roles.get(0);
    }

    public String resolveBoardRole(Long boardId, Long userId) {
        if (boardId == null || userId == null) return null;
        Board board = boardMapper.selectById(boardId);
        if (board == null) return null;

        List<String> boardRoles = jdbcTemplate.queryForList(
            "SELECT role FROM board_members WHERE board_id = ? AND user_id = ?", String.class, boardId, userId);
        if (!boardRoles.isEmpty()) return boardRoles.get(0);

        String projectRole = resolveProjectRole(board.getProjectId(), userId);
        if (projectRole == null) return null;
        if ("READONLY".equals(projectRole)) return "READONLY";
        if ("OWNER".equals(projectRole)) return "ADMIN";
        return "MEMBER";
    }

    public void ensureTeamMember(Long teamId, Long userId) {
        if (resolveTeamRole(teamId, userId) == null) {
            throw new IllegalArgumentException("无权访问该团队");
        }
    }

    public void ensureTeamManager(Long teamId, Long userId) {
        String role = resolveTeamRole(teamId, userId);
        if (teamLevel(role) < 2) throw new IllegalArgumentException("需要团队管理员或所有者权限");
    }

    public void ensureTeamAdmin(Long teamId, Long userId) {
        if (!"ADMIN".equals(resolveTeamRole(teamId, userId))) {
            throw new IllegalArgumentException("需要团队最高管理员权限");
        }
    }

    public void ensureProjectRead(Long projectId, Long userId) {
        if (resolveProjectRole(projectId, userId) == null) {
            throw new IllegalArgumentException("无权访问该项目");
        }
    }

    public void ensureProjectWrite(Long projectId, Long userId) {
        ensureProjectRead(projectId, userId);
        String role = resolveProjectRole(projectId, userId);
        if (role == null || !PROJECT_WRITE_ROLES.contains(role)) {
            throw new IllegalArgumentException("只读成员无法修改项目");
        }
    }

    public void ensureBoardRead(Long boardId, Long userId) {
        Board board = boardMapper.selectById(boardId);
        if (board == null) throw new IllegalArgumentException("看板不存在");

        String visibility = board.getVisibility() != null ? board.getVisibility() : "PROJECT";
        String boardRole = resolveBoardRole(boardId, userId);
        String projectRole = resolveProjectRole(board.getProjectId(), userId);

        if ("PRIVATE".equals(visibility)) {
            Integer bm = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM board_members WHERE board_id = ? AND user_id = ?",
                Integer.class, boardId, userId);
            if (bm == null || bm == 0) throw new IllegalArgumentException("无权访问该看板");
            return;
        }

        if (projectRole != null) return;
        throw new IllegalArgumentException("无权访问该看板");
    }

    public void ensureBoardWrite(Long boardId, Long userId) {
        ensureBoardRead(boardId, userId);
        String role = resolveBoardRole(boardId, userId);
        if (role == null || !BOARD_WRITE_ROLES.contains(role)) {
            throw new IllegalArgumentException("只读成员无法修改看板");
        }
        String projectRole = resolveProjectRole(boardMapper.selectById(boardId).getProjectId(), userId);
        if ("READONLY".equals(projectRole)) {
            throw new IllegalArgumentException("项目只读成员无法修改看板");
        }
        if (boardChainService.isChainLocked(boardId)) {
            String msg = boardChainService.getChainLockMessage(boardId);
            throw new IllegalArgumentException(msg != null ? msg : "上级看板尚未完成，当前看板只读");
        }
    }

    public boolean canWriteBoard(Long boardId, Long userId) {
        try {
            ensureBoardWrite(boardId, userId);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    public Map<String, Object> getBoardPermissions(Long boardId, Long userId) {
        Map<String, Object> p = new HashMap<>();
        Board board = boardMapper.selectById(boardId);
        boolean roleWrite = canWriteByRole(boardId, userId);
        boolean chainLocked = boardChainService.isChainLocked(boardId);
        p.put("canRead", true);
        p.put("canWrite", roleWrite && !chainLocked);
        p.put("chainLocked", chainLocked);
        p.put("chainMessage", boardChainService.getChainLockMessage(boardId));
        p.put("role", resolveBoardRole(boardId, userId));
        p.put("projectRole", board != null ? resolveProjectRole(board.getProjectId(), userId) : null);
        return p;
    }

    private boolean canWriteByRole(Long boardId, Long userId) {
        try {
            ensureBoardRead(boardId, userId);
            String role = resolveBoardRole(boardId, userId);
            if (role == null || !BOARD_WRITE_ROLES.contains(role)) return false;
            Board board = boardMapper.selectById(boardId);
            if (board == null) return false;
            String projectRole = resolveProjectRole(board.getProjectId(), userId);
            return !"READONLY".equals(projectRole);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    public Long getCurrentTeamId(Long userId) {
        List<Long> ids = jdbcTemplate.queryForList(
            "SELECT current_team_id FROM user_preferences WHERE user_id = ?", Long.class, userId);
        return ids.isEmpty() ? null : ids.get(0);
    }

    public void setCurrentTeamId(Long userId, Long teamId) {
        if (teamId != null) ensureTeamMember(teamId, userId);
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM user_preferences WHERE user_id = ?", Integer.class, userId);
        if (count != null && count > 0) {
            jdbcTemplate.update("UPDATE user_preferences SET current_team_id = ? WHERE user_id = ?", teamId, userId);
        } else {
            jdbcTemplate.update("INSERT INTO user_preferences (user_id, current_team_id) VALUES (?, ?)", userId, teamId);
        }
    }
}
