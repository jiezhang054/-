package com.scrum.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scrum.entity.Board;
import com.scrum.entity.BoardColumn;
import com.scrum.entity.Card;
import com.scrum.entity.Swimlane;
import com.scrum.mapper.BoardColumnMapper;
import com.scrum.mapper.BoardMapper;
import com.scrum.mapper.CardMapper;
import com.scrum.mapper.SwimlaneMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class BoardChainService {
    private static final Set<String> CHAIN_CHILD_TYPES = Set.of(
        "MILESTONE", "SPRINT", "DEFECT", "RETROSPECTIVE");

    @Autowired private BoardMapper boardMapper;
    @Autowired private BoardColumnMapper columnMapper;
    @Autowired private CardMapper cardMapper;
    @Autowired private SwimlaneMapper swimlaneMapper;

    /** 统计看板上实际可展示的卡片（列/泳道有效），与前端渲染规则一致 */
    public long countPlacedCards(Long boardId) {
        Board board = boardMapper.selectById(boardId);
        if (board == null) return 0;
        List<Card> cards = cardMapper.selectList(
            new LambdaQueryWrapper<Card>().eq(Card::getBoardId, boardId).eq(Card::getDeleted, false));
        return filterPlacedCards(board, cards).size();
    }

    public List<Card> filterPlacedCards(Board board, List<Card> cards) {
        PlacementContext ctx = buildPlacementContext(board);
        return cards.stream().filter(c -> isCardPlaced(c, ctx)).collect(Collectors.toList());
    }

    public boolean isBoardCompleted(Long boardId) {
        return countPlacedCards(boardId) > 0;
    }

    private boolean isCardPlaced(Card card, PlacementContext ctx) {
        if (!ctx.columnIds.contains(card.getColumnId())) return false;
        if (ctx.swimlaneIds != null) {
            return card.getSwimlaneId() != null && ctx.swimlaneIds.contains(card.getSwimlaneId());
        }
        return true;
    }

    private PlacementContext buildPlacementContext(Board board) {
        PlacementContext ctx = new PlacementContext();
        ctx.columnIds = columnMapper.selectList(
            new LambdaQueryWrapper<BoardColumn>().eq(BoardColumn::getBoardId, board.getId()))
            .stream().map(BoardColumn::getId).collect(Collectors.toSet());
        if (Boolean.TRUE.equals(board.getSwimlanesEnabled())) {
            List<Swimlane> swimlanes = swimlaneMapper.selectList(
                new LambdaQueryWrapper<Swimlane>().eq(Swimlane::getBoardId, board.getId()));
            if (!swimlanes.isEmpty()) {
                ctx.swimlaneIds = swimlanes.stream().map(Swimlane::getId).collect(Collectors.toSet());
            }
        }
        return ctx;
    }

    private static final class PlacementContext {
        Set<Long> columnIds = Set.of();
        Set<Long> swimlaneIds;
    }

    public void ensureCanCreateMilestone(Long roadmapBoardId) {
        Board roadmap = boardMapper.selectById(roadmapBoardId);
        if (roadmap == null) throw new IllegalArgumentException("路线图不存在");
        if (!"ROADMAP".equals(roadmap.getType())) throw new IllegalArgumentException("仅路线图看板可规划里程碑");
        if (!isBoardCompleted(roadmapBoardId)) {
            throw new IllegalArgumentException("请先在产品路线图中添加卡片后再规划里程碑");
        }
    }

    public void ensureCanCreateSprint(Long milestoneBoardId) {
        Board milestone = boardMapper.selectById(milestoneBoardId);
        if (milestone == null) throw new IllegalArgumentException("里程碑看板不存在");
        if (!"MILESTONE".equals(milestone.getType())) throw new IllegalArgumentException("仅里程碑看板可规划 Sprint");
        if (!isBoardCompleted(milestoneBoardId)) {
            throw new IllegalArgumentException("请先在里程碑看板中添加卡片后再规划 Sprint");
        }
    }

    public boolean isChainLocked(Long boardId) {
        Board board = boardMapper.selectById(boardId);
        if (board == null) return false;
        String type = board.getType();
        if ("ROADMAP".equals(type) || "NORMAL".equals(type)) return false;

        if ("MILESTONE".equals(type)) {
            Long parentId = board.getParentBoardId();
            return parentId != null && !isBoardCompleted(parentId);
        }
        if ("SPRINT".equals(type)) {
            Long parentId = board.getParentBoardId();
            return parentId != null && !isBoardCompleted(parentId);
        }
        if ("DEFECT".equals(type) || "RETROSPECTIVE".equals(type)) {
            Long sprintId = board.getParentBoardId();
            return sprintId == null || !isBoardCompleted(sprintId);
        }
        return false;
    }

    public String getChainLockMessage(Long boardId) {
        Board board = boardMapper.selectById(boardId);
        if (board == null) return null;
        if (!isChainLocked(boardId)) return null;

        String type = board.getType();
        if ("MILESTONE".equals(type) || "SPRINT".equals(type)) {
            Board parent = boardMapper.selectById(board.getParentBoardId());
            String parentLabel = parent != null ? parent.getName() : "上级看板";
            return "需先在「" + parentLabel + "」中添加卡片后才能编辑此看板";
        }
        if ("DEFECT".equals(type) || "RETROSPECTIVE".equals(type)) {
            Board sprint = boardMapper.selectById(board.getParentBoardId());
            String sprintLabel = sprint != null ? sprint.getName() : "对应 Sprint";
            return "需先完成「" + sprintLabel + "」（添加卡片）后才能填写此看板";
        }
        return "上级看板尚未完成，当前看板只读";
    }

    public Map<String, Object> getChainMeta(Long boardId) {
        Map<String, Object> meta = new HashMap<>();
        Board board = boardMapper.selectById(boardId);
        if (board == null) return meta;

        meta.put("completed", isBoardCompleted(boardId));
        meta.put("chainLocked", isChainLocked(boardId));
        meta.put("chainMessage", getChainLockMessage(boardId));
        meta.put("parentBoardId", board.getParentBoardId());

        if (board.getParentBoardId() != null) {
            Board parent = boardMapper.selectById(board.getParentBoardId());
            if (parent != null) meta.put("parentBoardName", parent.getName());
        }

        if ("ROADMAP".equals(board.getType())) {
            meta.put("canPlanMilestone", isBoardCompleted(boardId));
        }
        if ("MILESTONE".equals(board.getType())) {
            meta.put("canPlanSprint", isBoardCompleted(boardId) && !isChainLocked(boardId));
        }
        if ("SPRINT".equals(board.getType())) {
            meta.put("linkedDefectBoardId", findLinkedBoardId(boardId, "DEFECT"));
            meta.put("linkedRetroBoardId", findLinkedBoardId(boardId, "RETROSPECTIVE"));
        }
        if ("DEFECT".equals(board.getType()) || "RETROSPECTIVE".equals(board.getType())) {
            meta.put("linkedSprintId", board.getParentBoardId());
            if (board.getParentBoardId() != null) {
                Board sprint = boardMapper.selectById(board.getParentBoardId());
                if (sprint != null) meta.put("linkedSprintName", sprint.getName());
            }
        }
        return meta;
    }

    public Long findLinkedBoardId(Long parentBoardId, String type) {
        Board linked = boardMapper.selectOne(
            new LambdaQueryWrapper<Board>().eq(Board::getParentBoardId, parentBoardId)
                .eq(Board::getType, type).eq(Board::getArchived, false).last("LIMIT 1"));
        return linked != null ? linked.getId() : null;
    }

    public Board createLinkedBoard(Board sprint, String type, String suffix, String[] columnNames) {
        Board child = new Board();
        child.setName(sprint.getName() + suffix);
        child.setType(type);
        child.setProjectId(sprint.getProjectId());
        child.setParentBoardId(sprint.getId());
        child.setSwimlanesEnabled(false);
        child.setStartDate(sprint.getStartDate());
        child.setEndDate(sprint.getEndDate());
        child.setVisibility("PROJECT");
        boardMapper.insert(child);

        for (int i = 0; i < columnNames.length; i++) {
            BoardColumn col = new BoardColumn();
            col.setBoardId(child.getId());
            col.setName(columnNames[i]);
            col.setSortOrder(i);
            columnMapper.insert(col);
        }
        return child;
    }

    public void createDefectAndRetroBoards(Board sprint) {
        createDefectAndRetroBoards(sprint, null, null);
    }

    public void createDefectAndRetroBoards(Board sprint, Integer defectSortOrder, Integer retroSortOrder) {
        if (findLinkedBoardId(sprint.getId(), "DEFECT") == null) {
            Board defect = createLinkedBoard(sprint, "DEFECT", " - 缺陷看板",
                new String[]{"新建", "处理中", "待验证", "已关闭"});
            if (defectSortOrder != null) {
                defect.setSortOrder(defectSortOrder);
                boardMapper.updateById(defect);
            }
        }
        if (findLinkedBoardId(sprint.getId(), "RETROSPECTIVE") == null) {
            Board retro = createLinkedBoard(sprint, "RETROSPECTIVE", " - Sprint回顾",
                new String[]{"做得好", "待改进", "行动项"});
            if (retroSortOrder != null) {
                retro.setSortOrder(retroSortOrder);
                boardMapper.updateById(retro);
            }
        }
    }

    public boolean isChainChildType(String type) {
        return type != null && CHAIN_CHILD_TYPES.contains(type);
    }
}
