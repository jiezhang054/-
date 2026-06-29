package com.scrum.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scrum.entity.Team;
import com.scrum.entity.User;
import com.scrum.mapper.TeamMapper;
import com.scrum.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import java.util.*;

@Service
public class TeamService {
    @Autowired private TeamMapper teamMapper;
    @Autowired private UserMapper userMapper;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private PermissionService permissionService;

    public List<Map<String, Object>> listForUser(Long userId) {
        return jdbcTemplate.query(
            "SELECT t.id, t.name, t.description, t.avatar, t.owner_id as ownerId, tm.role " +
            "FROM teams t JOIN team_members tm ON t.id = tm.team_id AND tm.user_id = ? " +
            "WHERE (t.archived IS NULL OR t.archived = FALSE) ORDER BY t.name",
            (rs, i) -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", rs.getLong("id"));
                m.put("name", rs.getString("name"));
                m.put("description", rs.getString("description"));
                m.put("avatar", rs.getString("avatar"));
                m.put("ownerId", rs.getLong("ownerId"));
                m.put("role", rs.getString("role"));
                return m;
            }, userId);
    }

    public Map<String, Object> getContext(Long userId) {
        Map<String, Object> ctx = new HashMap<>();
        List<Map<String, Object>> teams = listForUser(userId);
        ctx.put("teams", teams);
        Long currentTeamId = permissionService.getCurrentTeamId(userId);
        if (currentTeamId == null && !teams.isEmpty()) {
            currentTeamId = ((Number) teams.get(0).get("id")).longValue();
            permissionService.setCurrentTeamId(userId, currentTeamId);
        }
        ctx.put("currentTeamId", currentTeamId);
        return ctx;
    }

    public Map<String, Object> getById(Long teamId, Long userId) {
        permissionService.ensureTeamMember(teamId, userId);
        Team t = teamMapper.selectById(teamId);
        if (t == null) throw new IllegalArgumentException("团队不存在");
        Map<String, Object> m = new HashMap<>();
        m.put("id", t.getId());
        m.put("name", t.getName());
        m.put("description", t.getDescription());
        m.put("avatar", t.getAvatar());
        m.put("ownerId", t.getOwnerId());
        m.put("role", permissionService.resolveTeamRole(teamId, userId));
        m.put("memberCount", jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM team_members WHERE team_id = ?", Integer.class, teamId));
        return m;
    }

    @Transactional
    public Map<String, Object> create(Long userId, String name, String description) {
        if (!StringUtils.hasText(name)) throw new IllegalArgumentException("团队名称不能为空");
        Team team = new Team();
        team.setName(name.trim());
        team.setDescription(description);
        team.setOwnerId(userId);
        team.setArchived(false);
        team.setSlug(name.trim().toLowerCase().replaceAll("\\s+", "-"));
        teamMapper.insert(team);

        jdbcTemplate.update("INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, 'ADMIN')",
            team.getId(), userId);
        permissionService.setCurrentTeamId(userId, team.getId());

        return getById(team.getId(), userId);
    }

    @Transactional
    public Map<String, Object> update(Long teamId, Long userId, String name, String description) {
        permissionService.ensureTeamManager(teamId, userId);
        Team team = teamMapper.selectById(teamId);
        if (team == null) throw new IllegalArgumentException("团队不存在");
        if (StringUtils.hasText(name)) team.setName(name.trim());
        if (description != null) team.setDescription(description);
        teamMapper.updateById(team);
        return getById(teamId, userId);
    }

    @Transactional
    public void delete(Long teamId, Long userId) {
        permissionService.ensureTeamAdmin(teamId, userId);
        Integer projectCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM projects WHERE team_id = ? AND (archived IS NULL OR archived = FALSE)",
            Integer.class, teamId);
        if (projectCount != null && projectCount > 0) {
            throw new IllegalArgumentException("请先归档或删除团队下所有项目");
        }
        jdbcTemplate.update("DELETE FROM team_members WHERE team_id = ?", teamId);
        jdbcTemplate.update("UPDATE user_preferences SET current_team_id = NULL WHERE current_team_id = ?", teamId);
        teamMapper.deleteById(teamId);
    }

    public List<Map<String, Object>> listMembers(Long teamId, Long userId) {
        permissionService.ensureTeamMember(teamId, userId);
        return jdbcTemplate.query(
            "SELECT u.id, u.username, u.display_name as displayName, u.email, u.avatar, tm.role " +
            "FROM team_members tm JOIN users u ON tm.user_id = u.id WHERE tm.team_id = ? " +
            "ORDER BY CASE tm.role WHEN 'ADMIN' THEN 0 WHEN 'OWNER' THEN 1 ELSE 2 END, u.display_name",
            (rs, i) -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", rs.getLong("id"));
                m.put("username", rs.getString("username"));
                m.put("displayName", rs.getString("displayName"));
                m.put("email", rs.getString("email"));
                m.put("avatar", rs.getString("avatar"));
                m.put("role", rs.getString("role"));
                return m;
            }, teamId);
    }

    @Transactional
    public Map<String, Object> inviteMember(Long teamId, Long userId, String identifier, String role) {
        permissionService.ensureTeamManager(teamId, userId);
        if (!StringUtils.hasText(identifier)) throw new IllegalArgumentException("请输入用户名或邮箱");
        String r = StringUtils.hasText(role) ? role.toUpperCase() : "MEMBER";
        if (!Set.of("ADMIN", "OWNER", "MEMBER").contains(r)) throw new IllegalArgumentException("无效的角色");
        if ("ADMIN".equals(r)) permissionService.ensureTeamAdmin(teamId, userId);

        List<User> users = userMapper.selectList(new LambdaQueryWrapper<User>()
            .eq(User::getUsername, identifier.trim()).or().eq(User::getEmail, identifier.trim()));
        if (users.isEmpty()) throw new IllegalArgumentException("用户不存在");
        User target = users.get(0);

        Integer exists = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM team_members WHERE team_id = ? AND user_id = ?",
            Integer.class, teamId, target.getId());
        if (exists != null && exists > 0) throw new IllegalArgumentException("用户已是团队成员");

        jdbcTemplate.update("INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)",
            teamId, target.getId(), r);

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
    public void removeMember(Long teamId, Long userId, Long memberId) {
        permissionService.ensureTeamManager(teamId, userId);
        if (userId.equals(memberId)) throw new IllegalArgumentException("不能移除自己");
        String targetRole = permissionService.resolveTeamRole(teamId, memberId);
        String actorRole = permissionService.resolveTeamRole(teamId, userId);
        if ("ADMIN".equals(targetRole) && !"ADMIN".equals(actorRole)) {
            throw new IllegalArgumentException("无法移除团队最高管理员");
        }
        if ("ADMIN".equals(targetRole)) permissionService.ensureTeamAdmin(teamId, userId);
        jdbcTemplate.update("DELETE FROM team_members WHERE team_id = ? AND user_id = ?", teamId, memberId);
    }

    @Transactional
    public void updateMemberRole(Long teamId, Long userId, Long memberId, String role) {
        permissionService.ensureTeamManager(teamId, userId);
        if (!StringUtils.hasText(role)) throw new IllegalArgumentException("角色不能为空");
        String r = role.toUpperCase();
        if (!Set.of("ADMIN", "OWNER", "MEMBER").contains(r)) throw new IllegalArgumentException("无效的角色");
        if ("ADMIN".equals(r) || "ADMIN".equals(permissionService.resolveTeamRole(teamId, memberId))) {
            permissionService.ensureTeamAdmin(teamId, userId);
        }
        jdbcTemplate.update("UPDATE team_members SET role = ? WHERE team_id = ? AND user_id = ?",
            r, teamId, memberId);
        if ("ADMIN".equals(r)) {
            Team team = teamMapper.selectById(teamId);
            if (team != null) {
                team.setOwnerId(memberId);
                teamMapper.updateById(team);
            }
        }
    }

    public void switchContext(Long userId, Long teamId) {
        permissionService.setCurrentTeamId(userId, teamId);
    }
}
