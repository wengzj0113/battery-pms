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
          <el-menu-item index="/users" v-if="isAdmin">
            <el-icon><UserFilled /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header>
          <div class="header-left">
            <h3>用户管理</h3>
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
            <template #header>
              <div class="card-header">
                <span>用户列表</span>
                <el-button type="primary" @click="openAddDialog">添加用户</el-button>
              </div>
            </template>
            <el-table :data="users" stripe v-loading="loading">
              <el-table-column prop="username" label="用户名" width="150" />
              <el-table-column prop="realname" label="真实姓名" width="150" />
              <el-table-column prop="role" label="角色" width="120">
                <template #default="{ row }">
                  <el-tag>{{ row.role }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="创建时间" width="180" />
              <el-table-column label="操作" width="240" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
                  <el-button link type="warning" @click="openPasswordDialog(row)">修改密码</el-button>
                  <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-main>
      </el-container>
    </el-container>

    <el-dialog v-model="userDialogVisible" :title="isEdit ? '编辑用户' : '添加用户'" width="500px">
      <el-form ref="userFormRef" :model="userForm" :rules="userRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="userForm.password" type="password" show-password :placeholder="isEdit ? '留空表示不修改密码' : '请输入密码'" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realname">
          <el-input v-model="userForm.realname" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option v-for="item in roles" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUser" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="80px">
        <el-form-item label="新密码" prop="password">
          <el-input v-model="passwordForm.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPassword" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUsers, createUser, updateUser, deleteUser, updateUserPassword } from '../api'

const router = useRouter()
const route = useRoute()

const user = reactive(JSON.parse(localStorage.getItem('user') || '{}'))
const isAdmin = computed(() => user.role === '管理员')

const users = ref([])
const loading = ref(false)
const submitting = ref(false)

const activeMenu = computed(() => route.path)

const roles = ['管理员', '技术', '采购', '生产', '交付', '财务', '售后']

const userDialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const isEdit = ref(false)
const editingUserId = ref(null)

const userFormRef = ref(null)
const passwordFormRef = ref(null)

const userForm = reactive({
  username: '',
  password: '',
  realname: '',
  role: ''
})

const passwordForm = reactive({
  password: '',
  confirmPassword: ''
})

const userRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  realname: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const passwordRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const loadUsers = async () => {
  loading.value = true
  try {
    users.value = await getUsers()
  } catch (err) {
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  isEdit.value = false
  editingUserId.value = null
  userForm.username = ''
  userForm.password = ''
  userForm.realname = ''
  userForm.role = ''
  userDialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  editingUserId.value = row.id
  userForm.username = row.username
  userForm.password = ''
  userForm.realname = row.realname
  userForm.role = row.role
  userDialogVisible.value = true
}

const openPasswordDialog = (row) => {
  editingUserId.value = row.id
  passwordForm.password = ''
  passwordForm.confirmPassword = ''
  passwordDialogVisible.value = true
}

const submitUser = async () => {
  if (!userFormRef.value) return
  await userFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const data = { ...userForm }
        if (isEdit.value && !data.password) {
          delete data.password
        }
        if (isEdit.value) {
          await updateUser(editingUserId.value, data)
          ElMessage.success('用户更新成功')
        } else {
          await createUser(data)
          ElMessage.success('用户创建成功')
        }
        userDialogVisible.value = false
        loadUsers()
      } catch (err) {
        ElMessage.error(err.message || '操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const submitPassword = async () => {
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await updateUserPassword(editingUserId.value, passwordForm.password)
        ElMessage.success('密码修改成功')
        passwordDialogVisible.value = false
      } catch (err) {
        ElMessage.error(err.message || '密码修改失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除用户 "${row.realname}" 吗？`, '警告', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteUser(row.id)
      ElMessage.success('删除成功')
      loadUsers()
    } catch (err) {
      ElMessage.error(err.message || '删除失败')
    }
  }).catch(() => {})
}

const handleCommand = (cmd) => {
  if (cmd === 'logout') {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }
}

onMounted(() => {
  if (!isAdmin.value) {
    ElMessage.warning('您没有权限访问此页面')
    router.push('/dashboard')
    return
  }
  loadUsers()
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
.card-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
</style>
