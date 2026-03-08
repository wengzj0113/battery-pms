<template>
  <AppLayout title="登录日志">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>登录情况</span>
        </div>
      </template>

      <div class="filters">
        <el-input v-model="filters.username" placeholder="用户名" clearable style="width: 220px" @keyup.enter="refresh" />
        <el-select v-model="filters.success" placeholder="结果" clearable style="width: 140px">
          <el-option label="成功" :value="true" />
          <el-option label="失败" :value="false" />
        </el-select>
        <el-button type="primary" @click="refresh">查询</el-button>
      </div>

      <div class="table-scroll">
        <el-table :data="items" stripe v-loading="loading" style="width: 100%; min-width: 980px">
          <el-table-column prop="created_at" label="时间" width="200" />
          <el-table-column prop="username" label="用户名" width="160" />
          <el-table-column prop="success" label="结果" width="100">
            <template #default="{ row }">
              <el-tag :type="row.success ? 'success' : 'danger'" size="small">{{ row.success ? '成功' : '失败' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="ip" label="IP" width="180" show-overflow-tooltip />
          <el-table-column prop="user_agent" label="User-Agent" min-width="320" show-overflow-tooltip />
        </el-table>
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
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AppLayout from '../components/AppLayout.vue'
import { getLoginLogs } from '../api'

const items = ref([])
const total = ref(0)
const loading = ref(false)

const page = ref(1)
const pageSize = ref(50)
const filters = reactive({ username: '', success: undefined })

const refresh = async () => {
  loading.value = true
  try {
    const offset = (page.value - 1) * pageSize.value
    const res = await getLoginLogs({
      limit: pageSize.value,
      offset,
      username: filters.username || undefined,
      success: filters.success
    })
    items.value = res.items || []
    total.value = res.total || 0
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '加载登录日志失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refresh()
})
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
.filters { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.table-scroll { overflow-x: auto; }
.pager { display: flex; justify-content: flex-end; margin-top: 12px; }
</style>

