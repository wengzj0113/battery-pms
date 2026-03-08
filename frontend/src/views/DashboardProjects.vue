<template>
  <AppLayout :title="pageTitle">
    <template #header-left>
      <el-button text @click="goBack">
        <el-icon><ArrowLeft /></el-icon>返回看板
      </el-button>
      <h3>{{ pageTitle }}</h3>
    </template>

    <el-card shadow="hover" v-loading="loading">
      <div class="table-scroll">
        <el-table :data="items" stripe style="width: 100%; min-width: 980px">
          <el-table-column prop="project_code" label="项目编号" width="140" />
          <el-table-column prop="project_name" label="项目名称" min-width="200" show-overflow-tooltip />
          <el-table-column prop="customer_name" label="客户名称" width="160" show-overflow-tooltip />
          <el-table-column prop="current_stage" label="当前阶段" width="120">
            <template #default="{ row }">
              <el-tag :type="getStageType(row.current_stage)">{{ row.current_stage || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="project_status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.project_status === '进行中' ? 'primary' : 'success'">{{ row.project_status || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="planned_delivery_date" label="计划交付" width="120" />
          <el-table-column prop="acceptance_status" label="验收状态" width="120" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="viewProject(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="!loading && items.length === 0" class="empty-tip">暂无项目</div>
      </div>

      <div class="pager">
        <el-pagination
          background
          layout="total, prev, pager, next, sizes"
          :total="total"
          :page-size="pageSize"
          :current-page="page"
          :page-sizes="[20, 50, 100, 200]"
          @current-change="p => (page = p) && refresh()"
          @size-change="s => (pageSize = s) && (page = 1) && refresh()"
        />
      </div>
    </el-card>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppLayout from '../components/AppLayout.vue'
import { getDashboardProjects } from '../api'

const router = useRouter()
const route = useRoute()

const items = ref([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = ref(50)

const type = computed(() => String(route.query.type || '').trim())
const typeTitleMap = {
  inProgress: '进行中项目',
  expiring: '即将到期项目',
  accepted: '已验收项目',
  all: '在手项目'
}

const pageTitle = computed(() => typeTitleMap[type.value] || '项目列表')

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

const refresh = async () => {
  if (!typeTitleMap[type.value]) {
    ElMessage.warning('参数不正确')
    router.replace('/dashboard')
    return
  }
  loading.value = true
  try {
    const offset = (page.value - 1) * pageSize.value
    const res = await getDashboardProjects({ type: type.value, limit: pageSize.value, offset })
    items.value = res.items || []
    total.value = res.total || 0
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '加载项目列表失败')
  } finally {
    loading.value = false
  }
}

const viewProject = (row) => {
  router.push(`/projects/${row.id}`)
}

const goBack = () => {
  router.push('/dashboard')
}

watch(type, () => {
  page.value = 1
  refresh()
})

onMounted(() => {
  refresh()
})
</script>

<style scoped>
.table-scroll { overflow-x: auto; }
.pager { display: flex; justify-content: flex-end; margin-top: 12px; }
.empty-tip { text-align: center; color: #909399; padding: 12px 0; }
</style>

