# 项目卡点管理模块 Spec

## Why
项目交付过程中需要对关键节点（卡点）进行统一登记、跟踪与闭环，避免节点遗漏与延期不透明。当前系统缺少对项目卡点的结构化管理入口。

## What Changes
- 为每个项目新增“卡点管理”模块：支持卡点列表查看与新增/编辑/删除/完成操作。
- 卡点包含名称、计划日期、负责人、状态、备注等字段，并可按计划日期排序展示。
- 后端新增卡点数据存储与接口，权限与项目访问权限保持一致（可见即可管理）。

## Impact
- Affected specs: 项目管理｜项目详情｜数据权限
- Affected code:
  - 后端：`/api/projects/:id/checkpoints*` 新接口与 data.json 存储结构
  - 前端：项目详情页/项目编辑页中新增“卡点管理”入口与交互

## ADDED Requirements

### Requirement: 项目卡点数据模型
系统 SHALL 为每个项目维护一组卡点记录（0..N），每条卡点至少包含：
- id（唯一）
- title（卡点名称，必填）
- planned_date（计划日期，必填，YYYY-MM-DD）
- owner_user_id（负责人，可选）
- status（必填：未开始｜进行中｜已完成｜已延期）
- notes（备注，可选）
- created_at / updated_at（必填）

#### 规则
- status 自动推导规则（基础版）：
  - 当 status 为“已完成”时保持不变
  - 否则，当 planned_date < 今天 且未完成，系统 SHALL 将其视为“已延期”（展示层或保存层均可，但 MUST 一致）

### Requirement: 卡点列表展示
系统 SHALL 在项目范围内展示卡点列表，默认按 planned_date 升序排列。

#### Scenario: 查看卡点
- **WHEN** 用户进入项目详情并打开“卡点管理”
- **THEN** 系统展示该项目所有卡点（含名称、计划日期、负责人、状态、备注）

### Requirement: 卡点新增
系统 SHALL 允许用户为项目新增卡点。

#### Scenario: 新增成功
- **WHEN** 用户填写 title 与 planned_date 并提交
- **THEN** 系统创建卡点并返回最新卡点信息

#### Scenario: 新增失败（字段缺失）
- **WHEN** 用户提交缺少 title 或 planned_date 的卡点
- **THEN** 后端返回 400 并提示缺少字段

### Requirement: 卡点编辑与完成
系统 SHALL 允许用户编辑卡点字段，并可将卡点标记为“已完成”。

#### Scenario: 编辑成功
- **WHEN** 用户更新卡点字段并提交
- **THEN** 系统保存更新并返回成功响应

#### Scenario: 完成卡点
- **WHEN** 用户将 status 设置为“已完成”
- **THEN** 系统保存为已完成状态（不再自动变为“已延期”）

### Requirement: 卡点删除
系统 SHALL 允许用户删除卡点。

#### Scenario: 删除成功
- **WHEN** 用户确认删除某条卡点
- **THEN** 系统删除该卡点并返回成功响应

## MODIFIED Requirements

### Requirement: 项目访问权限（复用）
系统 SHALL 复用现有项目访问控制：
- 管理员可访问并管理所有项目卡点
- 非管理员仅可访问并管理其有权限访问的项目的卡点

## REMOVED Requirements
无

