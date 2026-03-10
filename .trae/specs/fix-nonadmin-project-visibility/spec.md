# 项目/看板对全员可见可编辑 Spec

## Why
当前系统对非管理员按“角色负责人字段”过滤项目，导致大多数员工在项目列表、看板等模块中看不到任何数据，无法使用系统。现希望系统内所有登录用户都可以查看并编辑全部项目与看板信息。

## What Changes
- 项目与看板数据：所有登录用户均可查看全部项目与看板相关数据（不再按角色过滤）。
- 项目编辑：所有登录用户均可创建/编辑项目、卡点与计划（不再按角色限制写权限），但财务敏感字段仅管理员可见/可编辑。
- 保留“用户管理”等管理功能仅管理员可访问。
- **不做启动期数据迁移/自动写入**，避免“更新后台影响既有数据文件”。<mccoremem id="01KK6V9YEVEPFKSCK5ZF8R13KA" />

## Impact
- Affected specs: 用户权限｜项目可见性｜看板可用性｜项目编辑权限
- Affected code:
  - 后端：`backend/server.js`（项目/看板查询不再按角色过滤；写操作不再按角色限制）
  - 前端：`frontend/src/views/Dashboard.vue`、`DashboardProjects.vue`、`ProjectList.vue`、`ProjectDetail.vue`、`ProjectEdit.vue`（移除“非管理员隐藏/过滤”的前端逻辑）

## ADDED Requirements

### Requirement: 全员可见项目与看板
系统 SHALL 允许所有登录用户查看全部项目列表、项目详情与看板数据。

#### Scenario: 非管理员查看项目与看板
- **GIVEN** 用户以非管理员角色登录
- **WHEN** 打开项目列表、项目详情、看板页面
- **THEN** 能看到与管理员一致的项目与看板数据（不再为空）

### Requirement: 全员可编辑项目
系统 SHALL 允许所有登录用户创建与编辑项目基础信息、卡点与计划（不再按角色限制写权限），但财务敏感字段仅管理员可编辑。

#### Scenario: 非管理员编辑项目
- **GIVEN** 用户以非管理员角色登录
- **WHEN** 进入项目详情/编辑页面并修改信息后保存
- **THEN** 保存成功，刷新后数据仍存在

### Requirement: 用户管理仍受管理员权限控制
系统 SHALL 保持用户管理相关页面与 API 仅管理员可访问。

#### Scenario: 非管理员访问用户管理
- **GIVEN** 用户以非管理员角色登录
- **WHEN** 访问用户管理页面或调用用户管理 API
- **THEN** 返回 403 且前端提示无权限

## MODIFIED Requirements

### Requirement: 项目数据权限过滤
**BREAKING**：移除按角色负责人字段过滤项目可见性与编辑权限；改为所有登录用户均可查看与编辑全部项目与看板数据。

### Requirement: 敏感字段权限
系统 SHALL 在前端界面对非管理员隐藏/禁用财务敏感字段；后端接口保持字段不变（不额外增加强制剔除/拒绝逻辑）。

财务敏感字段范围（最小集合）：
- `contract_amount`（合同金额）
- `receivable_amount`（应收金额）
- `received_amount`（已收金额）

## REMOVED Requirements
无
