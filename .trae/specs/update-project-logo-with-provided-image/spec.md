# 更新项目图标为提交的图片 Spec

## Why
当前系统使用的 SVG 图标（favicon 和 logo）是由 AI 手工复刻的，用户不满意，要求替换为用户在聊天中提供的原图文件，以实现品牌展示的完全一致。

## What Changes
- 将前端公共资源目录 `frontend/public/` 下的 `favicon.svg` 和 `logo.svg` 替换为用户提供的图片文件。
- 如果用户提供的是 PNG 格式（推荐），将文件重命名为 `favicon.png` 和 `logo.png`。
- 更新 `frontend/index.html` 中的 favicon 引用，确保指向正确的 PNG 文件并修改 `type` 为 `image/png`。
- 更新 `frontend/src/views/Login.vue` 和 `frontend/src/components/AppLayout.vue` 中的 logo 图片源，优先加载 PNG 格式并保留 SVG 作为回退。

## Impact
- Affected specs: 品牌统一 (Branding)
- Affected code:
  - `frontend/index.html` (favicon 引用)
  - `frontend/public/favicon.png` (新增/替换)
  - `frontend/public/logo.png` (新增/替换)
  - `frontend/src/views/Login.vue` (Logo 展示)
  - `frontend/src/components/AppLayout.vue` (Logo 展示)

## ADDED Requirements
### Requirement: 使用用户提供的原图作为 Logo
系统 SHALL 在登录页和侧边栏使用用户提供的原图文件作为 Logo 展示。

#### Scenario: 登录页展示 Logo
- **WHEN** 用户进入登录页面
- **THEN** 标题区域显示的图标与用户提供的原图一致。

## MODIFIED Requirements
### Requirement: 浏览器 Favicon 统一
系统 SHALL 使用用户提供的原图作为浏览器的标签页图标。

#### Scenario: 标签页显示图标
- **WHEN** 用户打开系统任意页面
- **THEN** 浏览器标签页显示的图标与用户提供的原图一致。

## REMOVED Requirements
无
