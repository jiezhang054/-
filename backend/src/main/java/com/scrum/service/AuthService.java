package com.scrum.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scrum.entity.User;
import com.scrum.mapper.UserMapper;
import com.scrum.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {
    @Autowired private UserMapper userMapper;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;

    public Map<String, Object> login(String username, String password) {
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username));
        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("用户名或密码错误");
        }
        return buildAuthResponse(user);
    }

    public Map<String, Object> register(String username, String password, String displayName, String email) {
        if (!StringUtils.hasText(username) || !StringUtils.hasText(password) || !StringUtils.hasText(displayName)) {
            throw new IllegalArgumentException("用户名、密码和显示名称不能为空");
        }
        if (userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username)) != null) {
            throw new IllegalArgumentException("用户名已存在");
        }
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setDisplayName(displayName);
        user.setEmail(email);
        user.setBackground("default");
        user.setLocale("zh-CN");
        userMapper.insert(user);
        return buildAuthResponse(user);
    }

    public Map<String, Object> refresh(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) throw new IllegalArgumentException("用户不存在");
        return buildAuthResponse(user);
    }

    public Map<String, Object> getUser(Long userId) {
        return toUserMap(requireUser(userId));
    }

    public Map<String, Object> updateProfile(Long userId, String displayName, String email, String avatar) {
        User user = requireUser(userId);
        if (StringUtils.hasText(displayName)) user.setDisplayName(displayName);
        if (email != null) user.setEmail(email);
        if (avatar != null) user.setAvatar(avatar);
        userMapper.updateById(user);
        return toUserMap(user);
    }

    public void changePassword(Long userId, String oldPassword, String newPassword) {
        if (!StringUtils.hasText(newPassword) || newPassword.length() < 6) {
            throw new IllegalArgumentException("新密码至少 6 位");
        }
        User user = requireUser(userId);
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new IllegalArgumentException("原密码错误");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userMapper.updateById(user);
    }

    public Map<String, Object> updateSettings(Long userId, String background, String locale) {
        User user = requireUser(userId);
        if (background != null) user.setBackground(background);
        if (locale != null) user.setLocale(locale);
        userMapper.updateById(user);
        return toUserMap(user);
    }

    private User requireUser(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) throw new IllegalArgumentException("用户不存在");
        return user;
    }

    private Map<String, Object> buildAuthResponse(User user) {
        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("user", toUserMap(user));
        return result;
    }

    private Map<String, Object> toUserMap(User user) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", user.getId());
        m.put("username", user.getUsername());
        m.put("displayName", user.getDisplayName());
        m.put("email", user.getEmail());
        m.put("avatar", user.getAvatar());
        m.put("background", user.getBackground());
        m.put("locale", user.getLocale());
        return m;
    }
}
