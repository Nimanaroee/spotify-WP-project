import axios, { type AxiosRequestConfig } from 'axios'

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

let refreshPromise: Promise<string> | null = null

function clearSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem('current_user')
}

async function refreshAccessToken(): Promise<string> {
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refresh) {
    throw new Error('No refresh token available.')
  }
  const response = await axios.post<{ access: string }>(
    `${client.defaults.baseURL}/auth/refresh/`,
    { refresh },
  )
  const access = response.data.access
  localStorage.setItem(ACCESS_TOKEN_KEY, access)
  return access
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retried ||
      originalRequest.url?.includes('/auth/refresh/') ||
      originalRequest.url?.includes('/auth/login/')
    ) {
      return Promise.reject(error)
    }

    originalRequest._retried = true

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const access = await refreshPromise
      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${access}`,
      }
      return client(originalRequest)
    } catch (refreshError) {
      clearSession()
      return Promise.reject(refreshError)
    }
  },
)

export default client
