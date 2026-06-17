package com.scrum.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scrum.entity.User;
import com.scrum.mapper.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.Collections;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class MyBoardsServiceTest {
    @Autowired private MyBoardsService myBoardsService;
    @Autowired private UserMapper userMapper;
    @Autowired private MindmapService mindmapService;
    @Autowired private JdbcTemplate jdbcTemplate;

    private Long zhongId;

    @BeforeEach
    void setUp() {
        User zhong = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, "zhong"));
        assertNotNull(zhong);
        zhongId = zhong.getId();
    }

    @Test
    void listBoardsWithFilterAndSort() {
        List<Map<String, Object>> boards = myBoardsService.listBoards(zhongId, null, "name", "asc");
        assertFalse(boards.isEmpty());
        assertTrue(boards.stream().allMatch(b -> b.containsKey("projectName")));
        assertTrue(boards.stream().allMatch(b -> b.containsKey("starred")));

        List<Map<String, Object>> incomplete = myBoardsService.listBoards(zhongId, "incomplete", "custom", "desc");
        assertNotNull(incomplete);
    }

    @Test
    void reorderAndRenameBoard() {
        List<Map<String, Object>> boards = myBoardsService.listBoards(zhongId, null, "custom", "desc");
        List<Long> ids = boards.stream().map(b -> ((Number) b.get("id")).longValue()).toList();
        List<Long> reversed = new ArrayList<>(ids);
        Collections.reverse(reversed);
        myBoardsService.reorderBoards(zhongId, reversed);

        Long boardId = ids.get(0);
        myBoardsService.renameBoard(zhongId, boardId, "重命名测试看板");
        Map<String, Object> copied = myBoardsService.copyBoard(zhongId, boardId);
        assertNotNull(copied.get("id"));
    }

    @Test
    void createBoardWithoutProject() {
        Map<String, Object> board = myBoardsService.createBoard(zhongId, "个人测试看板", "NORMAL", null);
        assertNotNull(board.get("id"));
        List<Map<String, Object>> boards = myBoardsService.listBoards(zhongId, null, "name", "asc");
        assertTrue(boards.stream().anyMatch(b -> "个人测试看板".equals(b.get("name"))));
    }

    @Test
    void mindmapCrud() {
        List<Map<String, Object>> list = mindmapService.listForUser(zhongId, null, "name", "asc");
        assertFalse(list.isEmpty());

        Map<String, Object> created = mindmapService.create(zhongId, "测试脑图", 1L, "{}");
        Long id = ((Number) created.get("id")).longValue();
        mindmapService.rename(id, zhongId, "重命名脑图");
        Map<String, Object> copied = mindmapService.copy(id, zhongId);
        assertNotNull(copied.get("id"));
        mindmapService.archive(id, zhongId);
        List<Map<String, Object>> archived = mindmapService.listArchived(zhongId);
        assertTrue(archived.stream().anyMatch(m -> id.equals(((Number) m.get("id")).longValue())));
        mindmapService.restore(id, zhongId);
        List<Map<String, Object>> active = mindmapService.listForUser(zhongId, null, "name", "asc");
        assertTrue(active.stream().anyMatch(m -> id.equals(((Number) m.get("id")).longValue())));
    }

    @Test
    void createBoardWithoutProjectAndAddMembers() {
        Map<String, Object> board = myBoardsService.createBoard(zhongId, "成员测试看板", "NORMAL", 1L, true);
        assertNotNull(board.get("id"));
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM board_members WHERE board_id = ?",
            Integer.class, ((Number) board.get("id")).longValue());
        assertTrue(count != null && count > 0);
    }
}
