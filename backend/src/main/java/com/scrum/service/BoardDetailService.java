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
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BoardDetailService {
    @Autowired private BoardMapper boardMapper;
    @Autowired private BoardColumnMapper columnMapper;
    @Autowired private SwimlaneMapper swimlaneMapper;
    @Autowired private CardMapper cardMapper;
    @Autowired private UserMapper userMapper;
    @Autowired private BoardService boardService;
    @Autowired private JdbcTemplate jdbcTemplate;

    public void ensureAccess(Long boardId, Long userId) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM boards b JOIN project_members pm ON b.project_id = pm.project_id " +
            "WHERE b.id = ? AND pm.user_id = ?", Integer.class, boardId, userId);
        if (count == null || count == 0) throw new IllegalArgumentException("无权访问该看板");
    }

    private void logActivity(Long userId, Long boardId, Long cardId, String action) {
        jdbcTemplate.update(
            "INSERT INTO activity_logs (user_id, action, card_id, board_id) VALUES (?, ?, ?, ?)",
            userId, action, cardId, boardId);
    }

    @Transactional
    public BoardDetailDTO updateSettings(Long boardId, Long userId, Map<String, Object> body) {
        ensureAccess(boardId, userId);
        Board board = boardMapper.selectById(boardId);
        if (board == null) throw new IllegalArgumentException("看板不存在");
        if (body.containsKey("name") && StringUtils.hasText((String) body.get("name"))) {
            board.setName((String) body.get("name"));
        }
        if (body.containsKey("visibility")) board.setVisibility(body.get("visibility").toString());
        if (body.containsKey("swimlanesEnabled")) {
            board.setSwimlanesEnabled(Boolean.TRUE.equals(body.get("swimlanesEnabled")));
        }
        if (body.containsKey("startDate")) {
            String d = (String) body.get("startDate");
            board.setStartDate(d != null && !d.isBlank() ? LocalDate.parse(d) : null);
        }
        if (body.containsKey("endDate")) {
            String d = (String) body.get("endDate");
            board.setEndDate(d != null && !d.isBlank() ? LocalDate.parse(d) : null);
        }
        boardMapper.updateById(board);
        logActivity(userId, boardId, null, "更新了看板设置");
        return boardService.getBoardDetail(boardId, userId);
    }

    public List<Map<String, Object>> getActivities(Long boardId, Long userId, int limit) {
        ensureAccess(boardId, userId);
        return jdbcTemplate.query(
            "SELECT al.id, al.user_id as userId, u.display_name as userName, al.action, al.card_id as cardId, " +
            "c.title as cardTitle, al.created_at as createdAt FROM activity_logs al " +
            "JOIN users u ON al.user_id = u.id LEFT JOIN cards c ON al.card_id = c.id " +
            "WHERE al.board_id = ? ORDER BY al.created_at DESC LIMIT ?",
            (rs, i) -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", rs.getLong("id"));
                m.put("userId", rs.getLong("userId"));
                m.put("userName", rs.getString("userName"));
                m.put("action", rs.getString("action"));
                long cardId = rs.getLong("cardId");
                if (!rs.wasNull()) m.put("cardId", cardId);
                m.put("cardTitle", rs.getString("cardTitle"));
                m.put("boardId", boardId);
                m.put("createdAt", rs.getTimestamp("createdAt").toString());
                return m;
            }, boardId, limit);
    }

    public List<Map<String, Object>> listMembers(Long boardId, Long userId) {
        ensureAccess(boardId, userId);
        List<Map<String, Object>> members = jdbcTemplate.query(
            "SELECT u.id, u.username, u.display_name as displayName, u.email, u.avatar, bm.role " +
            "FROM board_members bm JOIN users u ON bm.user_id = u.id WHERE bm.board_id = ? ORDER BY bm.role",
            (rs, i) -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", rs.getLong("id"));
                m.put("username", rs.getString("username"));
                m.put("displayName", rs.getString("displayName"));
                m.put("email", rs.getString("email"));
                m.put("avatar", rs.getString("avatar"));
                m.put("role", rs.getString("role"));
                return m;
            }, boardId);
        if (members.isEmpty()) {
            Board board = boardMapper.selectById(boardId);
            if (board != null) {
                return jdbcTemplate.query(
                    "SELECT u.id, u.username, u.display_name as displayName, u.email, u.avatar, pm.role " +
                    "FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = ?",
                    (rs, i) -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("id", rs.getLong("id"));
                        m.put("username", rs.getString("username"));
                        m.put("displayName", rs.getString("displayName"));
                        m.put("email", rs.getString("email"));
                        m.put("avatar", rs.getString("avatar"));
                        m.put("role", rs.getString("role"));
                        return m;
                    }, board.getProjectId());
            }
        }
        return members;
    }

    @Transactional
    public Map<String, Object> inviteMember(Long boardId, Long userId, String identifier, String role) {
        ensureAccess(boardId, userId);
        if (!StringUtils.hasText(identifier)) throw new IllegalArgumentException("请输入用户名或邮箱");
        String r = StringUtils.hasText(role) ? role.toUpperCase() : "MEMBER";
        List<User> users = userMapper.selectList(new LambdaQueryWrapper<User>()
            .eq(User::getUsername, identifier.trim()).or().eq(User::getEmail, identifier.trim()));
        if (users.isEmpty()) throw new IllegalArgumentException("用户不存在");
        User target = users.get(0);
        Integer exists = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM board_members WHERE board_id = ? AND user_id = ?",
            Integer.class, boardId, target.getId());
        if (exists != null && exists > 0) throw new IllegalArgumentException("用户已是看板成员");
        jdbcTemplate.update("INSERT INTO board_members (board_id, user_id, role) VALUES (?, ?, ?)",
            boardId, target.getId(), r);
        logActivity(userId, boardId, null, "邀请 " + target.getDisplayName() + " 加入看板");
        Map<String, Object> m = new HashMap<>();
        m.put("id", target.getId());
        m.put("displayName", target.getDisplayName());
        m.put("role", r);
        return m;
    }

    @Transactional
    public BoardDetailDTO.ColumnDTO addColumn(Long boardId, Long userId, String name) {
        ensureAccess(boardId, userId);
        if (!StringUtils.hasText(name)) throw new IllegalArgumentException("列名称不能为空");
        List<BoardColumn> cols = columnMapper.selectList(
            new LambdaQueryWrapper<BoardColumn>().eq(BoardColumn::getBoardId, boardId)
                .orderByDesc(BoardColumn::getSortOrder).last("LIMIT 1"));
        int order = cols.isEmpty() ? 0 : cols.get(0).getSortOrder() + 1;
        BoardColumn col = new BoardColumn();
        col.setBoardId(boardId);
        col.setName(name);
        col.setSortOrder(order);
        columnMapper.insert(col);
        logActivity(userId, boardId, null, "添加了列「" + name + "」");
        BoardDetailDTO.ColumnDTO dto = new BoardDetailDTO.ColumnDTO();
        dto.setId(col.getId()); dto.setName(col.getName()); dto.setSortOrder(col.getSortOrder());
        return dto;
    }

    @Transactional
    public void renameColumn(Long columnId, Long userId, String name) {
        BoardColumn col = columnMapper.selectById(columnId);
        if (col == null) throw new IllegalArgumentException("列不存在");
        ensureAccess(col.getBoardId(), userId);
        col.setName(name);
        columnMapper.updateById(col);
        logActivity(userId, col.getBoardId(), null, "重命名列为「" + name + "」");
    }

    @Transactional
    public void deleteColumn(Long columnId, Long userId, Long moveToColumnId) {
        BoardColumn col = columnMapper.selectById(columnId);
        if (col == null) throw new IllegalArgumentException("列不存在");
        ensureAccess(col.getBoardId(), userId);
        Long target = moveToColumnId;
        if (target == null) {
            List<BoardColumn> others = columnMapper.selectList(
                new LambdaQueryWrapper<BoardColumn>().eq(BoardColumn::getBoardId, col.getBoardId())
                    .ne(BoardColumn::getId, columnId).orderByAsc(BoardColumn::getSortOrder).last("LIMIT 1"));
            if (others.isEmpty()) throw new IllegalArgumentException("无法删除最后一列");
            target = others.get(0).getId();
        }
        List<Card> cards = cardMapper.selectList(
            new LambdaQueryWrapper<Card>().eq(Card::getColumnId, columnId).eq(Card::getDeleted, false));
        for (Card c : cards) {
            c.setColumnId(target);
            cardMapper.updateById(c);
        }
        columnMapper.deleteById(columnId);
        logActivity(userId, col.getBoardId(), null, "删除了列「" + col.getName() + "」");
    }

    @Transactional
    public void reorderColumns(Long boardId, Long userId, List<Long> columnIds) {
        ensureAccess(boardId, userId);
        for (int i = 0; i < columnIds.size(); i++) {
            BoardColumn col = columnMapper.selectById(columnIds.get(i));
            if (col != null && boardId.equals(col.getBoardId())) {
                col.setSortOrder(i);
                columnMapper.updateById(col);
            }
        }
    }

    @Transactional
    public BoardDetailDTO.SwimlaneDTO addSwimlane(Long boardId, Long userId, String name) {
        ensureAccess(boardId, userId);
        Board board = boardMapper.selectById(boardId);
        if (board != null) {
            board.setSwimlanesEnabled(true);
            boardMapper.updateById(board);
        }
        List<Swimlane> lanes = swimlaneMapper.selectList(
            new LambdaQueryWrapper<Swimlane>().eq(Swimlane::getBoardId, boardId)
                .orderByDesc(Swimlane::getSortOrder).last("LIMIT 1"));
        int order = lanes.isEmpty() ? 0 : lanes.get(0).getSortOrder() + 1;
        Swimlane sl = new Swimlane();
        sl.setBoardId(boardId);
        sl.setName(name);
        sl.setSortOrder(order);
        swimlaneMapper.insert(sl);
        logActivity(userId, boardId, null, "添加了泳道「" + name + "」");
        BoardDetailDTO.SwimlaneDTO dto = new BoardDetailDTO.SwimlaneDTO();
        dto.setId(sl.getId()); dto.setName(sl.getName()); dto.setSortOrder(sl.getSortOrder());
        return dto;
    }

    @Transactional
    public void renameSwimlane(Long swimlaneId, Long userId, String name) {
        Swimlane sl = swimlaneMapper.selectById(swimlaneId);
        if (sl == null) throw new IllegalArgumentException("泳道不存在");
        ensureAccess(sl.getBoardId(), userId);
        sl.setName(name);
        swimlaneMapper.updateById(sl);
    }

    @Transactional
    public void deleteSwimlane(Long swimlaneId, Long userId) {
        Swimlane sl = swimlaneMapper.selectById(swimlaneId);
        if (sl == null) throw new IllegalArgumentException("泳道不存在");
        ensureAccess(sl.getBoardId(), userId);
        List<Card> cards = cardMapper.selectList(
            new LambdaQueryWrapper<Card>().eq(Card::getSwimlaneId, swimlaneId).eq(Card::getDeleted, false));
        for (Card c : cards) {
            c.setSwimlaneId(null);
            cardMapper.updateById(c);
        }
        swimlaneMapper.deleteById(swimlaneId);
        logActivity(userId, sl.getBoardId(), null, "删除了泳道「" + sl.getName() + "」");
    }

    @Transactional
    public BoardDetailDTO.CardDTO createCard(Long boardId, Long userId, Map<String, Object> body) {
        ensureAccess(boardId, userId);
        Long columnId = Long.valueOf(body.get("columnId").toString());
        Card card = new Card();
        card.setBoardId(boardId);
        card.setColumnId(columnId);
        card.setTitle((String) body.get("title"));
        card.setDescription(body.get("description") != null ? body.get("description").toString() : null);
        card.setType(body.get("type") != null ? body.get("type").toString() : "TASK");
        if (body.get("swimlaneId") != null) card.setSwimlaneId(Long.valueOf(body.get("swimlaneId").toString()));
        card.setWorkload(body.get("workload") != null ? Integer.valueOf(body.get("workload").toString()) : 1);
        card.setSortOrder(0);
        card.setDeleted(false);
        card.setVersion(1);
        cardMapper.insert(card);
        if (body.get("memberIds") instanceof List<?> ids) {
            for (Object id : ids) {
                jdbcTemplate.update("INSERT INTO card_members (card_id, user_id) VALUES (?, ?)",
                    card.getId(), Long.valueOf(id.toString()));
            }
        }
        logActivity(userId, boardId, card.getId(), "创建了卡片「" + card.getTitle() + "」");
        return boardService.getBoardDetail(boardId, userId).getCards().stream()
            .filter(c -> c.getId().equals(card.getId())).findFirst().orElse(null);
    }

    @Transactional
    public void deleteCard(Long cardId, Long userId) {
        Card card = cardMapper.selectById(cardId);
        if (card == null) throw new IllegalArgumentException("卡片不存在");
        ensureAccess(card.getBoardId(), userId);
        card.setDeleted(true);
        cardMapper.updateById(card);
        logActivity(userId, card.getBoardId(), cardId, "删除了卡片「" + card.getTitle() + "」");
    }

    @Transactional
    public void batchUpdateCards(Long boardId, Long userId, Map<String, Object> body) {
        ensureAccess(boardId, userId);
        String action = body.get("action").toString();
        @SuppressWarnings("unchecked")
        List<Number> cardIds = (List<Number>) body.get("cardIds");
        List<Long> ids = cardIds.stream().map(Number::longValue).collect(Collectors.toList());
        if ("move".equals(action) && body.get("columnId") != null) {
            Long columnId = Long.valueOf(body.get("columnId").toString());
            for (Long cid : ids) {
                Card card = cardMapper.selectById(cid);
                if (card != null && boardId.equals(card.getBoardId())) {
                    card.setColumnId(columnId);
                    card.setVersion(card.getVersion() + 1);
                    cardMapper.updateById(card);
                }
            }
            logActivity(userId, boardId, null, "批量移动了 " + ids.size() + " 张卡片");
        } else if ("delete".equals(action)) {
            for (Long cid : ids) deleteCard(cid, userId);
        } else if ("assign".equals(action) && body.get("memberId") != null) {
            Long memberId = Long.valueOf(body.get("memberId").toString());
            for (Long cid : ids) {
                jdbcTemplate.update(
                    "INSERT INTO card_members (card_id, user_id) SELECT ?, ? WHERE NOT EXISTS " +
                    "(SELECT 1 FROM card_members WHERE card_id = ? AND user_id = ?)",
                    cid, memberId, cid, memberId);
            }
            logActivity(userId, boardId, null, "批量指派了 " + ids.size() + " 张卡片");
        }
    }

    public List<Map<String, Object>> listLabels(Long boardId, Long userId) {
        ensureAccess(boardId, userId);
        return jdbcTemplate.queryForList(
            "SELECT DISTINCT name, color FROM card_labels cl JOIN cards c ON cl.card_id = c.id " +
            "WHERE c.board_id = ? AND c.deleted = FALSE", boardId);
    }

    @Transactional
    public List<BoardDetailDTO.CardDTO> splitCard(Long cardId, Long userId, List<Map<String, Object>> tasks) {
        Card parent = cardMapper.selectById(cardId);
        if (parent == null) throw new IllegalArgumentException("卡片不存在");
        ensureAccess(parent.getBoardId(), userId);
        if (!"USER_STORY".equals(parent.getType()) && !"EPIC".equals(parent.getType())) {
            throw new IllegalArgumentException("仅用户故事或史诗可拆分");
        }
        List<BoardDetailDTO.CardDTO> created = new ArrayList<>();
        int i = 0;
        for (Map<String, Object> t : tasks) {
            Card child = new Card();
            child.setBoardId(parent.getBoardId());
            child.setColumnId(parent.getColumnId());
            child.setSwimlaneId(parent.getSwimlaneId());
            child.setTitle(t.get("title").toString());
            child.setType("TASK");
            child.setWorkload(t.get("workload") != null ? Integer.valueOf(t.get("workload").toString()) : 1);
            child.setSortOrder(parent.getSortOrder() + i + 1);
            child.setDeleted(false);
            child.setVersion(1);
            cardMapper.insert(child);
            created.add(boardService.getBoardDetail(parent.getBoardId(), userId).getCards().stream()
                .filter(c -> c.getId().equals(child.getId())).findFirst().orElse(null));
            i++;
        }
        logActivity(userId, parent.getBoardId(), parent.getId(), "拆分了卡片「" + parent.getTitle() + "」为 " + tasks.size() + " 个任务");
        return created;
    }

    @Transactional
    public void importBoardJson(Long boardId, Long userId, String json) throws Exception {
        ensureAccess(boardId, userId);
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(json);
        com.fasterxml.jackson.databind.JsonNode cards = root.get("cards");
        if (cards == null || !cards.isArray()) throw new IllegalArgumentException("JSON 格式无效");
        List<BoardColumn> cols = columnMapper.selectList(
            new LambdaQueryWrapper<BoardColumn>().eq(BoardColumn::getBoardId, boardId)
                .orderByAsc(BoardColumn::getSortOrder));
        Long defaultCol = cols.isEmpty() ? null : cols.get(0).getId();
        for (com.fasterxml.jackson.databind.JsonNode c : cards) {
            Card card = new Card();
            card.setBoardId(boardId);
            card.setColumnId(c.has("columnId") ? c.get("columnId").asLong() : defaultCol);
            card.setTitle(c.get("title").asText());
            card.setType(c.has("type") ? c.get("type").asText() : "TASK");
            card.setWorkload(c.has("workload") ? c.get("workload").asInt() : 1);
            card.setDescription(c.has("description") ? c.get("description").asText() : null);
            card.setSortOrder(0);
            card.setDeleted(false);
            card.setVersion(1);
            cardMapper.insert(card);
        }
        logActivity(userId, boardId, null, "导入了看板数据");
    }
}
