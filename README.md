# Scrum 管理软件

对标 [lg.team](https://www.lg.team/) 的 Scrum 敏捷管理工具，React + Spring Boot 前后端分离。

## 快速启动

### 前端
```bash
cd fronted
npm install
npm run dev
```
访问 http://localhost:5173 ，演示账号 `zhong` / `123456`

> 本地开发目录为 `frontend/`，远程仓库以 `fronted/` 为准。

### 后端
```bash
cd backend
mvn spring-boot:run
```
API: http://localhost:8080/api  
Swagger: http://localhost:8080/swagger-ui.html

## 文档

- `需求.html` — 功能需求规格
- `docs/ER.md` — 数据库 ER 设计
- `docs/UI-DESIGN.md` — UI 设计说明

## 联调测试

- 工作台（近期事项、星标、最近访问、动态）
- 看板详情（列×泳道×卡片拖拽）
- Scrum 链路（产品路线图 → 里程碑 → Sprint）
- 燃尽图统计、时间线、图表板
- 脑图编辑器（JSON 导入导出）
- 跨看板引用卡片同步
- WebSocket 实时协作
- 中英文国际化

## 联调测试

```powershell
powershell -File scripts/integration-test.ps1
```

## 技术栈

- 前端：React 18 + TypeScript + Vite + Ant Design + Zustand + TanStack Query + @dnd-kit
- 后端：Spring Boot 3 + MyBatis Plus + H2/MySQL + JWT + WebSocket
