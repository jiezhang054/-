package com.scrum.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scrum.dto.BoardDetailDTO;
import com.scrum.entity.*;
import com.scrum.mapper.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class ScrumChainService {
    @Autowired private BoardMapper boardMapper;
    @Autowired private BoardColumnMapper columnMapper;
    @Autowired private SwimlaneMapper swimlaneMapper;
    @Autowired private CardMapper cardMapper;
    @Autowired private BoardService boardService;

    @Transactional
    public BoardDetailDTO createMilestoneBoard(Long roadmapBoardId, Map<String, Object> request) {
        Board roadmap = boardMapper.selectById(roadmapBoardId);
        if (roadmap == null) throw new RuntimeException("路线图不存在");

        Board milestone = new Board();
        milestone.setName((String) request.get("name"));
        milestone.setType("MILESTONE");
        milestone.setProjectId(roadmap.getProjectId());
        milestone.setParentBoardId(roadmapBoardId);
        milestone.setSwimlanesEnabled(true);
        milestone.setStartDate(LocalDate.parse((String) request.get("startDate")));
        milestone.setEndDate(LocalDate.parse((String) request.get("endDate")));
        boardMapper.insert(milestone);

        String[] colNames = {"用户故事池", "用户故事-待梳理", "用户故事-梳理完成"};
        for (int i = 0; i < colNames.length; i++) {
            BoardColumn col = new BoardColumn();
            col.setBoardId(milestone.getId()); col.setName(colNames[i]); col.setSortOrder(i);
            columnMapper.insert(col);
        }

        @SuppressWarnings("unchecked")
        List<Number> epicIds = (List<Number>) request.get("epicIds");
        if (epicIds != null) {
            int laneOrder = 0;
            for (Number epicId : epicIds) {
                Card epic = cardMapper.selectById(epicId.longValue());
                if (epic == null) continue;

                Swimlane lane = new Swimlane();
                lane.setBoardId(milestone.getId()); lane.setName(epic.getTitle()); lane.setSortOrder(laneOrder++);
                swimlaneMapper.insert(lane);

                Card ref = new Card();
                ref.setBoardId(milestone.getId());
                ref.setColumnId(columnMapper.selectList(new LambdaQueryWrapper<BoardColumn>()
                    .eq(BoardColumn::getBoardId, milestone.getId()).eq(BoardColumn::getName, "用户故事池"))
                    .get(0).getId());
                ref.setSwimlaneId(lane.getId());
                ref.setTitle(epic.getTitle()); ref.setType("EPIC"); ref.setWorkload(epic.getWorkload());
                ref.setIsReference(true); ref.setSourceCardId(epic.getId());
                cardMapper.insert(ref);
            }
        }
        return boardService.getBoardDetail(milestone.getId(), null);
    }

    @Transactional
    public BoardDetailDTO createSprintBoard(Long milestoneBoardId, Map<String, Object> request) {
        Board milestone = boardMapper.selectById(milestoneBoardId);
        if (milestone == null) throw new RuntimeException("里程碑看板不存在");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> sprints = (List<Map<String, Object>>) request.get("sprints");
        BoardDetailDTO last = null;

        for (Map<String, Object> sprintData : sprints) {
            @SuppressWarnings("unchecked")
            List<Number> storyIds = (List<Number>) sprintData.get("storyIds");
            if (storyIds == null || storyIds.isEmpty()) continue;

            Board sprint = new Board();
            sprint.setName((String) sprintData.get("name"));
            sprint.setType("SPRINT");
            sprint.setProjectId(milestone.getProjectId());
            sprint.setParentBoardId(milestoneBoardId);
            sprint.setSwimlanesEnabled(true);
            sprint.setStartDate(LocalDate.parse((String) sprintData.get("startDate")));
            sprint.setEndDate(LocalDate.parse((String) sprintData.get("endDate")));
            boardMapper.insert(sprint);

            String[] colNames = {"待办", "进行中", "已完成"};
            Long todoColId = null;
            for (int i = 0; i < colNames.length; i++) {
                BoardColumn col = new BoardColumn();
                col.setBoardId(sprint.getId()); col.setName(colNames[i]); col.setSortOrder(i);
                columnMapper.insert(col);
                if (i == 0) todoColId = col.getId();
            }

            int laneOrder = 0;
            for (Number storyId : storyIds) {
                Card story = cardMapper.selectById(storyId.longValue());
                if (story == null) continue;

                Swimlane lane = new Swimlane();
                lane.setBoardId(sprint.getId()); lane.setName(story.getTitle()); lane.setSortOrder(laneOrder++);
                swimlaneMapper.insert(lane);

                Card card = new Card();
                card.setBoardId(sprint.getId()); card.setColumnId(todoColId); card.setSwimlaneId(lane.getId());
                card.setTitle(story.getTitle()); card.setType(story.getType()); card.setWorkload(story.getWorkload());
                card.setDescription(story.getDescription());
                card.setIsReference(true); card.setSourceCardId(story.getId());
                cardMapper.insert(card);
            }
            last = boardService.getBoardDetail(sprint.getId(), null);
        }
        return last;
    }

    @Transactional
    public BoardDetailDTO.CardDTO createReference(Long cardId, Long targetBoardId) {
        Card source = cardMapper.selectById(cardId);
        if (source == null) throw new RuntimeException("源卡片不存在");

        BoardColumn firstCol = columnMapper.selectList(
            new LambdaQueryWrapper<BoardColumn>().eq(BoardColumn::getBoardId, targetBoardId)
                .orderByAsc(BoardColumn::getSortOrder)).stream().findFirst().orElse(null);

        Card ref = new Card();
        ref.setBoardId(targetBoardId);
        ref.setColumnId(firstCol != null ? firstCol.getId() : source.getColumnId());
        ref.setTitle(source.getTitle()); ref.setDescription(source.getDescription());
        ref.setType(source.getType()); ref.setWorkload(source.getWorkload());
        ref.setIsReference(true); ref.setSourceCardId(cardId);
        cardMapper.insert(ref);
        return boardService.updateCard(cardId, Map.of());
    }
}
