package com.scrum.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scrum.entity.Board;
import com.scrum.entity.Card;
import com.scrum.entity.Project;
import com.scrum.mapper.BoardMapper;
import com.scrum.mapper.CardMapper;
import com.scrum.mapper.ProjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class WorkspaceService {
    @Autowired private CardMapper cardMapper;
    @Autowired private BoardMapper boardMapper;
    @Autowired private ProjectMapper projectMapper;
    @Autowired private JdbcTemplate jdbcTemplate;

    public Map<String, Object> getDashboard(Long userId) {
        Map<String, Object> result = new HashMap<>();

        List<Card> tasks = cardMapper.selectList(
            new LambdaQueryWrapper<Card>().eq(Card::getDeleted, false)
                .inSql(Card::getId, "SELECT card_id FROM card_members WHERE user_id = " + userId)
                .last("LIMIT 20"));
        result.put("recentTasks", tasks);

        result.put("starredBoards", jdbcTemplate.queryForList(
            "SELECT b.id, b.name, p.name as projectName FROM starred_boards sb " +
            "JOIN boards b ON sb.board_id = b.id JOIN projects p ON b.project_id = p.id WHERE sb.user_id = ?",
            userId));

        result.put("recentVisits", jdbcTemplate.queryForList(
            "SELECT id, target_type as type, target_id as targetId, name, visited_at as visitedAt " +
            "FROM recent_visits WHERE user_id = ? ORDER BY visited_at DESC LIMIT 50", userId));

        result.put("activities", jdbcTemplate.queryForList(
            "SELECT al.id, al.user_id as userId, u.display_name as userName, al.action, " +
            "c.title as cardTitle, al.board_id as boardId, al.created_at as createdAt " +
            "FROM activity_logs al JOIN users u ON al.user_id = u.id " +
            "LEFT JOIN cards c ON al.card_id = c.id ORDER BY al.created_at DESC LIMIT 20"));

        return result;
    }

    public List<Map<String, Object>> getProjects() {
        List<Project> projects = projectMapper.selectList(null);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Project p : projects) {
            Map<String, Object> pm = new HashMap<>();
            pm.put("id", p.getId()); pm.put("name", p.getName()); pm.put("description", p.getDescription());
            List<Board> boards = boardMapper.selectList(
                new LambdaQueryWrapper<Board>().eq(Board::getProjectId, p.getId()).eq(Board::getArchived, false));
            List<Map<String, Object>> boardSummaries = new ArrayList<>();
            for (Board b : boards) {
                Map<String, Object> bs = new HashMap<>();
                bs.put("id", b.getId()); bs.put("name", b.getName()); bs.put("type", b.getType());
                bs.put("cardCount", cardMapper.selectCount(
                    new LambdaQueryWrapper<Card>().eq(Card::getBoardId, b.getId()).eq(Card::getDeleted, false)));
                bs.put("startDate", b.getStartDate()); bs.put("endDate", b.getEndDate());
                boardSummaries.add(bs);
            }
            pm.put("boards", boardSummaries);
            result.add(pm);
        }
        return result;
    }
}
