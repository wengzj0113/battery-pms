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
            <el-button text @click="$router.push('/projects')">
              <el-icon><ArrowLeft /></el-icon>返回列表
            </el-button>
            <h3>项目详情看板</h3>
          </div>
          <div class="header-right">
            <el-button type="primary" @click="$router.push(`/projects/${id}/edit`)">
              <el-icon><Edit /></el-icon>编辑项目
            </el-button>
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
          <div v-if="project" class="project-detail">
            <el-row :gutter="20">
              <el-col :span="24">
                <el-card shadow="hover" class="header-card">
                  <div class="project-header">
                    <div class="project-title">
                      <h2>{{ project.project_name || '未命名项目' }}</h2>
                      <el-tag :type="getStageType(project.current_stage)" style="margin-left: 12px">{{ project.current_stage }}</el-tag>
                      <el-tag :type="project.project_status === '进行中' ? 'primary' : 'success'" style="margin-left: 8px">{{ project.project_status }}</el-tag>
                    </div>
                    <div class="project-meta">
                      <span>项目编号：{{ project.project_code }}</span>
                      <span>客户：{{ project.customer_name || '-' }}</span>
                      <span>签订日期：{{ project.signed_date || '-' }}</span>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top: 20px">
              <el-col v-if="isAdmin" :span="6">
                <div class="stat-card">
                  <div class="stat-label">合同金额</div>
                  <div class="stat-value">¥{{ (project.contract_amount || 0).toLocaleString() }}</div>
                </div>
              </el-col>
              <el-col v-if="isAdmin" :span="6">
                <div class="stat-card">
                  <div class="stat-label">已收金额</div>
                  <div class="stat-value success">¥{{ (project.received_amount || 0).toLocaleString() }}</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-card">
                  <div class="stat-label">采购进度</div>
                  <el-progress :percentage="project.purchase_progress || 0" :stroke-width="10" style="margin-top: 8px" />
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-card">
                  <div class="stat-label">生产进度</div>
                  <el-progress :percentage="project.production_progress || 0" :stroke-width="10" :color="'#67c23a'" style="margin-top: 8px" />
                </div>
              </el-col>
            </el-row>

            <el-card shadow="hover" style="margin-top: 20px">
              <template #header>
                <div class="card-header"><span>项目进度时间线</span></div>
              </template>
              <div class="timeline">
                <div v-for="(stage, index) in stages" :key="stage" class="timeline-item" :class="{ active: project.current_stage === stage, completed: stages.indexOf(project.current_stage) > index }">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">{{ stage }}</div>
                </div>
              </div>
            </el-card>

            <el-row :gutter="20" style="margin-top: 20px">
              <el-col :span="8">
                <el-card shadow="hover" class="module-card">
                  <template #header>
                    <div class="card-header"><el-icon><Setting /></el-icon>技术模块</div>
                  </template>
                  <div class="module-content">
                    <div class="module-item"><span class="label">设备型号：</span>{{ project.device_model || '-' }}</div>
                    <div class="module-item"><span class="label">电压范围：</span>{{ project.voltage_range || '-' }}</div>
                    <div class="module-item"><span class="label">通道数量：</span>{{ project.channel_count ? project.channel_count + '通道' : '-' }}</div>
                    <div class="module-item"><span class="label">技术方案：</span>{{ project.technical_solution ? '已配置' : '未配置' }}</div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card shadow="hover" class="module-card">
                  <template #header>
                    <div class="card-header"><el-icon><ShoppingCart /></el-icon>采购模块</div>
                  </template>
                  <div class="module-content">
                    <div class="module-item"><span class="label">采购进度：</span>{{ project.purchase_progress || 0 }}%</div>
                    <div class="module-item"><span class="label">采购清单：</span>{{ project.purchase_list ? '已配置' : '未配置' }}</div>
                    <div class="module-item"><span class="label">计划交付：</span>{{ project.planned_delivery_date || '-' }}</div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card shadow="hover" class="module-card">
                  <template #header>
                    <div class="card-header"><el-icon><Tools /></el-icon>生产模块</div>
                  </template>
                  <div class="module-content">
                    <div class="module-item"><span class="label">生产进度：</span>{{ project.production_progress || 0 }}%</div>
                    <div class="module-item"><span class="label">生产工单：</span>{{ project.production_order || '-' }}</div>
                    <div class="module-item"><span class="label">装配完成：</span>{{ project.assembly_complete_date || '-' }}</div>
                    <div class="module-item"><span class="label">测试完成：</span>{{ project.test_complete_date || '-' }}</div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top: 20px">
              <el-col :span="12">
                <el-card shadow="hover" class="module-card">
                  <template #header>
                    <div class="card-header"><el-icon><Monitor /></el-icon>软件版本</div>
                  </template>
                  <div class="module-content">
                    <div class="module-item"><span class="label">中位机软件版本：</span>{{ project.middle_software_version || '-' }}</div>
                    <div class="module-item"><span class="label">下位机软件版本：</span>{{ project.lower_software_version || '-' }}</div>
                    <div class="module-item"><span class="label">上位机软件版本：</span>{{ project.upper_software_version || '-' }}</div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card shadow="hover" class="module-card">
                  <template #header>
                    <div class="card-header"><el-icon><Document /></el-icon>图纸版本</div>
                  </template>
                  <div class="module-content">
                    <div class="module-item"><span class="label">线路板图纸版本：</span>{{ project.pcb_drawing_version || '-' }}</div>
                    <div class="module-item"><span class="label">结构设计图纸版本：</span>{{ project.structure_drawing_version || '-' }}</div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top: 20px">
              <el-col :span="8">
                <el-card shadow="hover" class="module-card">
                  <template #header>
                    <div class="card-header"><el-icon><Van /></el-icon>交付模块</div>
                  </template>
                  <div class="module-content">
                    <div class="module-item"><span class="label">发货日期：</span>{{ project.delivery_date || '-' }}</div>
                    <div class="module-item"><span class="label">物流单号：</span>{{ project.tracking_number || '-' }}</div>
                    <div class="module-item"><span class="label">调试状态：</span>{{ project.debug_status || '-' }}</div>
                    <div class="module-item"><span class="label">验收状态：</span>{{ project.acceptance_status || '-' }}</div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card shadow="hover" class="module-card">
                  <template #header>
                    <div class="card-header"><el-icon><Money /></el-icon>财务模块</div>
                  </template>
                  <div class="module-content">
                    <div v-if="isAdmin" class="module-item"><span class="label">应收金额：</span>¥{{ (project.receivable_amount || 0).toLocaleString() }}</div>
                    <div v-if="isAdmin" class="module-item"><span class="label">已收金额：</span>¥{{ (project.received_amount || 0).toLocaleString() }}</div>
                    <div v-if="isAdmin" class="module-item"><span class="label">合同金额：</span>¥{{ (project.contract_amount || 0).toLocaleString() }}</div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card shadow="hover" class="module-card">
                  <template #header>
                    <div class="card-header"><el-icon><Service /></el-icon>售后模块</div>
                  </template>
                  <div class="module-content">
                    <div class="module-item"><span class="label">售后状态：</span>{{ project.after_sale_status || '正常' }}</div>
                    <div class="module-item"><span class="label">维保到期：</span>{{ project.warranty_expiry_date || '-' }}</div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-card shadow="hover" style="margin-top: 20px">
              <template #header>
                <div class="card-header"><span>操作日志</span></div>
              </template>
              <el-timeline>
                <el-timeline-item v-for="log in project.logs" :key="log.id" :timestamp="log.created_at" placement="top">
                  <p><strong>{{ log.realname }}</strong> {{ log.action }}</p>
                  <p v-if="log.details" style="color: #909399; font-size: 12px">{{ log.details }}</p>
                </el-timeline-item>
                <el-timeline-item v-if="!project.logs || project.logs.length === 0" timestamp="" placement="top">
                  <p style="color: #909399">暂无操作记录</p>
                </el-timeline-item>
              </el-timeline>
            </el-card>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getProject } from '../api'

const router = useRouter()
const route = useRoute()

const id = route.params.id
const user = reactive(JSON.parse(localStorage.getItem('user') || '{}'))
const project = ref(null)
const loading = ref(false)

const stages = ['项目接单', '方案设计', '采购执行', '生产装配', '出厂测试', '发货交付', '现场调试', '验收完成', '售后运维']

const activeMenu = computed(() => '/projects')
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

const loadProject = async () => {
  loading.value = true
  try {
    project.value = await getProject(id)
  } catch (err) {
    ElMessage.error('加载项目失败')
  } finally {
    loading.value = false
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
.project-header { display: flex; justify-content: space-between; align-items: flex-start; }
.project-title { display: flex; align-items: center; }
.project-title h2 { margin: 0; }
.project-meta { display: flex; gap: 24px; color: #909399; font-size: 14px; margin-top: 8px; }
.stat-card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); }
.stat-label { color: #909399; font-size: 14px; margin-bottom: 8px; }
.stat-value { font-size: 24px; font-weight: bold; color: #303133; }
.stat-value.success { color: #67c23a; }
.timeline { display: flex; justify-content: space-between; padding: 20px 0; position: relative; }
.timeline::before { content: ''; position: absolute; top: 28px; left: 40px; right: 40px; height: 2px; background: #e4e7ed; }
.timeline-item { display: flex; flex-direction: column; align-items: center; position: relative; z-index: 1; }
.timeline-dot { width: 12px; height: 12px; border-radius: 50%; background: #e4e7ed; border: 2px solid #fff; margin-bottom: 8px; }
.timeline-item.completed .timeline-dot { background: #67c23a; }
.timeline-item.active .timeline-dot { background: #409eff; width: 16px; height: 16px; margin-bottom: 4px; }
.timeline-content { font-size: 12px; color: #909399; text-align: center; white-space: nowrap; }
.timeline-item.active .timeline-content { color: #409eff; font-weight: bold; }
.timeline-item.completed .timeline-content { color: #67c23a; }
.module-card { height: 100%; }
.module-card :deep(.el-card__header) { padding: 12px 16px; }
.card-header { display: flex; align-items: center; gap: 8px; font-weight: bold; }
.module-content { font-size: 14px; }
.module-item { margin-bottom: 12px; color: #606266; }
.module-item .label { color: #909399; }
</style>
