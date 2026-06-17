package com.scrum.config;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scrum.entity.User;
import com.scrum.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    @Autowired private UserMapper userMapper;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        seedUsers();
        if (jdbcTemplate.queryForObject("SELECT COUNT(*) FROM projects", Integer.class) == 0) {
            seedDemoProject();
        }
    }

    private void seedUsers() {
        createUserIfAbsent("zhang", "张茗杰", "zhang@example.com");
        createUserIfAbsent("yin", "殷浩然", "yin@example.com");
        createUserIfAbsent("zhong", "钟礼豪", "zhong@example.com");
        createUserIfAbsent("zang", "臧传杨", "zang@example.com");
    }

    private void createUserIfAbsent(String username, String displayName, String email) {
        User existing = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username));
        if (existing != null) {
            if (existing.getPassword() == null || existing.getPassword().length() < 20) {
                existing.setPassword(passwordEncoder.encode("123456"));
                userMapper.updateById(existing);
            }
            return;
        }
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode("123456"));
        user.setDisplayName(displayName);
        user.setEmail(email);
        user.setBackground("default");
        user.setLocale("zh-CN");
        userMapper.insert(user);
    }

    private void seedDemoProject() {
        User zhong = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, "zhong"));
        if (zhong == null) return;
        Long ownerId = zhong.getId();

        jdbcTemplate.update("INSERT INTO projects (id, name, description, owner_id, template) VALUES (1, ?, ?, ?, ?)",
            "电商重构项目", "敏捷重构电商平台核心模块", ownerId, "SCRUM");

        for (String[] member : new String[][]{{"zhang", "MEMBER"}, {"yin", "MEMBER"}, {"zhong", "OWNER"}, {"zang", "MEMBER"}}) {
            User u = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, member[0]));
            if (u != null) {
                jdbcTemplate.update("INSERT INTO project_members (project_id, user_id, role) VALUES (1, ?, ?)", u.getId(), member[1]);
            }
        }

        insertBoard(1, "产品路线图", "ROADMAP", false, null, null);
        insertBoard(2, "里程碑 V1.0", "MILESTONE", true, null, null);
        insertBoard(3, "Sprint 1", "SPRINT", true, "2026-06-01", "2026-06-14");
        insertBoard(4, "Sprint 2", "SPRINT", false, "2026-06-15", "2026-06-28");

        insertColumns(1, new String[]{"史诗故事池", "规划中", "进行中", "已完成"});
        insertColumns(2, new String[]{"用户故事池", "用户故事-待梳理", "用户故事-梳理完成"});
        insertColumns(3, new String[]{"待办", "进行中", "测试中", "已完成"});
        insertColumns(4, new String[]{"待办", "进行中", "已完成"});

        insertSwimlane(2, 1, "用户中心模块");
        insertSwimlane(2, 2, "交易系统模块");
        insertSwimlane(3, 1, "登录功能");
        insertSwimlane(3, 2, "支付模块");

        insertCard(1, 1, 101, null, "用户中心重构", "EPIC", 8, 0);
        insertCard(2, 1, 101, null, "交易系统升级", "EPIC", 13, 1);
        insertCard(3, 2, 201, 1L, "实现用户登录", "USER_STORY", 5, 0);
        insertCard(4, 2, 202, 1L, "JWT 认证集成", "TASK", 3, 0);
        insertCard(5, 3, 301, 1L, "支付接口联调", "TASK", 5, 0);
        insertCard(6, 3, 302, 1L, "修复登录超时", "BUG", 2, 1);

        jdbcTemplate.update("INSERT INTO card_members (card_id, user_id) VALUES (3, ?)", ownerId);
        jdbcTemplate.update("INSERT INTO card_members (card_id, user_id) VALUES (4, ?)", ownerId);
        jdbcTemplate.update("INSERT INTO card_members (card_id, user_id) VALUES (5, ?)", ownerId);

        jdbcTemplate.update("INSERT INTO starred_boards (user_id, board_id) VALUES (?, 2)", ownerId);
        jdbcTemplate.update("INSERT INTO starred_boards (user_id, board_id) VALUES (?, 3)", ownerId);

        jdbcTemplate.update(
            "INSERT INTO recent_visits (user_id, target_type, target_id, name) VALUES (?, 'board', 3, 'Sprint 1')", ownerId);
        jdbcTemplate.update(
            "INSERT INTO activity_logs (user_id, action, card_id, board_id) VALUES (?, '移动了卡片', 5, 3)", ownerId);
        jdbcTemplate.update(
            "INSERT INTO activity_logs (user_id, action, card_id, board_id) VALUES (?, '创建了卡片', 6, 3)", ownerId);

        jdbcTemplate.update(
            "INSERT INTO notifications (user_id, type, title, content, link_type, link_id, read_flag) VALUES (?, 'ASSIGN', '卡片指派', '您被指派到卡片「支付接口联调」', 'board', 3, FALSE)",
            ownerId);
        jdbcTemplate.update(
            "INSERT INTO notifications (user_id, type, title, content, link_type, link_id, read_flag) VALUES (?, 'MENTION', '@提醒', '殷浩然在评论中提到了您', 'board', 3, FALSE)",
            ownerId);
        jdbcTemplate.update(
            "INSERT INTO notifications (user_id, type, title, content, link_type, link_id, read_flag) VALUES (?, 'SPRINT', 'Sprint 提醒', 'Sprint 1 将于 3 天后结束', 'board', 3, TRUE)",
            ownerId);
    }

    private void insertBoard(long id, String name, String type, boolean swimlanes, String start, String end) {
        jdbcTemplate.update(
            "INSERT INTO boards (id, name, type, project_id, swimlanes_enabled, start_date, end_date, visibility, archived) " +
            "VALUES (?, ?, ?, 1, ?, ?, ?, 'PROJECT', FALSE)",
            id, name, type, swimlanes, start, end);
    }

    private void insertColumns(long boardId, String[] names) {
        for (int i = 0; i < names.length; i++) {
            long colId = boardId * 100 + i + 1;
            jdbcTemplate.update("INSERT INTO board_columns (id, board_id, name, sort_order) VALUES (?, ?, ?, ?)",
                colId, boardId, names[i], i);
        }
    }

    private void insertSwimlane(long boardId, int order, String name) {
        jdbcTemplate.update("INSERT INTO swimlanes (board_id, name, sort_order) VALUES (?, ?, ?)",
            boardId, name, order);
    }

    private void insertCard(long id, long boardId, long columnId, Long swimlaneId,
                            String title, String type, int workload, int sortOrder) {
        jdbcTemplate.update(
            "INSERT INTO cards (id, board_id, column_id, swimlane_id, title, type, sort_order, workload, version, deleted) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, FALSE)",
            id, boardId, columnId, swimlaneId, title, type, sortOrder, workload);
    }
}
