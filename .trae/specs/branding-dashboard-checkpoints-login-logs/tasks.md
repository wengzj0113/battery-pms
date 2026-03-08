# Tasks

## 任务列表

- [x] Task 1: 品牌统一（名称与图标）
  - [x] SubTask 1.1: 统一系统名称为“徐力电子项目管理系统”（登录页/布局/浏览器标题）
  - [x] SubTask 1.2: 引入用户提供的图2作为系统图标并设置 favicon
  - [x] SubTask 1.3: 登录页展示新图标并与名称一致

- [x] Task 2: 后端 - 看板卡点汇总接口
  - [x] SubTask 2.1: 新增 Dashboard 卡点汇总接口（按用户项目权限过滤）
  - [x] SubTask 2.2: 复用卡点“已延期”展示规则并定义排序

- [x] Task 3: 前端 - 看板卡点汇总模块
  - [x] SubTask 3.1: Dashboard 增加“项目卡点汇总”模块（全员可见）
  - [x] SubTask 3.2: 对接后端汇总接口并处理加载/空状态/错误提示

- [x] Task 4: 后端 - 登录日志记录与查询
  - [x] SubTask 4.1: /api/login 增加登录日志写入（不记录敏感信息）
  - [x] SubTask 4.2: data.json 增加 loginLogs 存储结构
  - [x] SubTask 4.3: 新增管理员查询接口 GET /api/login-logs（含分页，可选过滤）

- [x] Task 5: 前端 - 管理员登录日志页面
  - [x] SubTask 5.1: 新增“登录日志”管理入口（仅管理员可见）
  - [x] SubTask 5.2: 登录日志列表页（时间/用户名/成功/IP/UA）
  - [x] SubTask 5.3: 非管理员访问时提示无权限

- [x] Task 6: 验证与回归
  - [x] SubTask 6.1: 校验全站名称与 favicon 生效
  - [x] SubTask 6.2: 校验 Dashboard 卡点汇总对不同角色的项目可见性
  - [x] SubTask 6.3: 校验登录日志记录与管理员查询权限

# Task Dependencies
- Task 3 依赖 Task 2
- Task 5 依赖 Task 4
- Task 6 依赖 Task 1-5
