# Tasks

## 任务列表

- [x] Task 1: 后端 - 新增自助注册接口
  - [x] SubTask 1.1: 新增 POST /api/register（无需登录）
  - [x] SubTask 1.2: 校验必填字段与用户名唯一性
  - [x] SubTask 1.3: 服务端强制禁止 role=管理员，并限制 role 在允许列表
  - [x] SubTask 1.4: 密码使用哈希存储并持久化到 data.json

- [x] Task 2: 前端 - 登录页添加注册入口与注册页面
  - [x] SubTask 2.1: 登录页新增“注册新用户”按钮
  - [x] SubTask 2.2: 新增 /register 路由与注册页面（表单校验 + 角色选择不含管理员）
  - [x] SubTask 2.3: 前端 API 增加 register 调用并处理错误提示
  - [x] SubTask 2.4: 注册成功后引导返回登录页（可预填用户名）

- [x] Task 3: 验证与回归
  - [x] SubTask 3.1: 验证可注册非管理员角色并正常登录
  - [x] SubTask 3.2: 验证注册管理员角色被服务端拒绝
  - [x] SubTask 3.3: 验证用户名重复/缺字段错误提示正确

# Task Dependencies
- Task 2 依赖 Task 1（前端对接后端注册接口）
- Task 3 依赖 Task 1 与 Task 2
