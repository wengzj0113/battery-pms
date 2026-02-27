# Tasks

## 任务列表

### Task 1: 后端 - 用户管理API
实现用户管理后端接口，包括用户创建、编辑、删除功能。

- [x] SubTask 1.1: 添加创建用户API (POST /api/users)
- [x] SubTask 1.2: 添加编辑用户API (PUT /api/users/:id)
- [x] SubTask 1.3: 添加删除用户API (DELETE /api/users/:id)
- [x] SubTask 1.4: 添加修改密码API (PUT /api/users/:id/password)
- [x] SubTask 1.5: 添加管理员权限中间件

### Task 2: 后端 - 项目数据权限过滤
实现基于角色的项目数据过滤，非管理员只能看到自己负责的项目。

- [x] SubTask 2.1: 修改项目列表API，支持按角色过滤
- [x] SubTask 2.2: 修改仪表盘统计API，支持按角色过滤
- [x] SubTask 2.3: 添加获取当前用户信息API

### Task 3: 前端 - 用户管理页面
创建用户管理Vue组件，实现用户CRUD界面。

- [x] SubTask 3.1: 创建UserManagement.vue页面
- [x] SubTask 3.2: 实现用户列表展示
- [x] SubTask 3.3: 实现用户添加对话框
- [x] SubTask 3.4: 实现用户编辑对话框
- [x] SubTask 3.5: 实现用户删除确认

### Task 4: 前端 - 权限控制
实现前端基于角色的功能可见性控制。

- [x] SubTask 4.1: 添加路由守卫，权限验证
- [x] SubTask 4.2: 修改左侧菜单，根据角色显示用户管理入口
- [x] SubTask 4.3: 修改Dashboard，隐藏敏感数据
- [x] SubTask 4.4: 修改项目列表，隐藏合同金额列
- [x] SubTask 4.5: 修改项目详情，隐藏合同金额字段

### Task 5: 前端 - API扩展
扩展前端API调用，添加新接口。

- [x] SubTask 5.1: 添加用户管理API调用函数
- [x] SubTask 5.2: 添加获取当前用户信息API

### Task 6: 测试与验证
验证所有功能按规格正常工作。

- [x] SubTask 6.1: 测试管理员登录并访问用户管理
- [x] SubTask 6.2: 测试非管理员无法访问用户管理
- [x] SubTask 6.3: 测试非管理员无法看到敏感数据
- [x] SubTask 6.4: 测试项目数据按角色过滤

# Task Dependencies

- Task 1 是 Task 3 的前置任务
- Task 2 影响 Task 4 的实现
- Task 5 是 Task 3 和 Task 4 的前置任务
- Task 6 依赖所有其他任务完成后进行
