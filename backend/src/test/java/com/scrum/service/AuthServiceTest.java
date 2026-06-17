package com.scrum.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scrum.entity.User;
import com.scrum.mapper.UserMapper;
import com.scrum.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class AuthServiceTest {
    @Autowired private AuthService authService;
    @Autowired private UserMapper userMapper;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;

    @Test
    void registerLoginAndProfile() {
        Map<String, Object> reg = authService.register("testuser", "123456", "测试用户", "test@example.com");
        assertNotNull(reg.get("token"));
        @SuppressWarnings("unchecked")
        Map<String, Object> user = (Map<String, Object>) reg.get("user");
        assertEquals("testuser", user.get("username"));

        Map<String, Object> login = authService.login("testuser", "123456");
        assertNotNull(login.get("token"));

        Long userId = ((Number) user.get("id")).longValue();
        Map<String, Object> profile = authService.updateProfile(userId, "新昵称", "new@example.com", null);
        assertEquals("新昵称", profile.get("displayName"));

        authService.changePassword(userId, "123456", "654321");
        assertDoesNotThrow(() -> authService.login("testuser", "654321"));

        User dbUser = userMapper.selectById(userId);
        assertTrue(passwordEncoder.matches("654321", dbUser.getPassword()));
    }

    @Test
    void refreshToken() {
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, "zhong"));
        assertNotNull(user);
        Map<String, Object> refreshed = authService.refresh(user.getId());
        assertNotNull(refreshed.get("token"));
        String token = (String) refreshed.get("token");
        assertEquals(user.getId(), jwtUtil.parseToken(token).get("userId", Long.class));
    }
}
