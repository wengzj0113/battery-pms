# 看板统计卡片下钻项目列表 Spec

## Why
看板顶部统计卡片目前只能展示数量，无法快速查看对应项目明细。需要支持点击“进行中项目 / 即将到期 / 已验收项目”等统计卡片后弹出项目列表，便于快速定位与跟进。

## What Changes
- Dashboard 统计卡片支持点击下钻：点击后进入一个新页面，展示对应筛选条件的项目列表。
- 后端提供按“看板统计口径”筛选项目的接口，保证筛选逻辑与看板统计一致。
- 访问权限与项目列表保持一致：用户只能看到自己有权限访问的项目明细。

## Impact
- Affected specs: Dashboard｜项目列表｜权限控制
- Affected code:
  - 前端：Dashboard 统计卡片交互、弹窗列表组件、API 调用
  - 后端：新增 Dashboard 下钻项目接口（或扩展项目列表查询参数）

## ADDED Requirements

### Requirement: 统计卡片可点击下钻
系统 SHALL 在 Dashboard 顶部统计卡片区域支持点击下钻并进入项目列表页面：
- 进行中项目
- 即将到期
- 已验收项目
- 在手项目总数（可选但推荐，口径为当前用户可见项目总数）

#### Scenario: 点击进行中项目
- **WHEN** 用户点击“进行中项目”统计卡片
- **THEN** 系统进入项目列表页面
- **AND** 列表仅包含 project_status = “进行中” 的项目（且满足用户项目权限）

#### Scenario: 点击即将到期
- **WHEN** 用户点击“即将到期”统计卡片
- **THEN** 系统进入项目列表页面
- **AND** 列表口径与 Dashboard 统计一致：planned_delivery_date <= 今天+7天 且 acceptance_status != “已验收”

#### Scenario: 点击已验收项目
- **WHEN** 用户点击“已验收项目”统计卡片
- **THEN** 系统进入项目列表页面
- **AND** 列表仅包含 acceptance_status = “已验收” 的项目

### Requirement: 下钻项目列表页面展示
系统 SHALL 在下钻页面中展示项目列表，至少包含以下字段：
- project_code（项目编号）
- project_name（项目名称）
- customer_name（客户名称）
- current_stage（当前阶段）
- project_status（项目状态）
- planned_delivery_date（计划交付）
- acceptance_status（验收状态）

#### 交互
- 列表行或“查看”按钮 SHALL 支持跳转项目详情页。
- 页面 SHALL 提供返回入口（返回 Dashboard 或返回上一页），遵循现有导航风格。

#### 状态
- **加载中**：展示 loading
- **空列表**：展示“暂无项目”
- **错误**：展示明确错误提示（优先使用后端 error 字段）

### Requirement: 下钻项目接口（按统计口径）
系统 SHALL 提供可被 Dashboard 调用的下钻接口，按“统计卡片口径”返回项目列表。

#### API（建议）
`GET /api/dashboard/projects`

查询参数：
- type（必填）：inProgress｜expiring｜accepted｜all
- limit（可选，默认 50，最大 200）
- offset（可选，默认 0）

响应：
```json
{
  "total": 123,
  "items": [ { "id": "...", "project_code": "...", "project_name": "...", "customer_name": "...", "current_stage": "...", "project_status": "...", "planned_delivery_date": "...", "acceptance_status": "..." } ]
}
```

#### 权限
- 系统 SHALL 复用现有项目可见性规则：管理员返回所有项目；非管理员仅返回其可见项目。

#### Scenario: 非法类型
- **WHEN** type 不在允许集合内
- **THEN** 返回 400 并提示参数不合法

## MODIFIED Requirements

### Requirement: Dashboard 统计口径复用
系统 SHALL 保证下钻列表口径与 Dashboard 统计一致，避免数量与明细不一致。

## REMOVED Requirements
无
