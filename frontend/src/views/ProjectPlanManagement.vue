<template>
  <AppLayout title="项目计划管理">
    <div v-loading="pageLoading">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span>项目</span>
              <el-select v-model="projectId" placeholder="选择项目" style="width: 360px" filterable>
                <el-option v-for="p in projects" :key="p.id" :label="getProjectLabel(p)" :value="p.id" />
              </el-select>
            </div>
            <el-button type="primary" :disabled="!projectId" @click="openCreateDialog">新增计划项</el-button>
          </div>
        </template>

        <el-empty v-if="projects.length === 0" description="暂无可管理的项目" />

        <div v-else class="table-scroll">
          <el-table :data="plans" stripe v-loading="plansLoading" style="width: 100%; min-width: 920px">
            <el-table-column prop="title" label="计划项" min-width="220" show-overflow-tooltip />
            <el-table-column prop="start_date" label="开始日期" width="120" />
            <el-table-column prop="end_date" label="结束日期" width="120" />
            <el-table-column label="负责人" width="140">
              <template #default="{ row }">
                <span>{{ getOwnerLabel(row) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getPlanTagType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="notes" label="备注" min-width="240" show-overflow-tooltip />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
                <el-button v-if="row.status !== '已完成'" link type="success" size="small" @click="markDone(row)">完成</el-button>
                <el-button link type="danger" size="small" @click="removePlan(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>
  </AppLayout>

  <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新增计划项' : '编辑计划项'" width="560px">
    <el-form ref="planFormRef" :model="planForm" :rules="planRules" label-width="90px">
      <el-form-item label="计划项" prop="title">
        <el-input v-model="planForm.title" placeholder="请输入计划项名称" />
      </el-form-item>
      <el-form-item label="开始日期" prop="start_date">
        <el-date-picker v-model="planForm.start_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
      </el-form-item>
      <el-form-item label="结束日期" prop="end_date">
        <el-date-picker v-model="planForm.end_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
      </el-form-item>
      <el-form-item label="负责人">
        <el-switch v-model="planForm.isMine" active-text="我负责" inactive-text="未指定" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="planForm.status" style="width: 100%">
          <el-option v-for="s in planStatuses" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="planForm.notes" type="textarea" :rows="3" placeholder="可选" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="dialogSubmitting" @click="submitPlan">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppLayout from '../components/AppLayout.vue'
import { getProjects, getProjectPlans, createProjectPlan, updateProjectPlan, deleteProjectPlan } from '../api'

const user = reactive(JSON.parse(localStorage.getItem('user') || '{}'))

const projects = ref([])
const projectId = ref('')
const plans = ref([])
const pageLoading = ref(false)
const plansLoading = ref(false)

const dialogVisible = ref(false)
const dialogMode = ref('create')
const dialogSubmitting = ref(false)
const editingId = ref('')
const planFormRef = ref()

const planStatuses = ['未开始', '进行中', '已完成', '已延期']
const planForm = reactive({
  title: '',
  start_date: '',
  end_date: '',
  status: '未开始',
  notes: '',
  isMine: true
})

const planRules = {
  title: [{ required: true, message: '请输入计划项名称', trigger: 'blur' }],
  start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  end_date: [
    { required: true, message: '请选择结束日期', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (!value || !planForm.start_date) return callback()
        if (String(value) < String(planForm.start_date)) return callback(new Error('结束日期不能早于开始日期'))
        callback()
      },
      trigger: 'change'
    }
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const getProjectLabel = (p) => {
  const name = String(p.project_name || '').trim()
  const code = String(p.project_code || '').trim()
  if (name && code) return `${name}（${code}）`
  return name || code || '未命名项目'
}

const getPlanTagType = (status) => {
  const map = { '未开始': 'info', '进行中': 'primary', '已完成': 'success', '已延期': 'danger' }
  return map[status] || 'info'
}

const getOwnerLabel = (row) => {
  if (row.owner_user_id && row.owner_user_id === user.id) return user.realname || '我'
  return row.owner_user_id ? row.owner_user_id : '-'
}

const loadProjects = async () => {
  pageLoading.value = true
  try {
    projects.value = await getProjects()
    if (!projectId.value && projects.value.length > 0) {
      projectId.value = projects.value[0].id
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '加载项目失败')
  } finally {
    pageLoading.value = false
  }
}

const loadPlans = async () => {
  if (!projectId.value) return
  plansLoading.value = true
  try {
    plans.value = await getProjectPlans(projectId.value)
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '加载计划项失败')
  } finally {
    plansLoading.value = false
  }
}

const openCreateDialog = () => {
  dialogMode.value = 'create'
  editingId.value = ''
  planForm.title = ''
  planForm.start_date = ''
  planForm.end_date = ''
  planForm.status = '未开始'
  planForm.notes = ''
  planForm.isMine = true
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  dialogMode.value = 'edit'
  editingId.value = row.id
  planForm.title = row.title || ''
  planForm.start_date = row.start_date || ''
  planForm.end_date = row.end_date || ''
  planForm.status = row.status || '未开始'
  planForm.notes = row.notes || ''
  planForm.isMine = Boolean(row.owner_user_id && row.owner_user_id === user.id)
  dialogVisible.value = true
}

const submitPlan = async () => {
  if (!planFormRef.value) return
  await planFormRef.value.validate(async (valid) => {
    if (!valid) return
    dialogSubmitting.value = true
    try {
      const payload = {
        title: planForm.title,
        start_date: planForm.start_date,
        end_date: planForm.end_date,
        status: planForm.status,
        notes: planForm.notes,
        owner_user_id: planForm.isMine ? user.id : ''
      }
      if (dialogMode.value === 'create') {
        await createProjectPlan(projectId.value, payload)
        ElMessage.success('新增成功')
      } else {
        await updateProjectPlan(projectId.value, editingId.value, payload)
        ElMessage.success('保存成功')
      }
      dialogVisible.value = false
      loadPlans()
    } catch (err) {
      ElMessage.error(err.response?.data?.error || '操作失败')
    } finally {
      dialogSubmitting.value = false
    }
  })
}

const markDone = async (row) => {
  try {
    await updateProjectPlan(projectId.value, row.id, { ...row, status: '已完成' })
    ElMessage.success('已完成')
    loadPlans()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '操作失败')
  }
}

const removePlan = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除计划项 "${row.title}" 吗？`, '提示', { type: 'warning' })
    await deleteProjectPlan(projectId.value, row.id)
    ElMessage.success('删除成功')
    loadPlans()
  } catch (err) {
    if (err === 'cancel' || err === 'close') return
    ElMessage.error(err.response?.data?.error || '删除失败')
  }
}

watch(projectId, () => {
  loadPlans()
})

onMounted(async () => {
  await loadProjects()
  await loadPlans()
})
</script>

<style scoped>
.card-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.header-left { display: flex; align-items: center; gap: 10px; }
.table-scroll { overflow-x: auto; }
</style>

