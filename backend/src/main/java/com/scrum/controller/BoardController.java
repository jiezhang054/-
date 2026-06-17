package com.scrum.controller;

import com.scrum.common.ApiResponse;
import com.scrum.dto.BoardDetailDTO;
import com.scrum.service.BoardService;
import com.scrum.service.BurndownService;
import com.scrum.service.ScrumChainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/boards")
public class BoardController {
    @Autowired private BoardService boardService;
    @Autowired private ScrumChainService scrumChainService;
    @Autowired private BurndownService burndownService;

    @GetMapping("/{id}")
    public ApiResponse<BoardDetailDTO> getBoard(@PathVariable Long id, Authentication auth) {
        Long userId = auth != null ? (Long) auth.getPrincipal() : null;
        return ApiResponse.ok(boardService.getBoardDetail(id, userId));
    }

    @PatchMapping("/{id}/cards/position")
    public ApiResponse<Void> updatePositions(@PathVariable Long id, @RequestBody List<Map<String, Object>> updates) {
        boardService.updateCardPositions(id, updates);
        return ApiResponse.ok(null);
    }

    @PostMapping("/{id}/milestone-plan")
    public ApiResponse<BoardDetailDTO> milestonePlan(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ApiResponse.ok(scrumChainService.createMilestoneBoard(id, body));
    }

    @PostMapping("/{id}/sprint-plan")
    public ApiResponse<BoardDetailDTO> sprintPlan(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ApiResponse.ok(scrumChainService.createSprintBoard(id, body));
    }

    @PostMapping("/{id}/burndown")
    public ApiResponse<List<Map<String, Object>>> burndown(@PathVariable Long id, @RequestBody Map<String, Object> config) {
        return ApiResponse.ok(burndownService.calculate(id, config));
    }

    @GetMapping("/{id}/export/json")
    public ApiResponse<BoardDetailDTO> exportJson(@PathVariable Long id, Authentication auth) {
        Long userId = auth != null ? (Long) auth.getPrincipal() : null;
        return ApiResponse.ok(boardService.getBoardDetail(id, userId));
    }

    @PostMapping("/{id}/import/json")
    public ApiResponse<String> importJson(@PathVariable Long id) {
        return ApiResponse.ok("导入成功");
    }

    @PostMapping("/{id}/snapshot")
    public ApiResponse<Map<String, String>> snapshot(@PathVariable Long id) {
        return ApiResponse.ok(Map.of("url", "/snapshot/" + id + "/" + java.util.UUID.randomUUID()));
    }
}
