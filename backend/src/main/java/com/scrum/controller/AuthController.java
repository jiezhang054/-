package com.scrum.controller;

import com.scrum.common.ApiResponse;
import com.scrum.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired private AuthService authService;

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        return ApiResponse.ok(authService.login(body.get("username"), body.get("password")));
    }

    @PostMapping("/register")
    public ApiResponse<Map<String, Object>> register(@RequestBody Map<String, String> body) {
        return ApiResponse.ok(authService.register(
            body.get("username"), body.get("password"), body.get("displayName"), body.get("email")));
    }

    @PostMapping("/refresh")
    public ApiResponse<Map<String, Object>> refresh(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(authService.refresh(userId));
    }

    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> me(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(authService.getUser(userId));
    }

    @PutMapping("/profile")
    public ApiResponse<Map<String, Object>> updateProfile(Authentication auth, @RequestBody Map<String, String> body) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(authService.updateProfile(userId,
            body.get("displayName"), body.get("email"), body.get("avatar")));
    }

    @PutMapping("/password")
    public ApiResponse<Void> changePassword(Authentication auth, @RequestBody Map<String, String> body) {
        Long userId = (Long) auth.getPrincipal();
        authService.changePassword(userId, body.get("oldPassword"), body.get("newPassword"));
        return ApiResponse.ok(null);
    }

    @PutMapping("/settings")
    public ApiResponse<Map<String, Object>> updateSettings(Authentication auth, @RequestBody Map<String, String> body) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(authService.updateSettings(userId, body.get("background"), body.get("locale")));
    }
}
