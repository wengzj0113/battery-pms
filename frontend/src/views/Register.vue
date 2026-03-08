<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-header">
        <h1>用户注册</h1>
        <h2>锂电池化成分容设备项目管理系统</h2>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleRegister">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="realname">
          <el-input v-model="form.realname" placeholder="姓名" :prefix-icon="Avatar" size="large" />
        </el-form-item>
        <el-form-item prop="role">
          <el-select v-model="form.role" placeholder="选择角色" size="large" style="width: 100%">
            <el-option v-for="r in roles" :key="r" :label="r" :value="r" />
          </el-select>
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" :prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" placeholder="确认密码" :prefix-icon="Lock" size="large" show-password @keyup.enter="handleRegister" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" style="width: 100%" @click="handleRegister">
            注 册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="register-actions">
        <el-button text @click="router.push('/login')">返回登录</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Avatar } from '@element-plus/icons-vue'
import { register } from '../api'

const router = useRouter()
const loading = ref(false)
const formRef = ref()

const roles = ['技术', '采购', '生产', '交付', '财务', '售后']

const form = reactive({
  username: '',
  realname: '',
  role: '',
  password: '',
  confirmPassword: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  realname: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_, value, callback) => {
        if (!value) return callback()
        if (value !== form.password) return callback(new Error('两次输入的密码不一致'))
        callback()
      },
      trigger: 'blur'
    }
  ]
}

const handleRegister = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await register({ username: form.username, password: form.password, realname: form.realname, role: form.role })
      ElMessage.success('注册成功，请登录')
      router.push({ path: '/login', query: { username: form.username } })
    } catch (err) {
      ElMessage.error(err.response?.data?.error || '注册失败')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.register-box {
  width: 460px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-header h1 {
  font-size: 22px;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.register-header h2 {
  font-size: 14px;
  color: #666;
  font-weight: normal;
}

.register-actions {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

@media (max-width: 480px) {
  .register-box {
    width: 90%;
    padding: 24px 20px;
    margin: 0 16px;
  }
}
</style>

