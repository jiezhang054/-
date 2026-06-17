package com.scrum.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class NotificationService {
    @Autowired private JdbcTemplate jdbcTemplate;

    public List<Map<String, Object>> listForUser(Long userId) {
        return jdbcTemplate.queryForList(
            "SELECT id, type, title, content, link_type as linkType, link_id as linkId, " +
            "read_flag as read, created_at as createdAt FROM notifications " +
            "WHERE user_id = ? ORDER BY created_at DESC LIMIT 50", userId);
    }

    public int unreadCount(Long userId) {
        Integer c = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND read_flag = FALSE", Integer.class, userId);
        return c != null ? c : 0;
    }

    public void markRead(Long userId, Long notificationId) {
        jdbcTemplate.update(
            "UPDATE notifications SET read_flag = TRUE WHERE id = ? AND user_id = ?", notificationId, userId);
    }

    public void markAllRead(Long userId) {
        jdbcTemplate.update("UPDATE notifications SET read_flag = TRUE WHERE user_id = ?", userId);
    }
}
