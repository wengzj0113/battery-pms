# Tasks

## 任务列表

### Task 1: 后端 - 添加软件版本字段支持
在项目数据模型和API中增加软件版本相关字段。

- [ ] SubTask 1.1: 修改项目创建API (POST /api/projects)，支持新字段
- [ ] SubTask 1.2: 修改项目更新API (PUT /api/projects/:id)，支持新字段
- [ ] SubTask 1.3: 将新字段添加到 allowedFields 数组

### Task 2: 前端 - 项目编辑页面
在项目创建/编辑页面添加软件版本信息输入框。

- [ ] SubTask 2.1: 在 ProjectEdit.vue 中添加软件版本表单项
- [ ] SubTask 2.2: 添加字段：middle_software_version（中位机软件版本）
- [ ] SubTask 2.3: 添加字段：lower_software_version（下位机软件版本）
- [ ] SubTask 2.4: 添加字段：upper_software_version（上位机软件版本）
- [ ] SubTask 2.5: 添加字段：pcb_drawing_version（图纸版本-线路板）
- [ ] SubTask 2.6: 添加字段：structure_drawing_version（图纸版本-结构设计）

### Task 3: 前端 - 项目详情页面
在项目详情页面显示软件版本信息。

- [ ] SubTask 3.1: 在 ProjectDetail.vue 中添加软件版本显示区域
- [ ] SubTask 3.2: 按设计显示各版本信息

### Task 4: 测试与验证
验证所有功能按规格正常工作。

- [ ] SubTask 4.1: 测试创建项目时填写软件版本
- [ ] SubTask 4.2: 测试编辑项目时修改软件版本
- [ ] SubTask 4.3: 测试查看项目详情显示软件版本
- [ ] SubTask 4.4: 测试非管理员角色权限

# Task Dependencies
- Task 1 是 Task 2 和 Task 3 的前置任务
- Task 4 依赖所有其他任务完成后进行
