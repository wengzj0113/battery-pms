# 手机浏览器无法访问问题修复 Spec

## Why
用户反馈手机浏览器无法打开部署的网页，Vercel部署显示404错误。

## What Changes
- 修复vercel.json配置，将API请求正确代理到Railway后端
- 原配置错误：destination为"/api"，无法代理
- 新配置：destination为"https://battery-pms-production.up.railway.app/api/$1"

## Impact
- Affected specs: 无
- Affected code: frontend/vercel.json

## ADDED Requirements
### Requirement: Vercel代理配置正确
Vercel应当能够将API请求代理到Railway后端。

#### Scenario: 手机访问登录页
- **WHEN** 用户在手机浏览器中输入部署的URL
- **THEN** 页面正常加载，显示登录表单，API请求能到达后端

## MODIFIED Requirements
### Requirement: Vercel配置
vercel.json的rewrites规则需要正确代理到后端服务。

## REMOVED Requirements
无
