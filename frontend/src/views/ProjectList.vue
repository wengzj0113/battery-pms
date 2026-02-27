<template>
  <div class="layout">
    <el-container>
      <el-aside width="220px">
        <div class="logo">
          <el-icon :size="28"><Monitor /></el-icon>
          <span>项目管理系统</span>
        </div>
        <el-menu :default-active="activeMenu" router background-color="#1a1a2e" text-color="#fff" active-text-color="#409eff">
          <el-menu-item index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>项目看板</span>
          </el-menu-item>
          <el-menu-item index="/projects">
            <el-icon><FolderOpened /></el-icon>
            <span>项目管理</span>
          </el-menu-item>
          <el-menu-item index="/project/new">
            <el-icon><Plus /></el-icon>
            <span>新建项目</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header>
          <div class="header-left">
            <h3>项目管理</h3>
          </div>
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-icon><User /></el-icon>
                <span>{{ user.realname }} ({{ user.role }})</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        <el-main>
          <el-card shadow="hover">
            <div class="toolbar">
              <div class="toolbar-left">
                <el-input v-model="search" placeholder="搜索项目名称/编号/客户" style="width: 280px" clearable @change="loadProjects">
                  <template #prefix><el-icon><Search /></el-icon></template>
                </el-input>
                <el-select v-model="filterStatus" placeholder="项目状态" clearable style="width: 140px; margin-left: 12px" @change="loadProjects">
                  <el-option label="进行中" value="进行中" />
                  <el-option label="已暂停" value="已暂停" />
                  <el-option label="已关闭" value="已关闭" />
                </el-select>
                <el-select v-model="filterStage" placeholder="当前阶段" clearable style="width: 140px; margin-left: 12px" @change="loadProjects">
                  <el-option v-for="s in stages" :key="s" :label="s" :value="s" />
                </el-select>
              </div>
              <div class="toolbar-right">
                <el-button type="primary" @click="$router.push('/project/new')">
                  <el-icon><Plus /></el-icon>新建项目
                </el-button>
              </div>
            </div>

            <el-table :data="projects" stripe v-loading="loading" @row-click="handleRowClick">
              <el-table-column prop="project_code" label="项目编号" width="140" />
              <el-table-column prop="project_name" label="项目名称" min-width="180" show-overflow-tooltip />
              <el-table-column prop="customer_name" label="客户名称" width="140" show-overflow-tooltip />
              <el-table-column v-if="isAdmin" prop="contract_amount" label="合同金额" width="120" align="right">
                <template #default="{ row }">
                  ¥{{ (row.contract_amount || 0).toLocaleString() }}
                </template>
              </el-table-column>
              <el-table-column prop="current_stage" label="当前阶段" width="120">
                <template #default="{ row }">
                  <el-tag :type="getStageType(row.current_stage)" size="small">{{ row.current_stage }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="purchase_progress" label="采购进度" width="100">
                <template #default="{ row }">
                  <el-progress :percentage="row.purchase_progress || 0" :stroke-width="8" :show-text="false" />
                  <span style="font-size: 12px">{{ row.purchase_progress || 0 }}%</span>
                </template>
              </el-table-column>
              <el-table-column prop="production_progress" label="生产进度" width="100">
                <template #default="{ row }">
                  <el-progress :percentage="row.production_progress || 0" :stroke-width="8" :show-text="false" :color="'#67c23a'" />
                  <span style="font-size: 12px">{{ row.production_progress || 0 }}%</span>
                </template>
              </el-table-column>
              <el-table-column prop="project_status" label="状态" width="90">
                <template #default="{ row }">
                  <el-tag :type="row.project_status === '进行中' ? 'primary' : row.project_status === '已暂停' ? 'warning' : 'info'" size="small">
                    {{ row.project_status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="planned_delivery_date" label="计划交付" width="120" />
              <el-table-column label="操作" width="140" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click.stop="$router.push(`/projects/${row.id}`)">查看</el-button>
                  <el-button link type="warning" size="small" @click.stop="$router.push(`/projects/${row.id}/edit`)">编辑</el-button>
                  <el-button link type="danger" size="small" @click.stop="handleDelete(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProjects, deleteProject } from '../api'

const router = useRouter()
const route = useRoute()

const user = reactive(JSON.parse(localStorage.getItem('user') || '{}'))
const projects = ref([])
const loading = ref(false)
const search = ref('')
const filterStatus = ref('')
const filterStage = ref('')

const stages = ['项目接单', '方案设计', '采购执行', '生产装配', '出厂测试', '发货交付', '现场调试', '验收完成', '售后运维']

const activeMenu = computed(() => route.path)
const isAdmin = computed(() => user.role === '管理员')

const getStageType = (stage) => {
  const types = {
    '项目接单': 'info',
    '方案设计': 'primary',
    '采购执行': 'warning',
    '生产装配': 'warning',
    '出厂测试': 'warning',
    '发货交付': 'success',
    '现场调试': 'success',
    '验收完成': 'success',
    '售后运维': 'info'
  }
  return types[stage] || 'info'
}

const loadProjects = async () => {
  loading.value = true
  try {
    const params = {}
    if (search.value) params.search = search.value
    if (filterStatus.value) params.status = filterStatus.value
    if (filterStage.value) params.stage = filterStage.value
    projects.value = await getProjects(params)
  } catch (err) {
    ElMessage.error('加载项目列表失败')
  } finally {
    loading.value = false
  }
}

const handleRowClick = (row) => {
  router.push(`/projects/${row.id}`)
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除项目 "${row.project_name}" 吗？此操作不可恢复。`, '警告', { type: 'warning' })
    await deleteProject(row.id)
    ElMessage.success('删除成功')
    loadProjects()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('删除失败')
  }
}

const handleCommand = (cmd) => {
  if (cmd === 'logout') {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }
}

onMounted(() => {
  loadProjects()
})
</script>

<style scoped>
.layout { min-height: 100vh; }
.el-container { min-height: 100vh; }
.el-aside { background: #1a1a2e; }
.logo { height: 60px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; font-weight: bold; gap: 8px; border-bottom: 1px solid #2a2a4e; }
.el-menu { border-right: none; }
.el-header { background: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; border-bottom: 1px solid #e4e7ed; }
.header-left h3 { margin: 0; color: #303133; }
.user-info { display: flex; align-items: center; gap: 8px; cursor: pointer; color: #606266; }
.el-main { background: #f5f7fa; padding: 20px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.toolbar-left { display: flex; align-items: center; }
</style>
