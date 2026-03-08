<template>
  <div class="layout">
    <el-container>
      <el-aside class="aside" width="220px">
        <div class="logo">
          <img class="logo-img" :src="logoSrc" alt="logo" @error="onLogoError" />
          <span>徐力电子项目管理系统</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#1a1a2e"
          text-color="#fff"
          active-text-color="#409eff"
        >
          <el-menu-item index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>项目看板</span>
          </el-menu-item>
          <el-menu-item index="/projects">
            <el-icon><FolderOpened /></el-icon>
            <span>项目管理</span>
          </el-menu-item>
          <el-menu-item index="/project-plans">
            <el-icon><Calendar /></el-icon>
            <span>项目计划管理</span>
          </el-menu-item>
          <el-menu-item index="/project/new">
            <el-icon><Plus /></el-icon>
            <span>新建项目</span>
          </el-menu-item>
          <el-menu-item v-if="user.role === '管理员'" index="/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item v-if="user.role === '管理员'" index="/login-logs">
            <el-icon><Document /></el-icon>
            <span>登录日志</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header>
          <div class="header-left">
            <el-button class="mobile-menu-btn" text @click="drawerOpen = true">
              <el-icon><Menu /></el-icon>
            </el-button>
            <slot name="header-left">
              <h3>{{ title }}</h3>
            </slot>
          </div>
          <div class="header-right">
            <slot name="header-right" :user="user" :logout="logout">
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
            </slot>
          </div>
        </el-header>
        <el-main>
          <slot />
        </el-main>
      </el-container>
    </el-container>

    <el-drawer v-model="drawerOpen" direction="ltr" size="240px" :with-header="false">
      <div class="drawer-logo">
        <img class="logo-img" :src="logoSrc" alt="logo" @error="onLogoError" />
        <span>徐力电子项目管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        @select="drawerOpen = false"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>项目看板</span>
        </el-menu-item>
        <el-menu-item index="/projects">
          <el-icon><FolderOpened /></el-icon>
          <span>项目管理</span>
        </el-menu-item>
        <el-menu-item index="/project-plans">
          <el-icon><Calendar /></el-icon>
          <span>项目计划管理</span>
        </el-menu-item>
        <el-menu-item index="/project/new">
          <el-icon><Plus /></el-icon>
          <span>新建项目</span>
        </el-menu-item>
        <el-menu-item v-if="user.role === '管理员'" index="/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item v-if="user.role === '管理员'" index="/login-logs">
          <el-icon><Document /></el-icon>
          <span>登录日志</span>
        </el-menu-item>
      </el-menu>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Calendar, DataAnalysis, Document, FolderOpened, Menu, Plus, User } from '@element-plus/icons-vue'

defineProps({
  title: { type: String, default: '' }
})

const router = useRouter()
const route = useRoute()
const drawerOpen = ref(false)
const logoSrc = ref('/logo.png')

const onLogoError = () => {
  if (logoSrc.value !== '/logo.svg') {
    logoSrc.value = '/logo.svg'
  }
}

const user = reactive(JSON.parse(localStorage.getItem('user') || '{}'))
const activeMenu = computed(() => route.path)

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

const handleCommand = (cmd) => {
  if (cmd === 'logout') {
    logout()
  }
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
}

.el-container {
  min-height: 100vh;
}

.aside {
  background: #1a1a2e;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  gap: 8px;
  border-bottom: 1px solid #2a2a4e;
}

.logo-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.el-menu {
  border-right: none;
}

.el-header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid #e4e7ed;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-left :deep(h3) {
  margin: 0;
  color: #303133;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
}

.el-main {
  background: #f5f7fa;
  padding: 20px;
}

.mobile-menu-btn {
  display: none;
}

.drawer-logo {
  height: 56px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #303133;
  padding: 0 8px;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .aside {
    display: none;
  }

  .mobile-menu-btn {
    display: inline-flex;
  }

  .el-header {
    padding: 0 12px;
  }

  .el-main {
    padding: 12px;
  }
}
</style>
