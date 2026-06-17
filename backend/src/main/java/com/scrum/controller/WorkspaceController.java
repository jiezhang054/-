package com.scrum.controller;

import com.scrum.common.ApiResponse;
import com.scrum.service.WorkspaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class WorkspaceController {
    @Autowired private WorkspaceService workspaceService;

    @GetMapping("/workspace/dashboard")
    public ApiResponse<Map<String, Object>> dashboard(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(workspaceService.getDashboard(userId));
    }

    @GetMapping("/projects")
    public ApiResponse<List<Map<String, Object>>> projects() {
        return ApiResponse.ok(workspaceService.getProjects());
    }

    @GetMapping("/projects/{id}")
    public ApiResponse<Map<String, Object>> project(@PathVariable Long id) {
        return ApiResponse.ok(workspaceService.getProjects().stream()
            .filter(p -> id.equals(p.get("id"))).findFirst()
            .orElseThrow(() -> new RuntimeException("项目不存在")));
    }
}
