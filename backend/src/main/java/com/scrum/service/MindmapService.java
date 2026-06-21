package com.scrum.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
public class MindmapService {
    @Autowired private JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<Map<String, Object>> listForUser(Long userId, Long projectId, String sortBy, String sortDir) {
        StringBuilder sql = new StringBuilder(
            "SELECT m.id, m.name, m.project_id as projectId, p.name as projectName, m.updated_at as updatedAt, m.owner_id as ownerId " +
            "FROM mindmaps m LEFT JOIN projects p ON m.project_id = p.id " +
            "WHERE (m.archived IS NULL OR m.archived = FALSE) AND (" +
            "m.owner_id = ? OR (m.project_id IS NOT NULL AND EXISTS (" +
            "SELECT 1 FROM project_members pm WHERE pm.project_id = m.project_id AND pm.user_id = ?)))");

        List<Object> params = new ArrayList<>(List.of(userId, userId));
        if (projectId != null) {
            sql.append(" AND m.project_id = ?");
            params.add(projectId);
        }

        String orderCol = "name".equals(sortBy) ? "m.name" : "m.updated_at";
        String dir = "asc".equalsIgnoreCase(sortDir) ? "ASC" : "DESC";
        sql.append(" ORDER BY ").append(orderCol).append(" ").append(dir);

        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }

    public Map<String, Object> getById(Long id, Long userId) {
        ensureAccess(id, userId);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT id, name, project_id as projectId, content, updated_at as updatedAt FROM mindmaps WHERE id = ?", id);
        if (rows.isEmpty()) throw new IllegalArgumentException("脑图不存在");
        return rows.get(0);
    }

    public Map<String, Object> create(Long userId, String name, Long projectId, String content) {
        if (!StringUtils.hasText(name)) throw new IllegalArgumentException("脑图名称不能为空");
        if (projectId != null) ensureProjectMember(projectId, userId);
        jdbcTemplate.update(
            "INSERT INTO mindmaps (name, project_id, owner_id, content) VALUES (?, ?, ?, ?)",
            name, projectId, userId, content != null ? content : defaultEmptyContent());
        Long id = jdbcTemplate.queryForObject("SELECT MAX(id) FROM mindmaps WHERE owner_id = ?", Long.class, userId);
        Map<String, Object> m = new HashMap<>();
        m.put("id", id);
        m.put("name", name);
        m.put("projectId", projectId);
        return m;
    }

    @Transactional
    public void rename(Long id, Long userId, String name) {
        ensureOwner(id, userId);
        if (!StringUtils.hasText(name)) throw new IllegalArgumentException("名称不能为空");
        jdbcTemplate.update("UPDATE mindmaps SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", name, id);
    }

    @Transactional
    public void move(Long id, Long userId, Long projectId) {
        ensureOwner(id, userId);
        if (projectId != null) ensureProjectMember(projectId, userId);
        jdbcTemplate.update("UPDATE mindmaps SET project_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            projectId, id);
    }

    @Transactional
    public void archive(Long id, Long userId) {
        ensureOwner(id, userId);
        jdbcTemplate.update("UPDATE mindmaps SET archived = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?", id);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        ensureOwner(id, userId);
        jdbcTemplate.update("DELETE FROM mindmaps WHERE id = ?", id);
    }

    @Transactional
    public Map<String, Object> copy(Long id, Long userId) {
        ensureAccess(id, userId);
        Map<String, Object> source = getById(id, userId);
        return create(userId, source.get("name") + " (副本)",
            source.get("projectId") != null ? ((Number) source.get("projectId")).longValue() : null,
            (String) source.get("content"));
    }

    public List<Map<String, Object>> listArchived(Long userId) {
        return jdbcTemplate.queryForList(
            "SELECT m.id, m.name, p.name as projectName FROM mindmaps m " +
            "LEFT JOIN projects p ON m.project_id = p.id " +
            "WHERE m.owner_id = ? AND m.archived = TRUE ORDER BY m.updated_at DESC", userId);
    }

    @Transactional
    public void restore(Long id, Long userId) {
        ensureOwner(id, userId);
        jdbcTemplate.update("UPDATE mindmaps SET archived = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?", id);
    }

    @Transactional
    public void updateContent(Long id, Long userId, String content) {
        ensureAccess(id, userId);
        jdbcTemplate.update("UPDATE mindmaps SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            content != null ? content : defaultEmptyContent(), id);
    }

    public Map<String, Object> importFile(Long userId, String name, Long projectId, MultipartFile file) throws IOException {
        if (!StringUtils.hasText(name)) throw new IllegalArgumentException("脑图名称不能为空");
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        String content;
        if (filename.endsWith(".xmind")) {
            content = convertXmindToContent(file.getInputStream());
        } else {
            content = new String(file.getBytes(), StandardCharsets.UTF_8);
            normalizeMindmapContent(content);
        }
        return create(userId, name, projectId, content);
    }

    private String defaultEmptyContent() {
        return "{\"layout\":\"logicalStructure\",\"root\":{\"data\":{\"text\":\"中心主题\"},\"children\":[]}}";
    }

    private void normalizeMindmapContent(String content) {
        try {
            JsonNode node = objectMapper.readTree(content);
            if (node.has("root") && node.get("root").has("data")) return;
            if (node.has("data") && node.get("data").has("text")) return;
            if (node.has("nodes")) return;
            throw new IllegalArgumentException("JSON 需为脑图树形格式（root.data.text）或兼容格式");
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("无效的 JSON 格式");
        }
    }

    private String convertXmindToContent(InputStream in) throws IOException {
        try (ZipInputStream zip = new ZipInputStream(in)) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                if ("content.json".equals(entry.getName())) {
                    String json = new String(zip.readAllBytes(), StandardCharsets.UTF_8);
                    return xmindJsonToMindMapTree(json);
                }
            }
        }
        throw new IllegalArgumentException("无效的 XMind 文件（缺少 content.json）");
    }

    private String xmindJsonToMindMapTree(String xmindJson) throws IOException {
        JsonNode sheets = objectMapper.readTree(xmindJson);
        if (!sheets.isArray() || sheets.isEmpty()) throw new IllegalArgumentException("XMind 内容为空");
        JsonNode root = sheets.get(0).get("rootTopic");
        if (root == null) throw new IllegalArgumentException("XMind 缺少根节点");
        return objectMapper.writeValueAsString(wrapMindMapTree(buildTopicTree(root)));
    }

    private Map<String, Object> buildTopicTree(JsonNode topic) {
        String id = topic.has("id") ? topic.get("id").asText() : UUID.randomUUID().toString();
        String title = topic.has("title") ? topic.get("title").asText() : "节点";
        Map<String, Object> data = new HashMap<>();
        data.put("text", title);
        data.put("uid", id);

        List<Map<String, Object>> children = new ArrayList<>();
        JsonNode attached = topic.path("children").path("attached");
        if (attached.isArray()) {
            for (JsonNode child : attached) {
                children.add(buildTopicTree(child));
            }
        }

        Map<String, Object> tree = new HashMap<>();
        tree.put("data", data);
        tree.put("children", children);
        return tree;
    }

    private Map<String, Object> wrapMindMapTree(Map<String, Object> rootTree) {
        Map<String, Object> wrapped = new HashMap<>();
        wrapped.put("layout", "logicalStructure");
        wrapped.put("root", rootTree);
        return wrapped;
    }

    private void ensureAccess(Long mindmapId, Long userId) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM mindmaps m WHERE m.id = ? AND (m.owner_id = ? OR (m.project_id IS NOT NULL AND EXISTS (" +
            "SELECT 1 FROM project_members pm WHERE pm.project_id = m.project_id AND pm.user_id = ?)))",
            Integer.class, mindmapId, userId, userId);
        if (count == null || count == 0) throw new IllegalArgumentException("无权访问该脑图");
    }

    private void ensureOwner(Long mindmapId, Long userId) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM mindmaps WHERE id = ? AND owner_id = ?", Integer.class, mindmapId, userId);
        if (count == null || count == 0) throw new IllegalArgumentException("仅所有者可执行此操作");
    }

    private void ensureProjectMember(Long projectId, Long userId) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM project_members WHERE project_id = ? AND user_id = ?",
            Integer.class, projectId, userId);
        if (count == null || count == 0) throw new IllegalArgumentException("无权访问该项目");
    }
}
