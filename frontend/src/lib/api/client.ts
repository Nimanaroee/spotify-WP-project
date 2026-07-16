import axios from 'axios'

export const ACCESS_TOKEN_KEY = 'auth_access_token'
export const REFRESH_TOKEN_KEY = 'auth_refresh_token'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default client
