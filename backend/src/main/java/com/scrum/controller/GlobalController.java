package com.scrum.controller;

import com.scrum.common.ApiResponse;
import com.scrum.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class GlobalController {
    @Autowired private ProjectService projectService;
    @Autowired private BoardService boardService;
    @Autowired private NavigationService navigationService;
    @Autowired private NotificationService notificationService;
    @Autowired private MindmapService mindmapService;
    @Autowired private WorkspaceService workspaceService;

    @GetMapping("/projects")
    public ApiResponse<List<Map<String, Object>>> projects(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(projectService.listForUser(userId));
    }

    @PostMapping("/projects")
    public ApiResponse<Map<String, Object>> createProject(Authentication auth, @RequestBody Map<String, String> body) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(projectService.create(userId,
            body.get("name"), body.get("description"), body.getOrDefault("template", "SCRUM")));
    }

    @GetMapping("/projects/{id}")
    public ApiResponse<Map<String, Object>> project(@PathVariable Long id, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(projectService.getById(id, userId));
    }

    @PostMapping("/boards")
    public ApiResponse<Map<String, Object>> createBoard(Authentication auth, @RequestBody Map<String, Object> body) {
        Long projectId = Long.valueOf(body.get("projectId").toString());
        String name = (String) body.get("name");
        String type = body.get("type") != null ? body.get("type").toString() : "NORMAL";
        String template = body.get("template") != null ? body.get("template").toString() : type;
        return ApiResponse.ok(boardService.createBoard(projectId, name, type, template));
    }

    @GetMapping("/navigation")
    public ApiResponse<Map<String, Object>> navigation(Authentication auth,
            @RequestParam(required = false) String keyword) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(navigationService.getNavigation(userId, keyword));
    }

    @PostMapping("/navigation/visits")
    public ApiResponse<Void> recordVisit(Authentication auth, @RequestBody Map<String, Object> body) {
        Long userId = (Long) auth.getPrincipal();
        navigationService.recordVisit(userId,
            body.get("type").toString(),
            Long.valueOf(body.get("targetId").toString()),
            body.get("name").toString());
        return ApiResponse.ok(null);
    }

    @GetMapping("/notifications")
    public ApiResponse<Map<String, Object>> notifications(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(Map.of(
            "items", notificationService.listForUser(userId),
            "unreadCount", notificationService.unreadCount(userId)));
    }

    @PatchMapping("/notifications/{id}/read")
    public ApiResponse<Void> markNotificationRead(@PathVariable Long id, Authentication auth) {
        notificationService.markRead((Long) auth.getPrincipal(), id);
        return ApiResponse.ok(null);
    }

    @PostMapping("/notifications/read-all")
    public ApiResponse<Void> markAllNotificationsRead(Authentication auth) {
        notificationService.markAllRead((Long) auth.getPrincipal());
        return ApiResponse.ok(null);
    }

    @GetMapping("/mindmaps")
    public ApiResponse<List<Map<String, Object>>> mindmaps(Authentication auth) {
        return ApiResponse.ok(mindmapService.listForUser((Long) auth.getPrincipal()));
    }

    @PostMapping("/mindmaps")
    public ApiResponse<Map<String, Object>> createMindmap(Authentication auth, @RequestBody Map<String, Object> body) {
        Long userId = (Long) auth.getPrincipal();
        Long projectId = body.get("projectId") != null ? Long.valueOf(body.get("projectId").toString()) : null;
        return ApiResponse.ok(mindmapService.create(userId,
            (String) body.get("name"), projectId, (String) body.get("content")));
    }

    @GetMapping("/workspace/dashboard")
    public ApiResponse<Map<String, Object>> dashboard(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(workspaceService.getDashboard(userId));
    }
}
