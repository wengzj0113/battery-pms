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
          <el-menu-item v-if="user.role === '管理员'" index="/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header>
          <div class="header-left">
            <h3>全局项目看板</h3>
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
          <div class="stats-container">
            <el-row :gutter="20">
              <el-col :span="6">
                <div class="stat-card stat-primary">
                  <div class="stat-icon"><el-icon :size="32"><Folder /></el-icon></div>
                  <div class="stat-content">
                    <div class="stat-value">{{ stats.totalProjects }}</div>
                    <div class="stat-label">在手项目总数</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-card stat-success">
                  <div class="stat-icon"><el-icon :size="32"><SuccessFilled /></el-icon></div>
                  <div class="stat-content">
                    <div class="stat-value">{{ stats.inProgressProjects }}</div>
                    <div class="stat-label">进行中项目</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-card stat-warning">
                  <div class="stat-icon"><el-icon :size="32"><WarningFilled /></el-icon></div>
                  <div class="stat-content">
                    <div class="stat-value">{{ stats.expiringProjects }}</div>
                    <div class="stat-label">即将到期</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-card stat-info">
                  <div class="stat-icon"><el-icon :size="32"><CircleCheckFilled /></el-icon></div>
                  <div class="stat-content">
                    <div class="stat-value">{{ stats.completedProjects }}</div>
                    <div class="stat-label">已验收项目</div>
                  </div>
                </div>
              </el-col>
              <el-col v-if="user.role === '管理员'" :span="6">
                <div class="stat-card stat-primary">
                  <div class="stat-icon"><el-icon :size="32"><Money /></el-icon></div>
                  <div class="stat-content">
                    <div class="stat-value">¥{{ (stats.totalAmount || 0).toLocaleString() }}</div>
                    <div class="stat-label">项目总额</div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>

          <el-row :gutter="20" style="margin-top: 20px">
            <el-col :span="12">
              <el-card shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span>项目状态分布</span>
                  </div>
                </template>
                <div ref="chartRef1" style="height: 300px"></div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span>本月统计</span>
                  </div>
                </template>
                <div class="month-stats">
                  <div class="month-stat-item">
                    <div class="month-stat-value">{{ stats.newThisMonth }}</div>
                    <div class="month-stat-label">本月新增项目</div>
                  </div>
                  <div class="month-stat-item">
                    <div class="month-stat-value">{{ stats.deliveredThisMonth }}</div>
                    <div class="month-stat-label">本月交付项目</div>
                  </div>
                </div>
                <div ref="chartRef2" style="height: 220px"></div>
              </el-card>
            </el-col>
          </el-row>

          <el-card shadow="hover" style="margin-top: 20px">
            <template #header>
              <div class="card-header">
                <span>全部项目列表</span>
                <el-button type="primary" size="small" @click="$router.push('/projects')">查看全部</el-button>
              </div>
            </template>
            <el-table :data="projects" stripe>
              <el-table-column prop="project_code" label="项目编号" width="140" />
              <el-table-column prop="project_name" label="项目名称" min-width="180" />
              <el-table-column prop="customer_name" label="客户名称" width="140" />
              <el-table-column v-if="user.role === '管理员'" prop="contract_amount" label="合同金额" width="120">
                <template #default="{ row }">
                  ¥{{ (row.contract_amount || 0).toLocaleString() }}
                </template>
              </el-table-column>
              <el-table-column prop="current_stage" label="当前阶段" width="120">
                <template #default="{ row }">
                  <el-tag :type="getStageType(row.current_stage)">{{ row.current_stage }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="project_status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.project_status === '进行中' ? 'primary' : 'success'">
                    {{ row.project_status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="planned_delivery_date" label="计划交付" width="120" />
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="$router.push(`/projects/${row.id}`)">查看</el-button>
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
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getDashboardStats, getProjects } from '../api'
import { Money } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const user = reactive(JSON.parse(localStorage.getItem('user') || '{}'))
const stats = reactive({
  totalProjects: 0,
  inProgressProjects: 0,
  completedProjects: 0,
  expiringProjects: 0,
  newThisMonth: 0,
  deliveredThisMonth: 0,
  stageDistribution: []
})
const projects = ref([])
const chartRef1 = ref(null)
const chartRef2 = ref(null)

const activeMenu = computed(() => route.path)

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

const loadStats = async () => {
  try {
    const data = await getDashboardStats()
    Object.assign(stats, data)
    initCharts()
  } catch (err) {
    ElMessage.error('加载统计数据失败')
  }
}

const loadProjects = async () => {
  try {
    projects.value = await getProjects()
    projects.value = projects.value.slice(0, 10)
  } catch (err) {
    ElMessage.error('加载项目列表失败')
  }
}

const initCharts = () => {
  if (!chartRef1.value) return

  const chart1 = echarts.init(chartRef1.value)
  const stageData = stats.stageDistribution || []
  const colors = ['#909399', '#409EFF', '#E6A23C', '#F56C6C', '#67C23A', '#909399', '#409EFF', '#E6A23C', '#67C23A']
  
  chart1.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', left: 'center' },
    color: colors,
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: stageData.map((item, index) => ({ value: item.count, name: item.stage, itemStyle: { color: colors[index % colors.length] } }))
    }]
  })

  if (chartRef2.value) {
    const chart2 = echarts.init(chartRef2.value)
    chart2.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: ['本月新增', '本月交付'] },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: [stats.newThisMonth, stats.deliveredThisMonth],
        itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] }
      }]
    })
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
  loadStats()
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
.stats-container { margin-bottom: 20px; }
.stat-card { background: #fff; border-radius: 8px; padding: 24px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); }
.stat-primary .stat-icon { color: #409eff; background: #ecf5ff; padding: 16px; border-radius: 8px; }
.stat-success .stat-icon { color: #67c23a; background: #f0f9eb; padding: 16px; border-radius: 8px; }
.stat-warning .stat-icon { color: #e6a23c; background: #fdf6ec; padding: 16px; border-radius: 8px; }
.stat-info .stat-icon { color: #909399; background: #f4f4f5; padding: 16px; border-radius: 8px; }
.stat-value { font-size: 28px; font-weight: bold; color: #303133; }
.stat-label { font-size: 14px; color: #909399; margin-top: 4px; }
.card-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
.month-stats { display: flex; justify-content: space-around; margin-bottom: 20px; }
.month-stat-item { text-align: center; }
.month-stat-value { font-size: 36px; font-weight: bold; color: #409eff; }
.month-stat-label { font-size: 14px; color: #909399; margin-top: 8px; }
</style>
