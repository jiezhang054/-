package com.scrum.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scrum.entity.Board;
import com.scrum.mapper.BoardMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
public class ScrumTemplateService {
    @Autowired private BoardService boardService;
    @Autowired private BoardChainService boardChainService;
    @Autowired private BoardMapper boardMapper;

    @Transactional
    public void initializeProject(Long projectId) {
        ensureComplete(projectId);
    }

    @Transactional
    public void ensureComplete(Long projectId) {
        List<Board> boards = boardMapper.selectList(
            new LambdaQueryWrapper<Board>().eq(Board::getProjectId, projectId).eq(Board::getArchived, false));

        Board roadmap = findByType(boards, "ROADMAP");
        if (roadmap == null) {
            roadmap = boardService.createBoardInChain(
                projectId, "产品路线图", "ROADMAP", null, null, null, 0);
        }

        Board milestone = findByType(boards, "MILESTONE");
        if (milestone == null) {
            milestone = boardService.createBoardInChain(
                projectId, "里程碑 V1.0", "MILESTONE", roadmap.getId(), null, null, 1);
        }

        Board sprint = boards.stream().filter(b -> "SPRINT".equals(b.getType())).findFirst().orElse(null);
        if (sprint == null) {
            LocalDate sprintStart = LocalDate.now();
            LocalDate sprintEnd = sprintStart.plusWeeks(2);
            sprint = boardService.createBoardInChain(
                projectId, "Sprint 1", "SPRINT", milestone.getId(), sprintStart, sprintEnd, 2);
        }

        boardChainService.createDefectAndRetroBoards(sprint, 3, 4);
    }

    private Board findByType(List<Board> boards, String type) {
        return boards.stream().filter(b -> type.equals(b.getType())).findFirst().orElse(null);
    }
}
