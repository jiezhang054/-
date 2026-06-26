package com.scrum.controller;

import com.scrum.common.ApiResponse;
import com.scrum.service.TeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teams")
public class TeamController {
    @Autowired private TeamService teamService;

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(Authentication auth) {
        return ApiResponse.ok(teamService.listForUser((Long) auth.getPrincipal()));
    }

    @GetMapping("/context")
    public ApiResponse<Map<String, Object>> context(Authentication auth) {
        return ApiResponse.ok(teamService.getContext((Long) auth.getPrincipal()));
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> create(Authentication auth, @RequestBody Map<String, String> body) {
        return ApiResponse.ok(teamService.create((Long) auth.getPrincipal(),
            body.get("name"), body.get("description")));
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> get(@PathVariable Long id, Authentication auth) {
        return ApiResponse.ok(teamService.getById(id, (Long) auth.getPrincipal()));
    }

    @PatchMapping("/{id}")
    public ApiResponse<Map<String, Object>> update(@PathVariable Long id, Authentication auth,
            @RequestBody Map<String, String> body) {
        return ApiResponse.ok(teamService.update(id, (Long) auth.getPrincipal(),
            body.get("name"), body.get("description")));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id, Authentication auth) {
        teamService.delete(id, (Long) auth.getPrincipal());
        return ApiResponse.ok(null);
    }

    @GetMapping("/{id}/members")
    public ApiResponse<List<Map<String, Object>>> members(@PathVariable Long id, Authentication auth) {
        return ApiResponse.ok(teamService.listMembers(id, (Long) auth.getPrincipal()));
    }

    @PostMapping("/{id}/members")
    public ApiResponse<Map<String, Object>> invite(@PathVariable Long id, Authentication auth,
            @RequestBody Map<String, String> body) {
        return ApiResponse.ok(teamService.inviteMember(id, (Long) auth.getPrincipal(),
            body.get("identifier"), body.get("role")));
    }

    @PatchMapping("/{id}/members/{memberId}")
    public ApiResponse<Void> updateRole(@PathVariable Long id, @PathVariable Long memberId,
            Authentication auth, @RequestBody Map<String, String> body) {
        teamService.updateMemberRole(id, (Long) auth.getPrincipal(), memberId, body.get("role"));
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/{id}/members/{memberId}")
    public ApiResponse<Void> removeMember(@PathVariable Long id, @PathVariable Long memberId, Authentication auth) {
        teamService.removeMember(id, (Long) auth.getPrincipal(), memberId);
        return ApiResponse.ok(null);
    }

    @PutMapping("/context")
    public ApiResponse<Void> switchContext(Authentication auth, @RequestBody Map<String, Object> body) {
        Long teamId = body.get("teamId") != null ? Long.valueOf(body.get("teamId").toString()) : null;
        teamService.switchContext((Long) auth.getPrincipal(), teamId);
        return ApiResponse.ok(null);
    }
}
