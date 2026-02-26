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
            <el-button text @click="$router.push(isEdit ? `/projects/${id}` : '/projects')">
              <el-icon><ArrowLeft /></el-icon>返回
            </el-button>
            <h3>{{ isEdit ? '编辑项目' : '新建项目' }}</h3>
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
        <el-main v-loading="loading">
          <el-card shadow="hover">
            <el-form :model="form" label-width="140px" :rules="rules" ref="formRef">
              <el-divider content-position="left">基础信息</el-divider>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="项目名称" prop="project_name">
                    <el-input v-model="form.project_name" placeholder="请输入项目名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="客户名称">
                    <el-input v-model="form.customer_name" placeholder="请输入客户名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="合同金额">
                    <el-input-number v-model="form.contract_amount" :min="0" :precision="2" style="width: 100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="签订日期">
                    <el-date-picker v-model="form.signed_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="计划交付日期">
                    <el-date-picker v-model="form.planned_delivery_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-divider content-position="left">技术信息</el-divider>
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="设备型号">
                    <el-input v-model="form.device_model" placeholder="如: BC-64" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="电压范围">
                    <el-input v-model="form.voltage_range" placeholder="如: 3.0-4.2V" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="通道数量">
                    <el-select v-model="form.channel_count" placeholder="选择通道数" style="width: 100%">
                      <el-option label="8通道" :value="8" />
                      <el-option label="16通道" :value="16" />
                      <el-option label="32通道" :value="32" />
                      <el-option label="64通道" :value="64" />
                      <el-option label="128通道" :value="128" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="技术方案">
                    <el-input v-model="form.technical_solution" type="textarea" :rows="3" placeholder="请输入技术方案描述" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-divider content-position="left">采购信息</el-divider>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="采购进度">
                    <el-slider v-model="form.purchase_progress" :marks="{0: '0%', 50: '50%', 100: '100%'}" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="当前阶段">
                    <el-select v-model="form.current_stage" style="width: 100%">
                      <el-option v-for="s in stages" :key="s" :label="s" :value="s" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-divider content-position="left">生产信息</el-divider>
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="生产进度">
                    <el-slider v-model="form.production_progress" :marks="{0: '0%', 50: '50%', 100: '100%'}" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="生产工单">
                    <el-input v-model="form.production_order" placeholder="生产批次号" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="项目状态">
                    <el-select v-model="form.project_status" style="width: 100%">
                      <el-option label="进行中" value="进行中" />
                      <el-option label="已暂停" value="已暂停" />
                      <el-option label="已关闭" value="已关闭" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="装配完成日期">
                    <el-date-picker v-model="form.assembly_complete_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="测试完成日期">
                    <el-date-picker v-model="form.test_complete_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="测试结果">
                    <el-select v-model="form.test_result" style="width: 100%">
                      <el-option label="待测试" value="待测试" />
                      <el-option label="合格" value="合格" />
                      <el-option label="不合格" value="不合格" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-divider content-position="left">交付信息</el-divider>
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="发货日期">
                    <el-date-picker v-model="form.delivery_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="物流单号">
                    <el-input v-model="form.tracking_number" placeholder="请输入物流单号" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="调试状态">
                    <el-select v-model="form.debug_status" style="width: 100%">
                      <el-option label="待出发" value="待出发" />
                      <el-option label="进行中" value="进行中" />
                      <el-option label="已完成" value="已完成" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="验收状态">
                    <el-select v-model="form.acceptance_status" style="width: 100%">
                      <el-option label="待验收" value="待验收" />
                      <el-option label="验收中" value="验收中" />
                      <el-option label="已验收" value="已验收" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="实际交付日期">
                    <el-date-picker v-model="form.actual_delivery_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-divider content-position="left">财务信息</el-divider>
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="应收金额">
                    <el-input-number v-model="form.receivable_amount" :min="0" :precision="2" style="width: 100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="已收金额">
                    <el-input-number v-model="form.received_amount" :min="0" :precision="2" style="width: 100%" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-divider content-position="left">售后信息</el-divider>
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="售后状态">
                    <el-select v-model="form.after_sale_status" style="width: 100%">
                      <el-option label="正常" value="正常" />
                      <el-option label="有问题" value="有问题" />
                      <el-option label="维保中" value="维保中" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="维保到期日期">
                    <el-date-picker v-model="form.warranty_expiry_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="售后记录">
                    <el-input v-model="form.after_sale_records" type="textarea" :rows="3" placeholder="请输入售后维护记录" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item>
                <el-button type="primary" @click="handleSubmit" :loading="submitting">保存项目</el-button>
                <el-button @click="$router.push(isEdit ? `/projects/${id}` : '/projects')">取消</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getProject, createProject, updateProject } from '../api'

const router = useRouter()
const route = useRoute()

const id = route.params.id
const isEdit = !!id
const user = reactive(JSON.parse(localStorage.getItem('user') || '{}'))
const form = reactive({
  project_name: '',
  customer_name: '',
  contract_amount: 0,
  signed_date: '',
  planned_delivery_date: '',
  actual_delivery_date: '',
  device_model: '',
  voltage_range: '',
  channel_count: null,
  technical_solution: '',
  purchase_progress: 0,
  production_progress: 0,
  production_order: '',
  assembly_complete_date: '',
  test_complete_date: '',
  test_result: '待测试',
  delivery_date: '',
  tracking_number: '',
  debug_status: '待出发',
  acceptance_status: '待验收',
  receivable_amount: 0,
  received_amount: 0,
  after_sale_status: '正常',
  warranty_expiry_date: '',
  after_sale_records: '',
  current_stage: '项目接单',
  project_status: '进行中'
})
const rules = { project_name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }] }
const loading = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const stages = ['项目接单', '方案设计', '采购执行', '生产装配', '出厂测试', '发货交付', '现场调试', '验收完成', '售后运维']
const activeMenu = computed(() => '/projects')

const loadProject = async () => {
  if (!isEdit) return
  loading.value = true
  try {
    const data = await getProject(id)
    Object.assign(form, data)
  } catch (err) {
    ElMessage.error('加载项目失败')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  await formRef.value.validate()
  submitting.value = true
  try {
    if (isEdit) {
      await updateProject(id, form)
      ElMessage.success('更新成功')
      router.push(`/projects/${id}`)
    } else {
      const res = await createProject(form)
      ElMessage.success('创建成功')
      router.push(`/projects/${res.id}`)
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '保存失败')
  } finally {
    submitting.value = false
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
  loadProject()
})
</script>

<style scoped>
.layout { min-height: 100vh; }
.el-container { min-height: 100vh; }
.el-aside { background: #1a1a2e; }
.logo { height: 60px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; font-weight: bold; gap: 8px; border-bottom: 1px solid #2a2a4e; }
.el-menu { border-right: none; }
.el-header { background: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; border-bottom: 1px solid #e4e7ed; }
.header-left { display: flex; align-items: center; gap: 12px; }
.header-left h3 { margin: 0; color: #303133; }
.header-right { display: flex; align-items: center; gap: 16px; }
.user-info { display: flex; align-items: center; gap: 8px; cursor: pointer; color: #606266; }
.el-main { background: #f5f7fa; padding: 20px; }
</style>
