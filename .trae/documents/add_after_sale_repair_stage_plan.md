# 计划：在“当前阶段”下拉框中增加“售后维修”选项

用户希望在项目的“当前阶段”下拉框中增加一个“售后维修”选项。目前代码中已存在“项目接单”、“方案设计”等阶段，以及一个“售后运维”阶段。本计划将在所有涉及阶段列表和展示逻辑的地方同步更新。

## 待修改文件列表
- `frontend/src/views/ProjectEdit.vue`：修改编辑/新建页面的下拉选项。
- `frontend/src/views/ProjectList.vue`：修改列表页面的筛选下拉框及阶段标签展示。
- `frontend/src/views/ProjectDetail.vue`：修改详情页面的进度时间线及阶段标签展示。
- `frontend/src/views/Dashboard.vue`：修改看板页面的阶段标签展示逻辑。
- `frontend/src/views/DashboardProjects.vue`：修改看板下钻列表页面的阶段标签展示逻辑。

## 实施步骤

### 1. 修改 `ProjectEdit.vue`
- 在 `stages` 数组中，在 `售后运维` 之后增加 `售后维修`。
- [ProjectEdit.vue](file:///d:/traeProjectManeger/frontend/src/views/ProjectEdit.vue#L289)

### 2. 修改 `ProjectList.vue`
- 在 `stages` 数组中增加 `售后维修`。
- 在 `getStageType` 函数中为 `售后维修` 添加颜色映射（设为 `info` 类型）。
- [ProjectList.vue](file:///d:/traeProjectManeger/frontend/src/views/ProjectList.vue#L90)
- [ProjectList.vue](file:///d:/traeProjectManeger/frontend/src/views/ProjectList.vue#L94)

### 3. 修改 `ProjectDetail.vue`
- 在 `stages` 数组中增加 `售后维修`。
- 在 `getStageType` 函数中为 `售后维修` 添加颜色映射。
- [ProjectDetail.vue](file:///d:/traeProjectManeger/frontend/src/views/ProjectDetail.vue#L301)
- [ProjectDetail.vue](file:///d:/traeProjectManeger/frontend/src/views/ProjectDetail.vue#L305)

### 4. 修改 `Dashboard.vue`
- 在 `getStageType` 函数中为 `售后维修` 添加颜色映射。
- [Dashboard.vue](file:///d:/traeProjectManeger/frontend/src/views/Dashboard.vue#L181)

### 5. 修改 `DashboardProjects.vue`
- 在 `getStageType` 函数中为 `售后维修` 添加颜色映射。
- [DashboardProjects.vue](file:///d:/traeProjectManeger/frontend/src/views/DashboardProjects.vue#L79)

## 验证计划
- 访问项目编辑页面，确认“当前阶段”下拉框中出现了“售后维修”选项。
- 访问项目列表页面，确认筛选下拉框中出现了“售后维修”选项。
- 修改一个项目的阶段为“售后维修”，确认在列表页、详情页和看板中都能正确显示该阶段及其对应的标签颜色。
