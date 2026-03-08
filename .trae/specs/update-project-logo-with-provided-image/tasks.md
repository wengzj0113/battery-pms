# Tasks

- [ ] Task 1: 准备并上传图标文件：将用户提供的原图文件放入 `frontend/public/` 目录。
  - [ ] SubTask 1.1: 确认用户提供的图片格式（PNG/JPG/SVG），并将文件重命名为 `logo.png` (或对应格式) 和 `favicon.png`。
  - [ ] SubTask 1.2: 将文件放置到 `frontend/public/` 目录。

- [ ] Task 2: 更新前端静态资源引用：修改前端页面中的图标加载逻辑，优先使用新图片。
  - [ ] SubTask 2.1: 修改 `frontend/index.html` 中的 `<link rel="icon">` 标签，指向新的 `favicon.png`。
  - [ ] SubTask 2.2: 修改 `frontend/src/views/Login.vue` 中的 Logo `<img>` 标签，确保指向新的 `logo.png`。
  - [ ] SubTask 2.3: 修改 `frontend/src/components/AppLayout.vue` 中的 Logo `<img>` 标签，确保指向新的 `logo.png`。

- [ ] Task 3: 验证图标展示：在本地开发环境验证图标是否加载正确，且没有浏览器缓存干扰。
  - [ ] SubTask 3.1: 重启本地开发服务，检查登录页 Logo 展示。
  - [ ] SubTask 3.2: 检查侧边栏 Logo 展示。
  - [ ] SubTask 3.3: 检查浏览器标签页 Favicon 展示。

# Task Dependencies
- Task 2 依赖 Task 1
- Task 3 依赖 Task 2
