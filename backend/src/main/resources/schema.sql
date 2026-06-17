CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    email VARCHAR(128),
    avatar VARCHAR(512),
    background VARCHAR(64) DEFAULT 'default',
    locale VARCHAR(16) DEFAULT 'zh-CN'
);

CREATE TABLE IF NOT EXISTS projects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description VARCHAR(512),
    owner_id BIGINT NOT NULL,
    template VARCHAR(32) DEFAULT 'SCRUM',
    archived BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS project_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(16) NOT NULL DEFAULT 'MEMBER',
    UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS boards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(16) NOT NULL DEFAULT 'NORMAL',
    project_id BIGINT NOT NULL,
    parent_board_id BIGINT,
    swimlanes_enabled BOOLEAN DEFAULT FALSE,
    start_date DATE,
    end_date DATE,
    visibility VARCHAR(16) DEFAULT 'PROJECT',
    archived BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS board_columns (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    board_id BIGINT NOT NULL,
    name VARCHAR(128) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS swimlanes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    board_id BIGINT NOT NULL,
    name VARCHAR(128) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    board_id BIGINT NOT NULL,
    column_id BIGINT NOT NULL,
    swimlane_id BIGINT,
    title VARCHAR(256) NOT NULL,
    description TEXT,
    type VARCHAR(16) NOT NULL DEFAULT 'TASK',
    sort_order INT NOT NULL DEFAULT 0,
    workload INT DEFAULT 0,
    due_date DATE,
    start_date DATE,
    is_reference BOOLEAN DEFAULT FALSE,
    source_card_id BIGINT,
    version INT DEFAULT 1,
    deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS card_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    card_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    UNIQUE(card_id, user_id)
);

CREATE TABLE IF NOT EXISTS starred_boards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    board_id BIGINT NOT NULL,
    UNIQUE(user_id, board_id)
);

CREATE TABLE IF NOT EXISTS recent_visits (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    target_type VARCHAR(16) NOT NULL,
    target_id BIGINT NOT NULL,
    name VARCHAR(256) NOT NULL,
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    action VARCHAR(256) NOT NULL,
    card_id BIGINT,
    board_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS burndown_snapshots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    board_id BIGINT NOT NULL,
    snapshot_date DATE NOT NULL,
    remaining INT NOT NULL DEFAULT 0,
    completed INT NOT NULL DEFAULT 0,
    added INT NOT NULL DEFAULT 0,
    UNIQUE(board_id, snapshot_date)
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(32) NOT NULL,
    title VARCHAR(256) NOT NULL,
    content VARCHAR(512),
    link_type VARCHAR(16),
    link_id BIGINT,
    read_flag BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mindmaps (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    project_id BIGINT,
    owner_id BIGINT NOT NULL,
    content TEXT,
    archived BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
