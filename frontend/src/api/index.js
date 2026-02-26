import axios from 'axios'

// 自动判断环境：生产环境使用云端后端，开发环境使用本地代理
const baseURL = import.meta.env.PROD 
  ? 'https://battery-pms-production.up.railway.app/api' 
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
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const login = (data) => api.post('/login', data)
export const getUsers = () => api.get('/users')
export const getDashboardStats = () => api.get('/dashboard/stats')
export const getProjects = (params) => api.get('/projects', { params })
export const getProject = (id) => api.get(`/projects/${id}`)
export const createProject = (data) => api.post('/projects', data)
export const updateProject = (id, data) => api.put(`/projects/${id}`, data)
export const deleteProject = (id) => api.delete(`/projects/${id}`)

export default api
