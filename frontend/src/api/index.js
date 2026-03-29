import axios from 'axios'

// 自动判断环境：生产环境使用云端后端，开发环境使用本地代理
const baseURL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_BASE_URL || '/api')
  : '/api'

const api = axios.create({
  baseURL,
  timeout: 10000
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?redirect=${redirect}`
      }
    }
    return Promise.reject(error)
  }
)

export const login = (data) => api.post('/login', data)
export const register = (data) => api.post('/register', data)
export const getUsers = () => api.get('/users')
export const createUser = (data) => api.post('/users', data)
export const updateUser = (id, data) => api.put(`/users/${id}`, data)
export const deleteUser = (id) => api.delete(`/users/${id}`)
export const updateUserPassword = (id, password) => api.put(`/users/${id}/password`, { password })
export const getCurrentUser = () => api.get('/users/me')
export const getDashboardStats = () => api.get('/dashboard/stats')
export const getDashboardCheckpoints = (params) => api.get('/dashboard/checkpoints', { params })
export const getDashboardProjects = (params) => api.get('/dashboard/projects', { params })
export const getProjects = (params) => api.get('/projects', { params })
export const getProject = (id) => api.get(`/projects/${id}`)
export const createProject = (data) => api.post('/projects', data)
export const updateProject = (id, data) => api.put(`/projects/${id}`, data)
export const deleteProject = (id) => api.delete(`/projects/${id}`)
export const getProjectCheckpoints = (projectId) => api.get(`/projects/${projectId}/checkpoints`)
export const createProjectCheckpoint = (projectId, data) => api.post(`/projects/${projectId}/checkpoints`, data)
export const updateProjectCheckpoint = (projectId, checkpointId, data) => api.put(`/projects/${projectId}/checkpoints/${checkpointId}`, data)
export const deleteProjectCheckpoint = (projectId, checkpointId) => api.delete(`/projects/${projectId}/checkpoints/${checkpointId}`)
export const getProjectPlans = (projectId) => api.get(`/projects/${projectId}/plans`)
export const createProjectPlan = (projectId, data) => api.post(`/projects/${projectId}/plans`, data)
export const updateProjectPlan = (projectId, planId, data) => api.put(`/projects/${projectId}/plans/${planId}`, data)
export const deleteProjectPlan = (projectId, planId) => api.delete(`/projects/${projectId}/plans/${planId}`)
export const getLoginLogs = (params) => api.get('/login-logs', { params })

export default api
