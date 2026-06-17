package com.scrum.controller;

import com.scrum.common.ApiResponse;
import com.scrum.dto.BoardDetailDTO;
import com.scrum.service.BoardService;
import com.scrum.service.ScrumChainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/cards")
public class CardController {
    @Autowired private BoardService boardService;
    @Autowired private ScrumChainService scrumChainService;

    @PutMapping("/{id}")
    public ApiResponse<BoardDetailDTO.CardDTO> updateCard(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ApiResponse.ok(boardService.updateCard(id, body));
    }

    @PostMapping("/{id}/reference")
    public ApiResponse<BoardDetailDTO.CardDTO> createReference(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long targetBoardId = Long.valueOf(body.get("targetBoardId").toString());
        return ApiResponse.ok(scrumChainService.createReference(id, targetBoardId));
    }
}
