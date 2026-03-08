# 品牌统一、看板卡点汇总与登录日志 Spec

## Why
系统需要统一品牌呈现（名称与图标），并在看板集中展示项目卡点以提升全员对关键节点的可见性。同时需要登录日志便于管理员审计账号使用情况。

## What Changes
- 全系统名称统一为“徐力电子项目管理系统”，并使用用户提供的图2作为系统图标（favicon/页面图标/登录页展示）。
- 看板（Dashboard）增加“项目卡点汇总”模块：集中展示当前用户可见项目的卡点列表，所有角色均可查看该模块。
- 新增登录日志：记录用户登录行为；管理员可在前端查看登录日志列表。

## Impact
- Affected specs: 登录与鉴权｜项目卡点管理｜Dashboard｜管理员审计
- Affected code:
  - 前端：登录页、全局布局/菜单、Dashboard、静态资源（图标）、路由与 API
  - 后端：/api/login 记录日志、登录日志查询接口、Dashboard 卡点汇总接口、data.json 存储结构

## ADDED Requirements

### Requirement: 系统名称与图标统一
系统 SHALL 在以下位置统一使用名称“徐力电子项目管理系统”：
- 登录页标题文案
- 全局布局（顶部/侧边栏/浏览器标题等系统名称展示处）
- 浏览器标签页 title

系统 SHALL 使用用户提供的图2作为系统图标，至少覆盖：
- 浏览器 favicon
- 登录页标题区域图标（与系统名称并列或上下排布均可）

#### Scenario: 名称一致
- **WHEN** 用户打开登录页、Dashboard、项目列表/详情等页面
- **THEN** 系统名称展示一致且为“徐力电子项目管理系统”

#### Scenario: 图标生效
- **WHEN** 用户打开系统页面
- **THEN** 浏览器标签页显示新 favicon，并在登录页可见新图标

### Requirement: 看板卡点汇总（全员可见）
系统 SHALL 在 Dashboard 增加“项目卡点汇总”模块，所有已登录用户均可查看。

#### 汇总范围与权限
系统 SHALL 仅汇总“当前用户有权限访问的项目”的卡点，避免跨权限泄露。

#### 展示字段（最小集）
- project_code / project_name
- checkpoint title
- planned_date
- status（含“已延期”展示规则与项目卡点一致）

#### 排序
系统 SHALL 默认按 planned_date 升序排列；若 planned_date 相同，可按 updated_at 或 created_at 再排序。

#### Scenario: 查看汇总
- **WHEN** 任意角色用户进入 Dashboard
- **THEN** 可看到“项目卡点汇总”模块，且列表数据来自其可见项目

### Requirement: 登录日志记录
系统 SHALL 在用户登录时记录登录日志，并且 MUST NOT 记录明文密码或任何敏感凭证。

#### 记录范围
- 至少记录“登录成功”日志
- 可选：记录“登录失败”日志（推荐），用于审计与排障

#### 日志字段（最小集）
- id（唯一）
- username（尝试登录的用户名）
- user_id（成功登录时必填；失败可为空）
- success（布尔）
- ip（若可获取）
- user_agent（若可获取）
- created_at

#### Scenario: 登录成功记日志
- **WHEN** 用户使用正确账号密码登录成功
- **THEN** 系统写入一条 success=true 的登录日志

#### Scenario: 登录失败不泄露信息
- **WHEN** 用户登录失败
- **THEN** 系统可写入 success=false 的日志（若实现）
- **AND** 响应错误信息不包含敏感字段

### Requirement: 管理员查看登录日志
系统 SHALL 提供管理员查看登录日志的入口与 API。

#### API（建议）
- `GET /api/login-logs`（管理员权限）
  - 支持 limit/offset 或 page/pageSize
  - 可选：支持按 username、success、时间范围过滤

#### UI
系统 SHALL 为管理员提供“登录日志”页面/模块，展示登录日志列表（时间、用户名、是否成功、IP、UA）。

#### Scenario: 非管理员不可查看
- **WHEN** 非管理员访问登录日志页面或调用登录日志 API
- **THEN** 返回 403，并在前端给出明确提示

## MODIFIED Requirements

### Requirement: /api/login（扩展）
系统 SHALL 在不改变现有登录成功/失败行为的前提下，新增登录日志写入逻辑。

## REMOVED Requirements
无

