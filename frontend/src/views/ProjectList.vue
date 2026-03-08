<template>
  <AppLayout title="项目管理">
    <el-card shadow="hover">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input v-model="search" placeholder="搜索项目名称/编号/客户" class="toolbar-input" clearable @change="loadProjects">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-select v-model="filterStatus" placeholder="项目状态" clearable class="toolbar-select" @change="loadProjects">
            <el-option label="进行中" value="进行中" />
            <el-option label="已暂停" value="已暂停" />
            <el-option label="已关闭" value="已关闭" />
          </el-select>
          <el-select v-model="filterStage" placeholder="当前阶段" clearable class="toolbar-select" @change="loadProjects">
            <el-option v-for="s in stages" :key="s" :label="s" :value="s" />
          </el-select>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" @click="$router.push('/project/new')">
            <el-icon><Plus /></el-icon>新建项目
          </el-button>
        </div>
      </div>

      <div class="table-scroll">
        <el-table :data="projects" stripe v-loading="loading" @row-click="handleRowClick" style="width: 100%; min-width: 1180px">
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
                  <el-button v-if="isAdmin" link type="danger" size="small" @click.stop="handleDelete(row)">删除</el-button>
                </template>
              </el-table-column>
        </el-table>
      </div>
    </el-card>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppLayout from '../components/AppLayout.vue'
import { getProjects, deleteProject } from '../api'

const router = useRouter()
const route = useRoute()

const user = reactive(JSON.parse(localStorage.getItem('user') || '{}'))
const projects = ref([])
const loading = ref(false)
const search = ref('')
const filterStatus = ref('')
const filterStage = ref('')

const stages = ['项目接单', '方案设计', '采购执行', '生产装配', '出厂测试', '发货交付', '现场调试', '验收完成', '售后运维', '售后维修']

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
    '售后运维': 'info',
    '售后维修': 'danger'
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
  if (!isAdmin.value) {
    ElMessage.error('需要管理员权限')
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除项目 "${row.project_name}" 吗？此操作不可恢复。`, '警告', { type: 'warning' })
    await deleteProject(row.id)
    ElMessage.success('删除成功')
    loadProjects()
  } catch (err) {
    if (err === 'cancel' || err === 'close') return
    ElMessage.error(err.response?.data?.error || '删除失败')
  }
}

onMounted(() => {
  loadProjects()
})
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.toolbar-left { display: flex; align-items: center; }
.toolbar-input { width: 280px; }
.toolbar-select { width: 140px; margin-left: 12px; }
.table-scroll { overflow-x: auto; }

@media (max-width: 768px) {
  .toolbar { flex-direction: column; align-items: stretch; gap: 12px; }
  .toolbar-left { flex-wrap: wrap; gap: 12px; }
  .toolbar-input { width: 100%; }
  .toolbar-select { width: calc(50% - 6px); margin-left: 0; }
  .toolbar-right { display: flex; justify-content: flex-end; }
}
</style>
