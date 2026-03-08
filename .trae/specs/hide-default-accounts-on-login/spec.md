# 登录页屏蔽默认账号提示 Spec

## Why
登录页展示默认账号/密码会带来安全风险与误导（在生产环境中不应明文暴露默认口令）。需要将该提示从界面上屏蔽。

## What Changes
- 登录页不再展示“默认账号”及其账号密码列表提示区域。
- 仅影响前端展示，不改动后端默认账号初始化逻辑与登录接口。

## Impact
- Affected specs: 登录体验｜安全展示
- Affected code:
  - 前端：`frontend/src/views/Login.vue`

## ADDED Requirements

### Requirement: 屏蔽默认账号提示
系统 SHALL 在登录页面中不展示任何默认账号/默认密码提示信息（包括但不限于“默认账号”标题与明文账号密码列表）。

#### Scenario: 访问登录页
- **WHEN** 用户打开 `/login`
- **THEN** 页面不显示默认账号/密码相关提示区域

## MODIFIED Requirements
无

## REMOVED Requirements
无
