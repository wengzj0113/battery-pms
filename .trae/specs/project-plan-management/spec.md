# 项目计划管理模块 Spec

## Why
项目交付过程中需要对项目级计划项进行结构化登记与跟踪，便于统一查看进度与风险。当前系统缺少独立的“项目计划管理”入口与数据模型。

## What Changes
- 左侧导航（含移动端抽屉）新增独立菜单“项目计划管理”，路由为 `/project-plans`。
- 新增“项目计划管理”页面：可选择项目并对该项目的计划项进行查看/新增/编辑/删除/完成操作。
- 后端新增项目计划数据存储与接口，权限规则复用现有项目访问权限（可见即可管理）。
- 前端新增 plans API 方法并对接页面交互。

## Impact
- Affected specs: 导航布局｜路由鉴权｜项目管理｜数据权限
- Affected code:
  - 前端：`frontend/src/components/AppLayout.vue`（菜单项）、`frontend/src/router/index.js`（路由）、`frontend/src/views/ProjectPlanManagement.vue`（新增页面）、`frontend/src/api/index.js`（plans API）
  - 后端：`backend/server.js`（`/api/projects/:id/plans*` 新接口与 data.json 存储结构）、`backend/data.json`（projects 内 plans 字段）

## ADDED Requirements

### Requirement: 项目计划菜单入口
系统 SHALL 在左侧导航与移动端抽屉导航中提供“项目计划管理”菜单项，点击后进入 `/project-plans`。

#### Scenario: 通过菜单进入项目计划管理
- **WHEN** 用户点击左侧“项目计划管理”菜单
- **THEN** 系统导航到 `/project-plans` 且菜单高亮与路由一致

### Requirement: 项目计划管理页面（基础版）
系统 SHALL 提供“项目计划管理”页面，用于在项目范围内管理计划项。

#### 交互
- 页面 SHALL 提供“项目选择器”，可列出当前用户可见项目并切换当前项目。
- 页面 SHALL 展示当前项目的计划项列表，默认按 `start_date` 升序排列。
- 页面 SHALL 提供计划项的新增/编辑/删除/标记完成入口。

#### Scenario: 查看计划项列表
- **WHEN** 用户进入 `/project-plans` 并选择一个项目
- **THEN** 系统展示该项目计划项列表（含名称、开始日期、结束日期、负责人、状态、备注）

### Requirement: 项目计划数据模型
系统 SHALL 为每个项目维护一组计划项记录（0..N），每条计划项至少包含：
- id（唯一）
- title（计划项名称，必填）
- start_date（开始日期，必填，YYYY-MM-DD）
- end_date（结束日期，必填，YYYY-MM-DD）
- owner_user_id（负责人，可选）
- status（必填：未开始｜进行中｜已完成｜已延期）
- notes（备注，可选）
- created_at / updated_at（必填）

#### 规则
- 日期范围规则：`end_date` SHALL 大于或等于 `start_date`，否则视为无效输入。
- status 自动推导规则（基础版）：
  - 当 status 为“已完成”时保持不变
  - 否则，当 `end_date < 今天` 且未完成，系统 SHALL 将其视为“已延期”（展示层或保存层均可，但 MUST 一致）

### Requirement: 项目计划接口（CRUD）
系统 SHALL 提供项目计划项的增删改查接口，且权限校验与项目访问权限保持一致。

#### 接口
- `GET /api/projects/:id/plans`：返回该项目所有计划项（含“已延期”推导），默认按 `start_date` 升序
- `POST /api/projects/:id/plans`：新增计划项（必填：`title/start_date/end_date`）
- `PUT /api/projects/:id/plans/:planId`：更新计划项字段
- `DELETE /api/projects/:id/plans/:planId`：删除计划项

#### 错误码与校验
- 缺少必填字段、日期格式错误、`end_date < start_date`、非法 status：后端返回 400 并给出可读提示
- 项目不可见：后端返回 403
- 项目不存在或计划项不存在：后端返回 404

#### Scenario: 新增成功
- **WHEN** 用户填写 `title/start_date/end_date` 并提交
- **THEN** 系统创建计划项并返回最新计划项信息

#### Scenario: 新增失败（字段缺失/日期无效）
- **WHEN** 用户提交缺少必填字段或 `end_date < start_date` 的计划项
- **THEN** 后端返回 400 并提示原因

### Requirement: 项目访问权限（复用）
系统 SHALL 复用现有项目访问控制：
- 管理员可访问并管理所有项目计划项
- 非管理员仅可访问并管理其有权限访问的项目的计划项

## MODIFIED Requirements
无

## REMOVED Requirements
无
