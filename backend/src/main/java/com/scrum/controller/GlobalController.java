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
    @Autowired private MyBoardsService myBoardsService;

    @GetMapping("/projects")
    public ApiResponse<List<Map<String, Object>>> projects(Authentication auth,
            @RequestParam(required = false) Long teamId,
            @RequestParam(required = false) Boolean all) {
        Long userId = (Long) auth.getPrincipal();
        if (Boolean.TRUE.equals(all)) {
            return ApiResponse.ok(projectService.listAllForUser(userId));
        }
        return ApiResponse.ok(projectService.listForUser(userId, teamId));
    }

    @PostMapping("/projects")
    public ApiResponse<Map<String, Object>> createProject(Authentication auth, @RequestBody Map<String, Object> body) {
        Long userId = (Long) auth.getPrincipal();
        Long teamId = body.get("teamId") != null ? Long.valueOf(body.get("teamId").toString()) : null;
        return ApiResponse.ok(projectService.create(userId,
            (String) body.get("name"), (String) body.get("description"),
            body.get("template") != null ? body.get("template").toString() : "SCRUM", teamId));
    }

    @GetMapping("/projects/archived")
    public ApiResponse<List<Map<String, Object>>> archivedProjects(Authentication auth) {
        return ApiResponse.ok(projectService.listArchived((Long) auth.getPrincipal()));
    }

    @GetMapping("/projects/{id}")
    public ApiResponse<Map<String, Object>> project(@PathVariable Long id, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(projectService.getById(id, userId));
    }

    @PatchMapping("/projects/{id}")
    public ApiResponse<Map<String, Object>> updateProject(@PathVariable Long id, Authentication auth,
            @RequestBody Map<String, String> body) {
        return ApiResponse.ok(projectService.update(id, (Long) auth.getPrincipal(),
            body.get("name"), body.get("description")));
    }

    @PostMapping("/projects/{id}/archive")
    public ApiResponse<Void> archiveProject(@PathVariable Long id, Authentication auth) {
        projectService.archive(id, (Long) auth.getPrincipal());
        return ApiResponse.ok(null);
    }

    @PostMapping("/projects/{id}/restore")
    public ApiResponse<Void> restoreProject(@PathVariable Long id, Authentication auth) {
        projectService.restore(id, (Long) auth.getPrincipal());
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/projects/{id}")
    public ApiResponse<Void> deleteProject(@PathVariable Long id, Authentication auth) {
        projectService.delete(id, (Long) auth.getPrincipal());
        return ApiResponse.ok(null);
    }

    @GetMapping("/projects/{id}/members")
    public ApiResponse<List<Map<String, Object>>> projectMembers(@PathVariable Long id, Authentication auth) {
        return ApiResponse.ok(projectService.listMembers(id, (Long) auth.getPrincipal()));
    }

    @PostMapping("/projects/{id}/members")
    public ApiResponse<Map<String, Object>> inviteMember(@PathVariable Long id, Authentication auth,
            @RequestBody Map<String, String> body) {
        return ApiResponse.ok(projectService.inviteMember(id, (Long) auth.getPrincipal(),
            body.get("identifier"), body.get("role")));
    }

    @PatchMapping("/projects/{id}/members/{memberId}")
    public ApiResponse<Void> updateMemberRole(@PathVariable Long id, @PathVariable Long memberId,
            Authentication auth, @RequestBody Map<String, String> body) {
        projectService.updateMemberRole(id, (Long) auth.getPrincipal(), memberId, body.get("role"));
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/projects/{id}/members/{memberId}")
    public ApiResponse<Void> removeMember(@PathVariable Long id, @PathVariable Long memberId, Authentication auth) {
        projectService.removeMember(id, (Long) auth.getPrincipal(), memberId);
        return ApiResponse.ok(null);
    }

    @PutMapping("/projects/{id}/boards/order")
    public ApiResponse<Void> reorderBoards(@PathVariable Long id, Authentication auth,
            @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Number> ids = (List<Number>) body.get("boardIds");
        List<Long> boardIds = ids.stream().map(Number::longValue).toList();
        projectService.reorderBoards(id, (Long) auth.getPrincipal(), boardIds);
        return ApiResponse.ok(null);
    }

    @GetMapping("/projects/{id}/stats")
    public ApiResponse<Map<String, Object>> projectStats(@PathVariable Long id, Authentication auth) {
        return ApiResponse.ok(projectService.getStats(id, (Long) auth.getPrincipal()));
    }

    @PostMapping("/boards")
    public ApiResponse<Map<String, Object>> createBoard(Authentication auth, @RequestBody Map<String, Object> body) {
        Long projectId = Long.valueOf(body.get("projectId").toString());
        String name = (String) body.get("name");
        String type = body.get("type") != null ? body.get("type").toString() : "NORMAL";
        String template = body.get("template") != null ? body.get("template").toString() : type;
        boolean addMembers = Boolean.TRUE.equals(body.get("addProjectMembers"));
        return ApiResponse.ok(boardService.createBoard(projectId, name, type, template, addMembers));
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
    public ApiResponse<List<Map<String, Object>>> mindmaps(Authentication auth,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {
        return ApiResponse.ok(mindmapService.listForUser((Long) auth.getPrincipal(), projectId, sortBy, sortDir));
    }

    @GetMapping("/mindmaps/archived")
    public ApiResponse<List<Map<String, Object>>> archivedMindmaps(Authentication auth) {
        return ApiResponse.ok(mindmapService.listArchived((Long) auth.getPrincipal()));
    }

    @PostMapping("/mindmaps")
    public ApiResponse<Map<String, Object>> createMindmap(Authentication auth, @RequestBody Map<String, Object> body) {
        Long userId = (Long) auth.getPrincipal();
        Long projectId = body.get("projectId") != null ? Long.valueOf(body.get("projectId").toString()) : null;
        return ApiResponse.ok(mindmapService.create(userId,
            (String) body.get("name"), projectId, (String) body.get("content")));
    }

    @PostMapping("/mindmaps/import")
    public ApiResponse<Map<String, Object>> importMindmap(Authentication auth,
            @RequestParam String name,
            @RequestParam(required = false) Long projectId,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
        return ApiResponse.ok(mindmapService.importFile((Long) auth.getPrincipal(), name, projectId, file));
    }

    @GetMapping("/workspace/dashboard")
    public ApiResponse<Map<String, Object>> dashboard(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(workspaceService.getDashboard(userId));
    }

    @GetMapping("/workspace/activities")
    public ApiResponse<List<Map<String, Object>>> activities(Authentication auth,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "20") int limit) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(workspaceService.getActivities(userId, offset, limit));
    }

    @DeleteMapping("/workspace/visits/{id}")
    public ApiResponse<Void> removeVisit(@PathVariable Long id, Authentication auth) {
        workspaceService.removeVisit((Long) auth.getPrincipal(), id);
        return ApiResponse.ok(null);
    }

    @PostMapping("/boards/{boardId}/star")
    public ApiResponse<Void> starBoard(@PathVariable Long boardId, Authentication auth) {
        workspaceService.starBoard((Long) auth.getPrincipal(), boardId);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/boards/{boardId}/star")
    public ApiResponse<Void> unstarBoard(@PathVariable Long boardId, Authentication auth) {
        workspaceService.unstarBoard((Long) auth.getPrincipal(), boardId);
        return ApiResponse.ok(null);
    }

    @PostMapping("/boards/{boardId}/archive")
    public ApiResponse<Void> archiveBoard(@PathVariable Long boardId, Authentication auth) {
        workspaceService.archiveBoard((Long) auth.getPrincipal(), boardId);
        return ApiResponse.ok(null);
    }

    @GetMapping("/boards/{boardId}/columns")
    public ApiResponse<List<Map<String, Object>>> boardColumns(@PathVariable Long boardId) {
        return ApiResponse.ok(workspaceService.getBoardColumns(boardId));
    }

    @PatchMapping("/cards/{cardId}/column")
    public ApiResponse<Map<String, Object>> quickMoveCard(@PathVariable Long cardId,
            @RequestBody Map<String, Object> body, Authentication auth) {
        Long columnId = Long.valueOf(body.get("columnId").toString());
        return ApiResponse.ok(workspaceService.quickMoveCard((Long) auth.getPrincipal(), cardId, columnId));
    }

    @GetMapping("/my/boards")
    public ApiResponse<List<Map<String, Object>>> myBoards(Authentication auth,
            @RequestParam(required = false) String filter,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {
        return ApiResponse.ok(myBoardsService.listBoards((Long) auth.getPrincipal(), filter, sortBy, sortDir));
    }

    @GetMapping("/my/boards/archived")
    public ApiResponse<List<Map<String, Object>>> archivedBoards(Authentication auth) {
        return ApiResponse.ok(myBoardsService.listArchivedBoards((Long) auth.getPrincipal()));
    }

    @PutMapping("/my/boards/order")
    public ApiResponse<Void> myBoardsOrder(Authentication auth, @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Number> ids = (List<Number>) body.get("boardIds");
        myBoardsService.reorderBoards((Long) auth.getPrincipal(), ids.stream().map(Number::longValue).toList());
        return ApiResponse.ok(null);
    }

    @PostMapping("/my/boards")
    public ApiResponse<Map<String, Object>> createMyBoard(Authentication auth, @RequestBody Map<String, Object> body) {
        Long projectId = body.get("projectId") != null ? Long.valueOf(body.get("projectId").toString()) : null;
        boolean addMembers = Boolean.TRUE.equals(body.get("addProjectMembers"));
        return ApiResponse.ok(myBoardsService.createBoard((Long) auth.getPrincipal(),
            (String) body.get("name"), body.get("template") != null ? body.get("template").toString() : "NORMAL",
            projectId, addMembers));
    }

    @PatchMapping("/boards/{boardId}")
    public ApiResponse<Void> renameBoard(@PathVariable Long boardId, Authentication auth,
            @RequestBody Map<String, String> body) {
        myBoardsService.renameBoard((Long) auth.getPrincipal(), boardId, body.get("name"));
        return ApiResponse.ok(null);
    }

    @PatchMapping("/boards/{boardId}/project")
    public ApiResponse<Void> moveBoard(@PathVariable Long boardId, Authentication auth,
            @RequestBody Map<String, Object> body) {
        Long projectId = Long.valueOf(body.get("projectId").toString());
        myBoardsService.moveBoard((Long) auth.getPrincipal(), boardId, projectId);
        return ApiResponse.ok(null);
    }

    @PostMapping("/boards/{boardId}/copy")
    public ApiResponse<Map<String, Object>> copyBoard(@PathVariable Long boardId, Authentication auth) {
        return ApiResponse.ok(myBoardsService.copyBoard((Long) auth.getPrincipal(), boardId));
    }

    @DeleteMapping("/boards/{boardId}")
    public ApiResponse<Void> deleteBoard(@PathVariable Long boardId, Authentication auth) {
        myBoardsService.deleteBoard((Long) auth.getPrincipal(), boardId);
        return ApiResponse.ok(null);
    }

    @PostMapping("/boards/{boardId}/restore")
    public ApiResponse<Void> restoreBoard(@PathVariable Long boardId, Authentication auth) {
        myBoardsService.restoreBoard((Long) auth.getPrincipal(), boardId);
        return ApiResponse.ok(null);
    }

    @GetMapping("/mindmaps/{id}")
    public ApiResponse<Map<String, Object>> getMindmap(@PathVariable Long id, Authentication auth) {
        return ApiResponse.ok(mindmapService.getById(id, (Long) auth.getPrincipal()));
    }

    @PatchMapping("/mindmaps/{id}")
    public ApiResponse<Void> renameMindmap(@PathVariable Long id, Authentication auth,
            @RequestBody Map<String, String> body) {
        mindmapService.rename(id, (Long) auth.getPrincipal(), body.get("name"));
        return ApiResponse.ok(null);
    }

    @PatchMapping("/mindmaps/{id}/content")
    public ApiResponse<Void> updateMindmapContent(@PathVariable Long id, Authentication auth,
            @RequestBody Map<String, String> body) {
        mindmapService.updateContent(id, (Long) auth.getPrincipal(), body.get("content"));
        return ApiResponse.ok(null);
    }

    @PatchMapping("/mindmaps/{id}/project")
    public ApiResponse<Void> moveMindmap(@PathVariable Long id, Authentication auth,
            @RequestBody Map<String, Object> body) {
        Long projectId = body.get("projectId") != null ? Long.valueOf(body.get("projectId").toString()) : null;
        mindmapService.move(id, (Long) auth.getPrincipal(), projectId);
        return ApiResponse.ok(null);
    }

    @PostMapping("/mindmaps/{id}/archive")
    public ApiResponse<Void> archiveMindmap(@PathVariable Long id, Authentication auth) {
        mindmapService.archive(id, (Long) auth.getPrincipal());
        return ApiResponse.ok(null);
    }

    @PostMapping("/mindmaps/{id}/restore")
    public ApiResponse<Void> restoreMindmap(@PathVariable Long id, Authentication auth) {
        mindmapService.restore(id, (Long) auth.getPrincipal());
        return ApiResponse.ok(null);
    }

    @PostMapping("/mindmaps/{id}/copy")
    public ApiResponse<Map<String, Object>> copyMindmap(@PathVariable Long id, Authentication auth) {
        return ApiResponse.ok(mindmapService.copy(id, (Long) auth.getPrincipal()));
    }

    @DeleteMapping("/mindmaps/{id}")
    public ApiResponse<Void> deleteMindmap(@PathVariable Long id, Authentication auth) {
        mindmapService.delete(id, (Long) auth.getPrincipal());
        return ApiResponse.ok(null);
    }
}
