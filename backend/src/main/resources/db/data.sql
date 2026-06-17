-- Seed data
INSERT INTO users (username, password, display_name, email) VALUES
('zhang', 'pending', '张茗杰', 'zhang@example.com'),
('yin', 'pending', '殷浩然', 'yin@example.com'),
('zhong', 'pending', '钟礼豪', 'zhong@example.com'),
('zang', 'pending', '臧传杨', 'zang@example.com');

INSERT INTO projects (name, description, owner_id) VALUES ('电商重构项目', '敏捷重构电商平台核心模块', 1);

INSERT INTO project_members (project_id, user_id, role) VALUES
(1, 1, 'OWNER'), (1, 2, 'MEMBER'), (1, 3, 'MEMBER'), (1, 4, 'MEMBER');

INSERT INTO boards (name, type, project_id, swimlanes_enabled, start_date, end_date) VALUES
('产品路线图', 'ROADMAP', 1, FALSE, NULL, NULL),
('里程碑 V1.0', 'MILESTONE', 1, TRUE, '2026-05-01', '2026-06-30'),
('Sprint 1', 'SPRINT', 1, TRUE, '2026-06-01', '2026-06-14'),
('Sprint 2', 'SPRINT', 1, TRUE, '2026-06-15', '2026-06-28');

UPDATE boards SET parent_board_id = 1 WHERE id = 2;
UPDATE boards SET parent_board_id = 2 WHERE id IN (3, 4);

-- board_columns ids: 1-2 roadmap, 3-5 milestone, 6-8 sprint1
INSERT INTO board_columns (board_id, name, sort_order) VALUES
(1, 'Q2 里程碑', 0), (1, 'Q3 规划', 1),
(2, '用户故事池', 0), (2, '用户故事-待梳理', 1), (2, '用户故事-梳理完成', 2),
(3, '待办', 0), (3, '进行中', 1), (3, '已完成', 2);

-- swimlanes ids: 1-2 milestone, 3-5 sprint1
INSERT INTO swimlanes (board_id, name, sort_order) VALUES
(2, '用户中心', 0), (2, '交易系统', 1),
(3, '登录功能', 0), (3, '支付模块', 1), (3, '购物车', 2);

-- Cards: column_id 1-2=roadmap, 3-5=milestone cols, 6-8=sprint cols
INSERT INTO cards (board_id, column_id, swimlane_id, title, type, sort_order, workload, due_date, description) VALUES
(1, 1, NULL, '用户中心重构', 'EPIC', 0, 13, NULL, '重构用户注册、登录、个人中心'),
(1, 1, NULL, '交易系统升级', 'EPIC', 1, 21, NULL, NULL),
(1, 2, NULL, '移动端适配', 'EPIC', 0, 8, NULL, NULL),
(2, 3, 1, '用户中心重构', 'EPIC', 0, 13, NULL, NULL),
(2, 5, 1, '登录功能', 'USER_STORY', 0, 3, '2026-06-20', '作为用户，我希望通过邮箱登录'),
(2, 5, 1, '注册功能', 'USER_STORY', 1, 2, NULL, NULL),
(2, 3, 2, '交易系统升级', 'EPIC', 0, 21, NULL, NULL),
(2, 5, 2, '支付模块', 'USER_STORY', 0, 5, NULL, NULL),
(2, 4, 2, '购物车功能', 'USER_STORY', 1, 5, NULL, NULL),
(3, 6, 3, '登录功能', 'USER_STORY', 0, 3, '2026-06-20', NULL),
(3, 6, 3, 'OAuth 集成', 'TASK', 1, 2, NULL, NULL),
(3, 7, 4, '支付模块', 'USER_STORY', 0, 5, '2026-06-18', NULL),
(3, 7, 4, '微信支付', 'TASK', 1, 3, NULL, NULL),
(3, 6, 5, '购物车', 'USER_STORY', 0, 5, NULL, NULL),
(3, 8, 3, '注册流程', 'USER_STORY', 0, 2, NULL, NULL);

INSERT INTO card_members (card_id, user_id) VALUES (10, 1), (10, 3), (12, 2), (12, 4), (14, 3);

INSERT INTO card_checklist (card_id, text, done, sort_order) VALUES (10, '接口定义', TRUE, 0), (10, 'UI稿', FALSE, 1);

INSERT INTO starred_boards (user_id, board_id) VALUES (3, 2), (3, 3);

INSERT INTO mind_maps (project_id, name, content) VALUES (1, '电商重构脑图', '{"nodes":[],"edges":[]}');
