# Scrum 敏捷管理工具 — 前端

基于 **React + TypeScript + Vite** 的单页应用，对标 [lg.team](https://www.lg.team/)，提供看板、Scrum 流程、统计与脑图编辑等能力。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19、TypeScript、Vite 8 |
| UI | Ant Design 6、Ant Design Icons |
| 路由 | React Router 7 |
| 状态 | Zustand（认证/UI）、TanStack Query（服务端数据） |
| 表单 | React Hook Form + Zod |
| 拖拽 | @dnd-kit |
| 图表 | ECharts + echarts-for-react |
| 脑图 | simple-mind-map |
| 国际化 | i18next + react-i18next |
| HTTP | Axios |

## 环境要求

- Node.js 18+
- npm 9+

后端服务需先启动在 `http://localhost:8080`（见 [../backend/README.md](../backend/README.md)）。

## 快速开始

```bash
cd fronted
npm install
npm run dev
```

浏览器访问 http://localhost:5173

**演示账号：** `zhong` / `123456`

### 其他命令

```bash
npm run build    # 类型检查 + 生产构建，产物在 dist/
npm run preview  # 预览生产构建
```

## 开发配置

### 环境变量

`.env.development`：

```
VITE_API_BASE_URL=http://localhost:8080/api
```

### 开发代理

`vite.config.ts` 将请求代理到后端：

| 路径 | 目标 |
|------|------|
| `/api/*` | `http://localhost:8080` |
| `/ws/*` | `ws://localhost:8080`（WebSocket） |

本地开发时前端统一走相对路径 `/api`，无需处理跨域。

## 目录结构

```
fronted/src/
├── api/              # API 封装（auth、boards、global、my）
├── components/
│   ├── auth/         # 认证引导
│   ├── board/        # 看板核心（列、泳道、卡片、拖拽、详情抽屉）
│   ├── common/       # 通用组件
│   ├── global/       # 全局弹窗（新建看板/项目/脑图、通知）
│   ├── layout/       # 布局（TopBar、Sidebar、AppLayout）
│   ├── mindmap/      # 脑图编辑器（MindMapEditor）
│   ├── project/      # 项目相关组件
│   └── workspace/    # 工作台四象限组件
├── constants/        # 常量（看板模板、工作台展示限制等）
├── hooks/            # 自定义 Hooks（WebSocket、媒体查询）
├── i18n/             # 中英文语言包
├── pages/            # 页面级组件
│   ├── auth/         # 登录、注册
│   ├── board/        # 看板详情、统计、时间线、图表
│   ├── mindmap/      # 脑图列表与编辑器
│   ├── my/           # 个人看板/脑图、归档
│   ├── project/      # 项目详情与统计
│   ├── settings/     # 个人设置
│   └── workspace/    # 工作台
├── router/           # 路由与鉴权守卫
├── stores/           # Zustand 状态
├── styles/           # 全局与各模块样式
├── types/            # TypeScript 类型
└── utils/            # 工具函数（看板、脑图数据转换）
```

## 主要路由

| 路径 | 说明 |
|------|------|
| `/login` | 登录 |
| `/register` | 注册 |
| `/workspace` | 工作台 |
| `/projects/:id` | 项目详情 |
| `/projects/:id/stats` | 项目统计 |
| `/board/:id` | 看板详情（核心） |
| `/board/:id/stats` | 燃尽图 |
| `/board/:id/timeline` | 时间线 |
| `/board/:id/charts` | 图表板 |
| `/my/boards` | 个人看板列表 |
| `/my/mindmaps` | 个人脑图列表 |
| `/mindmap/:id` | 脑图编辑器 |
| `/settings/profile` | 个人资料 |
| `/demo` | 演示页面索引 |

## 功能模块

### 工作台

四象限布局：近期事项、星标看板、最近访问、卡片动态。内容高度随条目自适应，超出各自最大高度后区域内滚动；最近访问与动态有展示数量上限。

### 看板

- 列 × 泳道 × 卡片布局，@dnd-kit 拖拽排序
- 卡片详情抽屉、筛选、批量操作、成员管理
- 看板设置（可见性、周期、导入导出）
- WebSocket 实时同步（`useBoardWebSocket`）

### Scrum 链路

产品路线图 → 里程碑看板 → Sprint 看板，由后端自动生成，前端通过项目页与规划弹窗操作。

### 脑图

基于 `simple-mind-map`，支持 14 种布局切换、节点增删改、自动保存、JSON/XMind 导入导出。

### 国际化

默认中文，可通过 TopBar 切换英文（`i18n/locales/`）。

## 与后端联调

1. 启动后端：`cd backend && mvn spring-boot:run`
2. 启动前端：`cd fronted && npm run dev`
3. 根目录运行集成测试：

```powershell
powershell -File ../scripts/integration-test.ps1
```

## 相关文档

- [项目总览](../README.md)
- [需求规格](../需求.html)
- [UI 设计](../docs/UI-DESIGN.md)
- [中期汇报分工](../docs/分工.html)
