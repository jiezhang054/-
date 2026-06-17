package com.scrum.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scrum.dto.BoardDetailDTO;
import com.scrum.entity.*;
import com.scrum.mapper.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BoardService {
    @Autowired private BoardMapper boardMapper;
    @Autowired private BoardColumnMapper columnMapper;
    @Autowired private SwimlaneMapper swimlaneMapper;
    @Autowired private CardMapper cardMapper;
    @Autowired private ProjectMapper projectMapper;
    @Autowired private JdbcTemplate jdbcTemplate;

    public BoardDetailDTO getBoardDetail(Long boardId, Long userId) {
        Board board = boardMapper.selectById(boardId);
        if (board == null) throw new RuntimeException("看板不存在");

        Project project = projectMapper.selectById(board.getProjectId());
        BoardDetailDTO dto = new BoardDetailDTO();
        dto.setId(board.getId());
        dto.setName(board.getName());
        dto.setType(board.getType());
        dto.setProjectId(board.getProjectId());
        dto.setProjectName(project != null ? project.getName() : null);
        dto.setParentBoardId(board.getParentBoardId());
        dto.setSwimlanesEnabled(board.getSwimlanesEnabled());
        dto.setStartDate(board.getStartDate() != null ? board.getStartDate().toString() : null);
        dto.setEndDate(board.getEndDate() != null ? board.getEndDate().toString() : null);

        if (userId != null) {
            List<Long> starred = jdbcTemplate.queryForList(
                "SELECT board_id FROM starred_boards WHERE user_id = ?", Long.class, userId);
            dto.setStarred(starred.contains(boardId));
        }

        dto.setColumns(columnMapper.selectList(
            new LambdaQueryWrapper<BoardColumn>().eq(BoardColumn::getBoardId, boardId)
                .orderByAsc(BoardColumn::getSortOrder)).stream().map(c -> {
            BoardDetailDTO.ColumnDTO col = new BoardDetailDTO.ColumnDTO();
            col.setId(c.getId()); col.setName(c.getName()); col.setSortOrder(c.getSortOrder());
            return col;
        }).collect(Collectors.toList()));

        dto.setSwimlanes(swimlaneMapper.selectList(
            new LambdaQueryWrapper<Swimlane>().eq(Swimlane::getBoardId, boardId)
                .orderByAsc(Swimlane::getSortOrder)).stream().map(s -> {
            BoardDetailDTO.SwimlaneDTO sl = new BoardDetailDTO.SwimlaneDTO();
            sl.setId(s.getId()); sl.setName(s.getName()); sl.setSortOrder(s.getSortOrder());
            return sl;
        }).collect(Collectors.toList()));

        List<Card> cards = cardMapper.selectList(
            new LambdaQueryWrapper<Card>().eq(Card::getBoardId, boardId).eq(Card::getDeleted, false)
                .orderByAsc(Card::getSortOrder));

        dto.setCards(cards.stream().map(c -> toCardDTO(c)).collect(Collectors.toList()));
        return dto;
    }

    private BoardDetailDTO.CardDTO toCardDTO(Card c) {
        BoardDetailDTO.CardDTO dto = new BoardDetailDTO.CardDTO();
        dto.setId(c.getId()); dto.setTitle(c.getTitle()); dto.setDescription(c.getDescription());
        dto.setType(c.getType()); dto.setColumnId(c.getColumnId()); dto.setSwimlaneId(c.getSwimlaneId());
        dto.setSortOrder(c.getSortOrder()); dto.setWorkload(c.getWorkload());
        dto.setDueDate(c.getDueDate() != null ? c.getDueDate().toString() : null);
        dto.setStartDate(c.getStartDate() != null ? c.getStartDate().toString() : null);
        dto.setIsReference(c.getIsReference()); dto.setSourceCardId(c.getSourceCardId());
        dto.setVersion(c.getVersion());

        dto.setMemberIds(jdbcTemplate.queryForList(
            "SELECT user_id FROM card_members WHERE card_id = ?", Long.class, c.getId()));
        dto.setLabels(jdbcTemplate.query(
            "SELECT id, name, color FROM card_labels WHERE card_id = ?",
            (rs, i) -> {
                BoardDetailDTO.LabelDTO l = new BoardDetailDTO.LabelDTO();
                l.setId(rs.getLong("id")); l.setName(rs.getString("name")); l.setColor(rs.getString("color"));
                return l;
            }, c.getId()));
        dto.setChecklist(jdbcTemplate.query(
            "SELECT id, text, done FROM card_checklist WHERE card_id = ? ORDER BY sort_order",
            (rs, i) -> {
                BoardDetailDTO.ChecklistDTO cl = new BoardDetailDTO.ChecklistDTO();
                cl.setId(rs.getLong("id")); cl.setText(rs.getString("text")); cl.setDone(rs.getBoolean("done"));
                return cl;
            }, c.getId()));
        dto.setComments(jdbcTemplate.query(
            "SELECT cc.id, cc.user_id, u.display_name, cc.content, cc.created_at FROM card_comments cc JOIN users u ON cc.user_id = u.id WHERE cc.card_id = ?",
            (rs, i) -> {
                BoardDetailDTO.CommentDTO cm = new BoardDetailDTO.CommentDTO();
                cm.setId(rs.getLong("id")); cm.setUserId(rs.getLong("user_id"));
                cm.setUserName(rs.getString("display_name")); cm.setContent(rs.getString("content"));
                cm.setCreatedAt(rs.getTimestamp("created_at").toString());
                return cm;
            }, c.getId()));

        if (Boolean.TRUE.equals(c.getIsReference()) && c.getSourceCardId() != null) {
            Card source = cardMapper.selectById(c.getSourceCardId());
            if (source != null) {
                Board sourceBoard = boardMapper.selectById(source.getBoardId());
                dto.setSourceBoardName(sourceBoard != null ? sourceBoard.getName() : null);
            }
        }
        return dto;
    }

    @Transactional
    public void updateCardPositions(Long boardId, List<Map<String, Object>> updates) {
        for (Map<String, Object> u : updates) {
            Long cardId = Long.valueOf(u.get("cardId").toString());
            Card card = cardMapper.selectById(cardId);
            if (card == null) continue;
            card.setColumnId(Long.valueOf(u.get("columnId").toString()));
            if (u.get("swimlaneId") != null) card.setSwimlaneId(Long.valueOf(u.get("swimlaneId").toString()));
            if (u.get("sortOrder") != null) card.setSortOrder(Integer.valueOf(u.get("sortOrder").toString()));
            card.setVersion(card.getVersion() + 1);
            cardMapper.updateById(card);
        }
    }

    @Transactional
    public BoardDetailDTO.CardDTO updateCard(Long cardId, Map<String, Object> updates) {
        Card card = cardMapper.selectById(cardId);
        if (card == null) throw new RuntimeException("卡片不存在");
        if (updates.containsKey("title")) card.setTitle((String) updates.get("title"));
        if (updates.containsKey("description")) card.setDescription((String) updates.get("description"));
        if (updates.containsKey("workload")) card.setWorkload(Integer.valueOf(updates.get("workload").toString()));
        card.setVersion(card.getVersion() + 1);
        cardMapper.updateById(card);

        // Sync references
        List<Card> refs = cardMapper.selectList(
            new LambdaQueryWrapper<Card>().eq(Card::getSourceCardId, cardId).eq(Card::getIsReference, true));
        for (Card ref : refs) {
            if (updates.containsKey("title")) ref.setTitle(card.getTitle());
            if (updates.containsKey("description")) ref.setDescription(card.getDescription());
            if (updates.containsKey("workload")) ref.setWorkload(card.getWorkload());
            cardMapper.updateById(ref);
        }
        return toCardDTO(card);
    }

    @Transactional
    public Map<String, Object> createBoard(Long projectId, String name, String type, String template) {
        return createBoard(projectId, name, type, template, false);
    }

    @Transactional
    public Map<String, Object> createBoard(Long projectId, String name, String type, String template, boolean addProjectMembers) {
        if (!StringUtils.hasText(name)) throw new IllegalArgumentException("看板名称不能为空");
        Board board = new Board();
        board.setName(name);
        board.setType(StringUtils.hasText(type) ? type : "NORMAL");
        board.setProjectId(projectId);
        board.setSwimlanesEnabled("MILESTONE".equals(board.getType()) || "SPRINT".equals(board.getType()));
        board.setVisibility("PROJECT");
        board.setArchived(false);
        boardMapper.insert(board);

        String[] columns = columnsForTemplate(template != null ? template : board.getType());
        for (int i = 0; i < columns.length; i++) {
            BoardColumn col = new BoardColumn();
            col.setBoardId(board.getId());
            col.setName(columns[i]);
            col.setSortOrder(i);
            columnMapper.insert(col);
        }

        if (addProjectMembers) {
            jdbcTemplate.update(
                "INSERT INTO board_members (board_id, user_id, role) " +
                "SELECT ?, pm.user_id, CASE WHEN pm.role = 'OWNER' THEN 'ADMIN' ELSE pm.role END " +
                "FROM project_members pm WHERE pm.project_id = ? " +
                "AND NOT EXISTS (SELECT 1 FROM board_members bm WHERE bm.board_id = ? AND bm.user_id = pm.user_id)",
                board.getId(), projectId, board.getId());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("id", board.getId());
        result.put("name", board.getName());
        result.put("type", board.getType());
        result.put("projectId", board.getProjectId());
        return result;
    }

    private String[] columnsForTemplate(String template) {
        return switch (template.toUpperCase()) {
            case "ROADMAP" -> new String[]{"史诗故事池", "规划中", "进行中", "已完成"};
            case "MILESTONE" -> new String[]{"用户故事池", "用户故事-待梳理", "用户故事-梳理完成"};
            case "SPRINT" -> new String[]{"待办", "进行中", "测试中", "已完成"};
            case "DEFECT" -> new String[]{"新建", "处理中", "待验证", "已关闭"};
            case "BACKLOG" -> new String[]{"用户故事池", "待梳理", "梳理完成", "实现中", "已完成"};
            case "TEST_CASE" -> new String[]{"待编写", "编写中", "待评审", "已通过"};
            case "OKR" -> new String[]{"目标池", "进行中", "已完成", "已取消"};
            case "EVENT" -> new String[]{"策划中", "筹备中", "进行中", "已结束"};
            case "STORY_MAP" -> new String[]{"活动", "用户故事", "待开发", "已完成"};
            default -> new String[]{"待办", "进行中", "已完成"};
        };
    }

    @Transactional
    public void renameBoard(Long boardId, String name) {
        if (!StringUtils.hasText(name)) throw new IllegalArgumentException("看板名称不能为空");
        Board board = boardMapper.selectById(boardId);
        if (board == null) throw new IllegalArgumentException("看板不存在");
        board.setName(name);
        boardMapper.updateById(board);
    }

    @Transactional
    public void moveBoard(Long boardId, Long projectId) {
        Board board = boardMapper.selectById(boardId);
        if (board == null) throw new IllegalArgumentException("看板不存在");
        Project project = projectMapper.selectById(projectId);
        if (project == null) throw new IllegalArgumentException("项目不存在");
        board.setProjectId(projectId);
        boardMapper.updateById(board);
    }

    @Transactional
    public Map<String, Object> copyBoard(Long boardId) {
        Board source = boardMapper.selectById(boardId);
        if (source == null) throw new IllegalArgumentException("看板不存在");

        Board copy = new Board();
        copy.setName(source.getName() + " (副本)");
        copy.setType(source.getType());
        copy.setProjectId(source.getProjectId());
        copy.setSwimlanesEnabled(source.getSwimlanesEnabled());
        copy.setVisibility(source.getVisibility());
        copy.setArchived(false);
        boardMapper.insert(copy);

        Map<Long, Long> columnMap = new HashMap<>();
        List<BoardColumn> columns = columnMapper.selectList(
            new LambdaQueryWrapper<BoardColumn>().eq(BoardColumn::getBoardId, boardId).orderByAsc(BoardColumn::getSortOrder));
        for (BoardColumn col : columns) {
            BoardColumn nc = new BoardColumn();
            nc.setBoardId(copy.getId());
            nc.setName(col.getName());
            nc.setSortOrder(col.getSortOrder());
            columnMapper.insert(nc);
            columnMap.put(col.getId(), nc.getId());
        }

        List<Card> cards = cardMapper.selectList(
            new LambdaQueryWrapper<Card>().eq(Card::getBoardId, boardId).eq(Card::getDeleted, false));
        for (Card c : cards) {
            Card nc = new Card();
            nc.setBoardId(copy.getId());
            nc.setColumnId(columnMap.getOrDefault(c.getColumnId(), c.getColumnId()));
            nc.setTitle(c.getTitle());
            nc.setDescription(c.getDescription());
            nc.setType(c.getType());
            nc.setSortOrder(c.getSortOrder());
            nc.setWorkload(c.getWorkload());
            nc.setDeleted(false);
            nc.setVersion(1);
            cardMapper.insert(nc);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("id", copy.getId());
        result.put("name", copy.getName());
        return result;
    }

    @Transactional
    public void deleteBoard(Long boardId) {
        jdbcTemplate.update("DELETE FROM starred_boards WHERE board_id = ?", boardId);
        jdbcTemplate.update("DELETE FROM card_members WHERE card_id IN (SELECT id FROM cards WHERE board_id = ?)", boardId);
        jdbcTemplate.update("DELETE FROM cards WHERE board_id = ?", boardId);
        jdbcTemplate.update("DELETE FROM board_columns WHERE board_id = ?", boardId);
        jdbcTemplate.update("DELETE FROM swimlanes WHERE board_id = ?", boardId);
        jdbcTemplate.update("DELETE FROM user_board_orders WHERE board_id = ?", boardId);
        jdbcTemplate.update("DELETE FROM board_members WHERE board_id = ?", boardId);
        jdbcTemplate.update("DELETE FROM activity_logs WHERE board_id = ?", boardId);
        boardMapper.deleteById(boardId);
    }

    @Transactional
    public void restoreBoard(Long boardId) {
        Board board = boardMapper.selectById(boardId);
        if (board == null) throw new IllegalArgumentException("看板不存在");
        board.setArchived(false);
        boardMapper.updateById(board);
    }
}
