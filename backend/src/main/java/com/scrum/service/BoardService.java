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
    @Autowired private com.scrum.websocket.BoardWebSocketHandler webSocketHandler;
    @Autowired private PermissionService permissionService;
    @Autowired private ActivityLogService activityLogService;
    @Autowired private BoardChainService boardChainService;

    public BoardDetailDTO getBoardDetail(Long boardId, Long userId) {
        if (userId != null) permissionService.ensureBoardRead(boardId, userId);
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
        dto.setVisibility(board.getVisibility());

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
        applyChainMeta(dto, boardId);
        if (userId != null) {
            dto.setPermissions(permissionService.getBoardPermissions(boardId, userId));
        }
        return dto;
    }

    private void applyChainMeta(BoardDetailDTO dto, Long boardId) {
        Map<String, Object> chain = boardChainService.getChainMeta(boardId);
        dto.setCompleted((Boolean) chain.get("completed"));
        dto.setChainLocked((Boolean) chain.get("chainLocked"));
        dto.setChainMessage((String) chain.get("chainMessage"));
        dto.setParentBoardName((String) chain.get("parentBoardName"));
        if (chain.get("canPlanMilestone") != null) dto.setCanPlanMilestone((Boolean) chain.get("canPlanMilestone"));
        if (chain.get("canPlanSprint") != null) dto.setCanPlanSprint((Boolean) chain.get("canPlanSprint"));
        if (chain.get("linkedDefectBoardId") != null) dto.setLinkedDefectBoardId(((Number) chain.get("linkedDefectBoardId")).longValue());
        if (chain.get("linkedRetroBoardId") != null) dto.setLinkedRetroBoardId(((Number) chain.get("linkedRetroBoardId")).longValue());
        if (chain.get("linkedSprintId") != null) dto.setLinkedSprintId(((Number) chain.get("linkedSprintId")).longValue());
        dto.setLinkedSprintName((String) chain.get("linkedSprintName"));
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
    public void updateCardPositions(Long boardId, Long userId, List<Map<String, Object>> updates) {
        for (Map<String, Object> u : updates) {
            Long cardId = Long.valueOf(u.get("cardId").toString());
            Card card = cardMapper.selectById(cardId);
            if (card == null) continue;
            Long columnId = Long.valueOf(u.get("columnId").toString());
            card.setColumnId(columnId);
            if (u.get("swimlaneId") != null) card.setSwimlaneId(Long.valueOf(u.get("swimlaneId").toString()));
            if (u.get("sortOrder") != null) card.setSortOrder(Integer.valueOf(u.get("sortOrder").toString()));
            card.setVersion(card.getVersion() + 1);
            cardMapper.updateById(card);
            Map<String, Object> payload = new HashMap<>();
            payload.put("cardId", cardId);
            payload.put("columnId", card.getColumnId());
            if (card.getSwimlaneId() != null) payload.put("swimlaneId", card.getSwimlaneId());
            webSocketHandler.notifyBoard(boardId, "CARD_MOVED", payload);

            if (userId != null) {
                BoardColumn col = columnMapper.selectById(columnId);
                String colName = col != null ? col.getName() : "目标列";
                activityLogService.record(userId, boardId, cardId,
                    "移动了卡片「" + card.getTitle() + "」到「" + colName + "」");
            }
        }
    }

    @Transactional
    public BoardDetailDTO.CardDTO updateCard(Long cardId, Map<String, Object> updates) {
        Card card = cardMapper.selectById(cardId);
        if (card == null) throw new RuntimeException("卡片不存在");
        if (updates.containsKey("version")) {
            int expected = Integer.parseInt(updates.get("version").toString());
            if (card.getVersion() != null && card.getVersion() != expected) {
                throw new IllegalStateException("卡片已被他人修改，请刷新后重试");
            }
        }
        if (updates.containsKey("title")) card.setTitle((String) updates.get("title"));
        if (updates.containsKey("description")) card.setDescription((String) updates.get("description"));
        if (updates.containsKey("workload")) card.setWorkload(Integer.valueOf(updates.get("workload").toString()));
        if (updates.containsKey("type")) card.setType(updates.get("type").toString());
        if (updates.containsKey("dueDate")) {
            String d = updates.get("dueDate") != null ? updates.get("dueDate").toString() : null;
            card.setDueDate(d != null && !d.isBlank() ? java.time.LocalDate.parse(d) : null);
        }
        if (updates.containsKey("startDate")) {
            String d = updates.get("startDate") != null ? updates.get("startDate").toString() : null;
            card.setStartDate(d != null && !d.isBlank() ? java.time.LocalDate.parse(d) : null);
        }
        card.setVersion(card.getVersion() + 1);
        cardMapper.updateById(card);

        if (updates.containsKey("memberIds") && updates.get("memberIds") instanceof List<?> memberIds) {
            jdbcTemplate.update("DELETE FROM card_members WHERE card_id = ?", cardId);
            for (Object id : memberIds) {
                jdbcTemplate.update("INSERT INTO card_members (card_id, user_id) VALUES (?, ?)",
                    cardId, Long.valueOf(id.toString()));
            }
        }
        if (updates.containsKey("labels") && updates.get("labels") instanceof List<?> labels) {
            jdbcTemplate.update("DELETE FROM card_labels WHERE card_id = ?", cardId);
            for (Object item : labels) {
                if (item instanceof Map<?, ?> m) {
                    jdbcTemplate.update("INSERT INTO card_labels (card_id, name, color) VALUES (?, ?, ?)",
                        cardId, m.get("name").toString(),
                        m.get("color") != null ? m.get("color").toString() : "#1677ff");
                }
            }
        }
        if (updates.containsKey("checklist") && updates.get("checklist") instanceof List<?> checklist) {
            jdbcTemplate.update("DELETE FROM card_checklist WHERE card_id = ?", cardId);
            int order = 0;
            for (Object item : checklist) {
                if (item instanceof Map<?, ?> m) {
                    jdbcTemplate.update("INSERT INTO card_checklist (card_id, text, done, sort_order) VALUES (?, ?, ?, ?)",
                        cardId, m.get("text").toString(),
                        Boolean.TRUE.equals(m.get("done")), order++);
                }
            }
        }

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

        insertColumnsForTemplate(board.getId(), template != null ? template : board.getType());

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

    @Transactional
    public Board createBoardInChain(Long projectId, String name, String type, Long parentBoardId,
            java.time.LocalDate startDate, java.time.LocalDate endDate, int sortOrder) {
        if (!StringUtils.hasText(name)) throw new IllegalArgumentException("看板名称不能为空");
        Board board = new Board();
        board.setName(name);
        board.setType(type);
        board.setProjectId(projectId);
        board.setParentBoardId(parentBoardId);
        board.setSwimlanesEnabled("MILESTONE".equals(type) || "SPRINT".equals(type));
        board.setStartDate(startDate);
        board.setEndDate(endDate);
        board.setSortOrder(sortOrder);
        board.setVisibility("PROJECT");
        board.setArchived(false);
        boardMapper.insert(board);
        insertColumnsForTemplate(board.getId(), type);
        return board;
    }

    private void insertColumnsForTemplate(Long boardId, String template) {
        String[] columns = columnsForTemplate(template);
        for (int i = 0; i < columns.length; i++) {
            BoardColumn col = new BoardColumn();
            col.setBoardId(boardId);
            col.setName(columns[i]);
            col.setSortOrder(i);
            columnMapper.insert(col);
        }
    }

    private String[] columnsForTemplate(String template) {
        return switch (template.toUpperCase()) {
            case "ROADMAP" -> new String[]{"史诗故事池", "规划中", "进行中", "已完成"};
            case "MILESTONE" -> new String[]{"用户故事池", "用户故事-待梳理", "用户故事-梳理完成"};
            case "SPRINT" -> new String[]{"待办", "进行中", "测试中", "已完成"};
            case "DEFECT" -> new String[]{"新建", "处理中", "待验证", "已关闭"};
            case "RETROSPECTIVE" -> new String[]{"做得好", "待改进", "行动项"};
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
