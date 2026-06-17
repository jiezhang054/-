package com.scrum.controller;

import com.scrum.common.ApiResponse;
import com.scrum.service.BoardDetailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ColumnController {
    @Autowired private BoardDetailService boardDetailService;

    @PatchMapping("/columns/{id}")
    public ApiResponse<Void> renameColumn(@PathVariable Long id, Authentication auth,
            @RequestBody Map<String, String> body) {
        boardDetailService.renameColumn(id, (Long) auth.getPrincipal(), body.get("name"));
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/columns/{id}")
    public ApiResponse<Void> deleteColumn(@PathVariable Long id, Authentication auth,
            @RequestParam(required = false) Long moveToColumnId) {
        boardDetailService.deleteColumn(id, (Long) auth.getPrincipal(), moveToColumnId);
        return ApiResponse.ok(null);
    }

    @PatchMapping("/swimlanes/{id}")
    public ApiResponse<Void> renameSwimlane(@PathVariable Long id, Authentication auth,
            @RequestBody Map<String, String> body) {
        boardDetailService.renameSwimlane(id, (Long) auth.getPrincipal(), body.get("name"));
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/swimlanes/{id}")
    public ApiResponse<Void> deleteSwimlane(@PathVariable Long id, Authentication auth) {
        boardDetailService.deleteSwimlane(id, (Long) auth.getPrincipal());
        return ApiResponse.ok(null);
    }
}
