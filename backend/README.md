# Scrum 敏捷管理工具 — 后端

基于 **Spring Boot 3** 的 RESTful API 服务，提供用户认证、项目管理、看板协作、Scrum 自动生成、统计度量、脑图持久化与 WebSocket 实时推送。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Spring Boot 3.2、Spring Security |
| ORM | MyBatis Plus 3.5 |
| 数据库 | H2（内存，开发默认）/ MySQL（可切换） |
| 认证 | JWT（jjwt 0.12） |
| 实时 | Spring WebSocket |
| 文档 | SpringDoc OpenAPI 3（Swagger UI） |
| 构建 | Maven、Java 17 |

## 环境要求

- JDK 17+
- Maven 3.8+

## 快速开始

```bash
cd backend
mvn spring-boot:run
```

启动成功后：

| 服务 | 地址 |
|------|------|
| API 根路径 | http://localhost:8080/api |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| H2 控制台 | http://localhost:8080/h2-console |

**H2 连接信息：** JDBC URL `jdbc:h2:mem:scrum`，用户名 `sa`，密码留空。

**演示账号：** `zhong` / `123456`（由 `DataInitializer` 种子数据注入）

### 测试与打包

```bash
mvn test              # 运行单元测试
mvn package -DskipTests  # 打包 jar（target/scrum-backend-1.0.0.jar）
java -jar target/scrum-backend-1.0.0.jar
```

## 配置说明

主配置文件 `src/main/resources/application.yml`：

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:h2:mem:scrum;...   # 内存数据库，重启后重置
  sql:
    init:
      mode: always
      schema-locations: classpath:schema.sql

jwt:
  secret: scrum-jwt-secret-key-...
  expiration: 86400000            # 24 小时（毫秒）
```

切换 MySQL 时修改 `datasource.url`、`driver-class-name` 及账号密码，并确保 `schema.sql` 已在目标库执行。

## 目录结构

```
backend/src/main/java/com/scrum/
├── ScrumApplication.java       # 启动类
├── config/
│   ├── DataInitializer.java  # 演示种子数据
│   ├── OpenApiConfig.java    # Swagger 配置
│   └── SecurityConfig.java   # 安全与 CORS
├── controller/
│   ├── AuthController.java   # /api/auth/*
│   ├── BoardController.java  # /api/boards/*
│   ├── CardController.java   # /api/boards/{id}/cards/*
│   ├── ColumnController.java # 列/泳道
│   └── GlobalController.java # 项目、工作台、脑图、通知等
├── service/
│   ├── AuthService.java
│   ├── BoardDetailService.java
│   ├── BoardService.java
│   ├── BurndownService.java      # 燃尽图
│   ├── MindmapService.java       # 脑图 CRUD、XMind 导入
│   ├── MyBoardsService.java
│   ├── NavigationService.java
│   ├── NotificationService.java
│   ├── ProjectService.java
│   ├── ScrumChainService.java    # 路线图→里程碑→Sprint 自动生成
│   └── WorkspaceService.java     # 工作台聚合
├── entity/                     # 实体类
├── mapper/                     # MyBatis Mapper
├── dto/                        # 数据传输对象
├── security/
│   ├── JwtAuthFilter.java
│   └── JwtUtil.java
├── websocket/
│   ├── WebSocketConfig.java
│   └── BoardWebSocketHandler.java
└── common/
    ├── ApiResponse.java        # 统一响应包装
    └── GlobalExceptionHandler.java

backend/src/main/resources/
├── application.yml
└── schema.sql                  # 建表脚本
```

## API 概览

所有接口前缀为 `/api`，除登录/注册外需在 Header 携带：

```
Authorization: Bearer <token>
```

统一响应格式：

```json
{
  "code": 0,
  "message": "ok",
  "data": { ... }
}
```

### 主要模块

| 模块 | 路径前缀 | 说明 |
|------|----------|------|
| 认证 | `/auth` | 登录、注册、刷新 Token、个人资料 |
| 项目 | `/projects` | CRUD、成员、归档、统计 |
| 看板 | `/boards` | 看板详情、列/泳道/卡片、导入导出 |
| 工作台 | `/workspace` | 仪表盘、活动流、快捷操作 |
| 个人 | `/my/boards` | 个人看板排序与管理 |
| 脑图 | `/mindmaps` | CRUD、内容持久化、XMind 导入 |
| 导航 | `/navigation` | 侧边栏树、最近访问 |
| 通知 | `/notifications` | 消息列表、已读标记 |
| WebSocket | `/ws/board/{boardId}` | 看板实时变更推送 |

完整接口列表见 Swagger UI。

## 核心业务

### Scrum 自动生成

`ScrumChainService` 实现任务书要求的核心链路：

1. 产品路线图中创建里程碑 → 自动生成里程碑看板
2. 里程碑看板规划 Sprint → 自动生成 Sprint 看板并映射用户故事

### 燃尽图

`BurndownService` 按 Sprint 周期计算剩余工作量，供前端 ECharts 渲染。

### 脑图存储

内容 JSON 格式：

```json
{
  "layout": "mindMap",
  "root": { "data": { "text": "根节点" }, "children": [] }
}
```

兼容旧版 ReactFlow `{ nodes, edges }` 格式；XMind 导入自动转换为树形结构。

### WebSocket

看板内卡片/列变更时向在线用户推送事件，前端据此刷新或做乐观更新。

## 数据库

- 建表脚本：`src/main/resources/schema.sql`
- ER 设计文档：[../docs/ER.md](../docs/ER.md)
- 开发环境使用 H2 内存库，应用启动时自动建表并注入演示数据

## 与前端联调

1. 启动本服务（端口 8080）
2. 前端 `fronted/` 通过 Vite 代理访问 `/api` 与 `/ws`
3. 根目录集成测试：

```powershell
powershell -File ../scripts/integration-test.ps1
```

当前联调脚本 **30/30** 用例通过。

## 相关文档

- [项目总览](../README.md)
- [前端 README](../fronted/README.md)
- [数据库 ER 图](../docs/ER.md)
- [需求规格](../需求.html)
- [中期汇报分工](../docs/分工.html)
