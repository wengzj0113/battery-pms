# Tasks

## 任务列表

- [x] Task 1: 后端 - Dashboard 下钻项目接口
  - [x] SubTask 1.1: 新增 GET /api/dashboard/projects（type/limit/offset）
  - [x] SubTask 1.2: 按统计口径实现 inProgress/expiring/accepted/all 筛选
  - [x] SubTask 1.3: 复用项目权限过滤并返回 total/items
  - [x] SubTask 1.4: 参数校验与错误码（400/401）

- [x] Task 2: 前端 - 统计卡片点击下钻弹窗
  - [x] SubTask 2.1: Dashboard 统计卡片增加可点击态与 hover 样式
  - [x] SubTask 2.2: 新增下钻项目列表页面（loading/空/错误/跳转详情/返回）
  - [x] SubTask 2.3: 配置路由并在点击卡片时跳转（携带 type）
  - [x] SubTask 2.4: 对接 /api/dashboard/projects 并实现分页（limit/offset）

- [x] Task 3: 验证与回归
  - [x] SubTask 3.1: 点击“进行中/即将到期/已验收”能弹出正确项目列表
  - [x] SubTask 3.2: 非管理员仅看到可见项目，数据口径与统计一致
  - [x] SubTask 3.3: 参数非法/接口异常时提示清晰，不影响其它看板功能

# Task Dependencies
- Task 2 依赖 Task 1
- Task 3 依赖 Task 1 与 Task 2
