# Scrum 管理软件

对标 [lg.team](https://www.lg.team/) 的 Scrum 敏捷管理工具，React + Spring Boot 前后端分离。

## 快速启动

### 前端
```bash
cd frontend
npm install
npm run dev
```
访问 http://localhost:5173 ，演示账号 `zhong` / `123456`

### 后端
```bash
cd backend
mvn spring-boot:run
```
API: http://localhost:8080/api

## 功能

- 工作台（近期事项、星标、最近访问、动态）
- 看板详情（列×泳道×卡片拖拽）
- Scrum 链路（产品路线图 → 里程碑 → Sprint）
- 燃尽图统计、时间线、图表板
- 脑图编辑器（JSON 导入导出）
- 跨看板引用卡片同步
- WebSocket 实时协作
- 中英文国际化

## 技术栈

- 前端：React 18 + TypeScript + Vite + Ant Design + Zustand + TanStack Query + @dnd-kit
- 后端：Spring Boot 3 + MyBatis Plus + H2/MySQL + JWT + WebSocket
