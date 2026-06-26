package com.scrum.service;

import com.scrum.entity.Board;
import com.scrum.entity.Project;
import com.scrum.entity.User;
import com.scrum.mapper.BoardMapper;
import com.scrum.mapper.ProjectMapper;
import com.scrum.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ActivityLogService {
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private BoardMapper boardMapper;
    @Autowired private ProjectMapper projectMapper;
    @Autowired private UserMapper userMapper;

    /** 记录活动；卡片相关操作在团队项目下会通知全体团队成员 */
    public void record(Long userId, Long boardId, Long cardId, String action) {
        jdbcTemplate.update(
            "INSERT INTO activity_logs (user_id, action, card_id, board_id) VALUES (?, ?, ?, ?)",
            userId, action, cardId, boardId);
        if (cardId != null) {
            notifyTeamMembers(userId, boardId, action);
        }
    }

    /** 看板级操作（不涉及具体卡片），仅写活动日志 */
    public void recordBoardEvent(Long userId, Long boardId, String action) {
        jdbcTemplate.update(
            "INSERT INTO activity_logs (user_id, action, card_id, board_id) VALUES (?, ?, NULL, ?)",
            userId, action, boardId);
    }

    /** 批量卡片操作：写一条活动日志并通知团队 */
    public void recordTeamCardBatch(Long userId, Long boardId, String action) {
        jdbcTemplate.update(
            "INSERT INTO activity_logs (user_id, action, card_id, board_id) VALUES (?, ?, NULL, ?)",
            userId, action, boardId);
        notifyTeamMembers(userId, boardId, action);
    }

    private void notifyTeamMembers(Long actorId, Long boardId, String action) {
        Board board = boardMapper.selectById(boardId);
        if (board == null) return;
        Project project = projectMapper.selectById(board.getProjectId());
        if (project == null || project.getTeamId() == null) return;

        User actor = userMapper.selectById(actorId);
        String actorName = actor != null ? actor.getDisplayName() : "某成员";
        String content = actorName + " " + action;

        List<Long> memberIds = jdbcTemplate.queryForList(
            "SELECT user_id FROM team_members WHERE team_id = ? AND user_id <> ?",
            Long.class, project.getTeamId(), actorId);

        for (Long memberId : memberIds) {
            jdbcTemplate.update(
                "INSERT INTO notifications (user_id, type, title, content, link_type, link_id, read_flag) " +
                "VALUES (?, 'TEAM_ACTIVITY', '团队看板动态', ?, 'board', ?, FALSE)",
                memberId, content, boardId);
        }
    }
}
