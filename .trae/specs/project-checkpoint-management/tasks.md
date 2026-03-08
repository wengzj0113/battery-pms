# Tasks

## 任务列表

- [x] Task 1: 后端 - 卡点数据存储与接口
  - [x] SubTask 1.1: 定义卡点数据结构并落盘到 data.json
  - [x] SubTask 1.2: 新增卡点接口（GET/POST /api/projects/:id/checkpoints）
  - [x] SubTask 1.3: 更新与删除接口（PUT/DELETE /api/projects/:id/checkpoints/:checkpointId）
  - [x] SubTask 1.4: 复用项目访问权限校验并补齐错误码（400/403/404）

- [x] Task 2: 前端 - 项目卡点管理 UI
  - [x] SubTask 2.1: 在项目详情页增加“卡点管理”模块入口与列表展示
  - [x] SubTask 2.2: 新增/编辑卡点对话框（校验 title、planned_date）
  - [x] SubTask 2.3: 支持标记完成与删除确认
  - [x] SubTask 2.4: 对接前端 API（新增 checkpoints API 方法）

- [x] Task 3: 验证与回归
  - [x] SubTask 3.1: 管理员可对任意项目增删改查卡点
  - [x] SubTask 3.2: 非管理员仅可对有权限项目增删改查卡点
  - [x] SubTask 3.3: 缺字段/不存在项目/不存在卡点返回正确错误并前端提示清晰

# Task Dependencies
- Task 2 依赖 Task 1
- Task 3 依赖 Task 1 与 Task 2
