package com.scrum.controller;

import com.scrum.common.ApiResponse;
import com.scrum.dto.BoardDetailDTO;
import com.scrum.entity.Card;
import com.scrum.mapper.CardMapper;
import com.scrum.service.BoardDetailService;
import com.scrum.service.BoardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/cards")
public class CardController {
    @Autowired private BoardService boardService;
    @Autowired private BoardDetailService boardDetailService;
    @Autowired private CardMapper cardMapper;

    @PutMapping("/{id}")
    public ApiResponse<BoardDetailDTO.CardDTO> updateCard(@PathVariable Long id,
            @RequestBody Map<String, Object> body, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        Card card = cardMapper.selectById(id);
        if (card == null) throw new IllegalArgumentException("卡片不存在");
        boardDetailService.ensureAccess(card.getBoardId(), userId);
        return ApiResponse.ok(boardService.updateCard(id, body));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCard(@PathVariable Long id, Authentication auth) {
        boardDetailService.deleteCard(id, (Long) auth.getPrincipal());
        return ApiResponse.ok(null);
    }
}
