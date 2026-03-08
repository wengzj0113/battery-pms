# Tasks

## 任务列表

- [x] Task 1: 后端 - 项目计划数据存储与接口
  - [x] SubTask 1.1: 在项目数据结构中初始化 plans 字段并兼容旧数据
  - [x] SubTask 1.2: 新增计划项接口（GET/POST /api/projects/:id/plans）
  - [x] SubTask 1.3: 更新与删除接口（PUT/DELETE /api/projects/:id/plans/:planId）
  - [x] SubTask 1.4: 复用项目访问权限校验并补齐错误码（400/403/404）

- [x] Task 2: 前端 - 项目计划管理 UI 与导航入口
  - [x] SubTask 2.1: 新增路由 `/project-plans` 与页面组件
  - [x] SubTask 2.2: 左侧导航与移动抽屉新增“项目计划管理”菜单项
  - [x] SubTask 2.3: 计划项列表展示与新增/编辑/删除/完成交互
  - [x] SubTask 2.4: 对接前端 API（新增 plans API 方法）

- [x] Task 3: 验证与回归
  - [x] SubTask 3.1: 管理员可对任意项目增删改查计划项
  - [x] SubTask 3.2: 非管理员仅可对可见项目增删改查计划项
  - [x] SubTask 3.3: 缺字段/日期无效/不存在项目/不存在计划项返回正确错误并前端提示清晰
  - [x] SubTask 3.4: 桌面侧边栏与移动抽屉菜单行为一致（可进入并高亮正确）

# Task Dependencies
- Task 2 依赖 Task 1
- Task 3 依赖 Task 1 与 Task 2
