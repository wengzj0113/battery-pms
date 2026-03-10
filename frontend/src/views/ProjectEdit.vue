<template>
  <AppLayout :title="isEdit ? '编辑项目' : '新建项目'">
    <template #header-left>
      <el-button text @click="$router.push(isEdit ? `/projects/${id}` : '/projects')">
        <el-icon><ArrowLeft /></el-icon>返回
      </el-button>
      <h3>{{ isEdit ? '编辑项目' : '新建项目' }}</h3>
    </template>

    <div v-loading="loading">
      <el-card shadow="hover">
            <el-form :model="form" :label-width="isMobile ? 'auto' : '140px'" :label-position="isMobile ? 'top' : 'right'" :rules="rules" ref="formRef">
              <el-divider content-position="left">基础信息</el-divider>
              <el-row :gutter="20">
                <el-col :xs="24" :sm="24" :md="12">
                  <el-form-item label="项目名称" prop="project_name">
                    <el-input v-model="form.project_name" placeholder="请输入项目名称" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="24" :md="12">
                  <el-form-item label="客户名称">
                    <el-input v-model="form.customer_name" placeholder="请输入客户名称" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="6">
                  <el-form-item label="合同金额">
                    <el-input-number v-model="form.contract_amount" :min="0" :precision="2" style="width: 100%" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="6">
                  <el-form-item label="签订日期">
                    <el-date-picker v-model="form.signed_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="6">
                  <el-form-item label="计划交付日期">
                    <el-date-picker v-model="form.planned_delivery_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="6">
                  <el-form-item label="设备数量">
                    <el-input-number v-model="form.device_count" :min="0" :step="1" :precision="0" style="width: 100%" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-divider content-position="left">技术信息</el-divider>
              <el-row :gutter="20">
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="设备型号">
                    <el-input v-model="form.device_model" placeholder="如: BC-64" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="电压范围">
                    <el-input v-model="form.voltage_range" placeholder="如: 3.0-4.2V" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="通道数量">
                    <el-input-number v-model="form.channel_count" :min="1" :step="1" :precision="0" style="width: 100%" />
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
                <el-col :xs="24" :sm="24" :md="12">
                  <el-form-item label="采购进度">
                    <el-slider v-model="form.purchase_progress" :marks="{0: '0%', 50: '50%', 100: '100%'}" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="24" :md="12">
                  <el-form-item label="当前阶段">
                    <el-select v-model="form.current_stage" filterable popper-class="stage-select-dropdown" style="width: 100%">
                      <el-option v-for="s in stages" :key="s" :label="s" :value="s" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-divider content-position="left">生产信息</el-divider>
              <el-row :gutter="20">
                <el-col :xs="24" :sm="24" :md="8">
                  <el-form-item label="生产进度">
                    <el-slider v-model="form.production_progress" :marks="{0: '0%', 50: '50%', 100: '100%'}" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="生产工单">
                    <el-input v-model="form.production_order" placeholder="生产批次号" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="项目状态">
                    <el-select v-model="form.project_status" style="width: 100%">
                      <el-option label="进行中" value="进行中" />
                      <el-option label="已暂停" value="已暂停" />
                      <el-option label="已关闭" value="已关闭" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="装配完成日期">
                    <el-date-picker v-model="form.assembly_complete_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="测试完成日期">
                    <el-date-picker v-model="form.test_complete_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="测试结果">
                    <el-select v-model="form.test_result" style="width: 100%">
                      <el-option label="待测试" value="待测试" />
                      <el-option label="合格" value="合格" />
                      <el-option label="不合格" value="不合格" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-divider content-position="left">软件版本信息</el-divider>
              <el-row :gutter="20">
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="中位机软件版本">
                    <el-input v-model="form.middle_software_version" placeholder="如: V1.0.0" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="下位机软件版本">
                    <el-input v-model="form.lower_software_version" placeholder="如: V1.0.0" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="上位机软件版本">
                    <el-input v-model="form.upper_software_version" placeholder="如: V1.0.0" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="图纸版本-线路板">
                    <el-input v-model="form.pcb_drawing_version" placeholder="如: PCB-V1" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="图纸版本-结构设计">
                    <el-input v-model="form.structure_drawing_version" placeholder="如: STR-V1" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-divider content-position="left">交付信息</el-divider>
              <el-row :gutter="20">
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="发货日期">
                    <el-date-picker v-model="form.delivery_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="物流单号">
                    <el-input v-model="form.tracking_number" placeholder="请输入物流单号" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="调试状态">
                    <el-select v-model="form.debug_status" style="width: 100%">
                      <el-option label="待出发" value="待出发" />
                      <el-option label="进行中" value="进行中" />
                      <el-option label="已完成" value="已完成" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="验收状态">
                    <el-select v-model="form.acceptance_status" style="width: 100%">
                      <el-option label="待验收" value="待验收" />
                      <el-option label="验收中" value="验收中" />
                      <el-option label="已验收" value="已验收" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="实际交付日期">
                    <el-date-picker v-model="form.actual_delivery_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-divider content-position="left">财务信息</el-divider>
              <el-row :gutter="20">
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="应收金额">
                    <el-input-number v-model="form.receivable_amount" :min="0" :precision="2" style="width: 100%" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="已收金额">
                    <el-input-number v-model="form.received_amount" :min="0" :precision="2" style="width: 100%" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-divider content-position="left">售后信息</el-divider>
              <el-row :gutter="20">
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="售后状态">
                    <el-select v-model="form.after_sale_status" style="width: 100%">
                      <el-option label="正常" value="正常" />
                      <el-option label="有问题" value="有问题" />
                      <el-option label="维保中" value="维保中" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="8">
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

              <el-form-item class="form-actions">
                <el-button type="primary" @click="handleSubmit" :loading="submitting">保存项目</el-button>
                <el-button @click="$router.push(isEdit ? `/projects/${id}` : '/projects')">取消</el-button>
              </el-form-item>
            </el-form>
          </el-card>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppLayout from '../components/AppLayout.vue'
import { getProject, createProject, updateProject } from '../api'

const router = useRouter()
const route = useRoute()

const id = route.params.id
const isEdit = !!id
const user = reactive(JSON.parse(localStorage.getItem('user') || '{}'))
const isMobile = ref(false)
const form = reactive({
  project_name: '',
  customer_name: '',
  contract_amount: 0,
  signed_date: '',
  planned_delivery_date: '',
  actual_delivery_date: '',
  device_count: 0,
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
  project_status: '进行中',
  middle_software_version: '',
  lower_software_version: '',
  upper_software_version: '',
  pcb_drawing_version: '',
  structure_drawing_version: ''
})
const rules = { project_name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }] }
const loading = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const stages = ['项目接单', '方案设计', '采购执行', '生产装配', '出厂测试', '发货交付', '现场调试', '验收完成', '售后运维', '售后维修']
let mediaQuery
let onMediaChange

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

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 768px)')
  isMobile.value = mediaQuery.matches
  onMediaChange = (e) => {
    isMobile.value = e.matches
  }
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', onMediaChange)
  } else if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(onMediaChange)
  }
  loadProject()
})

onBeforeUnmount(() => {
  if (!mediaQuery || !onMediaChange) return
  if (typeof mediaQuery.removeEventListener === 'function') {
    mediaQuery.removeEventListener('change', onMediaChange)
  } else if (typeof mediaQuery.removeListener === 'function') {
    mediaQuery.removeListener(onMediaChange)
  }
})
</script>

<style scoped>
:global(.stage-select-dropdown .el-select-dropdown__wrap) { max-height: 420px; }

@media (max-width: 768px) {
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-slider__marks-text) {
    font-size: 11px;
  }

  .form-actions :deep(.el-form-item__content) {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .form-actions :deep(.el-button) {
    width: 100%;
    margin-left: 0;
  }
}
</style>
