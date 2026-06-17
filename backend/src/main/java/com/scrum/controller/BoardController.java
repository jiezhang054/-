package com.scrum.controller;

import com.scrum.common.ApiResponse;
import com.scrum.dto.BoardDetailDTO;
import com.scrum.service.BoardDetailService;
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
    @Autowired private BoardDetailService boardDetailService;
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
    public ApiResponse<String> importJson(@PathVariable Long id, Authentication auth,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) throws Exception {
        String json = new String(file.getBytes(), java.nio.charset.StandardCharsets.UTF_8);
        boardDetailService.importBoardJson(id, (Long) auth.getPrincipal(), json);
        return ApiResponse.ok("导入成功");
    }

    @PostMapping("/{id}/snapshot")
    public ApiResponse<Map<String, String>> snapshot(@PathVariable Long id) {
        return ApiResponse.ok(Map.of("url", "/snapshot/" + id + "/" + java.util.UUID.randomUUID()));
    }

    @GetMapping("/{id}/activities")
    public ApiResponse<java.util.List<Map<String, Object>>> activities(@PathVariable Long id,
            @RequestParam(defaultValue = "30") int limit, Authentication auth) {
        return ApiResponse.ok(boardDetailService.getActivities(id, (Long) auth.getPrincipal(), limit));
    }

    @GetMapping("/{id}/members")
    public ApiResponse<java.util.List<Map<String, Object>>> members(@PathVariable Long id, Authentication auth) {
        return ApiResponse.ok(boardDetailService.listMembers(id, (Long) auth.getPrincipal()));
    }

    @PostMapping("/{id}/members")
    public ApiResponse<Map<String, Object>> inviteMember(@PathVariable Long id, Authentication auth,
            @RequestBody Map<String, String> body) {
        return ApiResponse.ok(boardDetailService.inviteMember(id, (Long) auth.getPrincipal(),
            body.get("identifier"), body.get("role")));
    }

    @PatchMapping("/{id}/settings")
    public ApiResponse<BoardDetailDTO> updateSettings(@PathVariable Long id, Authentication auth,
            @RequestBody Map<String, Object> body) {
        return ApiResponse.ok(boardDetailService.updateSettings(id, (Long) auth.getPrincipal(), body));
    }

    @PostMapping("/{id}/columns")
    public ApiResponse<BoardDetailDTO.ColumnDTO> addColumn(@PathVariable Long id, Authentication auth,
            @RequestBody Map<String, String> body) {
        return ApiResponse.ok(boardDetailService.addColumn(id, (Long) auth.getPrincipal(), body.get("name")));
    }

    @PutMapping("/{id}/columns/order")
    public ApiResponse<Void> reorderColumns(@PathVariable Long id, Authentication auth,
            @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        java.util.List<Number> ids = (java.util.List<Number>) body.get("columnIds");
        boardDetailService.reorderColumns(id, (Long) auth.getPrincipal(), ids.stream().map(Number::longValue).toList());
        return ApiResponse.ok(null);
    }

    @PostMapping("/{id}/swimlanes")
    public ApiResponse<BoardDetailDTO.SwimlaneDTO> addSwimlane(@PathVariable Long id, Authentication auth,
            @RequestBody Map<String, String> body) {
        return ApiResponse.ok(boardDetailService.addSwimlane(id, (Long) auth.getPrincipal(), body.get("name")));
    }

    @PostMapping("/{id}/cards")
    public ApiResponse<BoardDetailDTO.CardDTO> createCard(@PathVariable Long id, Authentication auth,
            @RequestBody Map<String, Object> body) {
        return ApiResponse.ok(boardDetailService.createCard(id, (Long) auth.getPrincipal(), body));
    }

    @PostMapping("/{id}/cards/batch")
    public ApiResponse<Void> batchCards(@PathVariable Long id, Authentication auth,
            @RequestBody Map<String, Object> body) {
        boardDetailService.batchUpdateCards(id, (Long) auth.getPrincipal(), body);
        return ApiResponse.ok(null);
    }

    @GetMapping("/{id}/labels")
    public ApiResponse<java.util.List<Map<String, Object>>> labels(@PathVariable Long id, Authentication auth) {
        return ApiResponse.ok(boardDetailService.listLabels(id, (Long) auth.getPrincipal()));
    }
}
