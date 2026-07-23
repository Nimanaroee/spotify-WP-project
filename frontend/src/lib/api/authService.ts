import { isAxiosError } from 'axios'
import { ROLES } from '../constants/roles'
import { ROUTES } from '../constants/routes'
import { storage } from '../mock/storage'
import type {
  ForgotPasswordPayload,
  RegisterArtistPayload,
  RegisterListenerPayload,
  User,
} from '../../types/user'
import client, { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from './client'

const CURRENT_USER_KEY = 'current_user'
const UNEXPECTED_ERROR_MESSAGE = 'An unexpected error occurred.'

interface AuthResponse {
  access: string
  refresh: string
  user: User
}

export interface LoginResult {
  user: User
  redirectPath: string
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object') {
      const detail = (data as { detail?: unknown }).detail
      if (typeof detail === 'string') {
        return detail
      }
      const firstMessage = Object.values(data).flat(4).find(Boolean)
      if (typeof firstMessage === 'string') {
        return firstMessage
      }
      if (firstMessage && typeof firstMessage === 'object' && 'message' in firstMessage) {
        const message = (firstMessage as { message?: unknown }).message
        if (typeof message === 'string') {
          return message
        }
      }
    }
    if (error.response) {
      return UNEXPECTED_ERROR_MESSAGE
    }
  }
  return fallback || UNEXPECTED_ERROR_MESSAGE
}

function persistSession(response: AuthResponse): User {
  localStorage.setItem(ACCESS_TOKEN_KEY, response.access)
  localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh)
  setCurrentUser(response.user)
  return response.user
}

export function getRoleHomePath(user: User): string {
  if (user.role === ROLES.SUPPORT || user.role === ROLES.ADMIN) {
    return ROUTES.ADMIN_TICKETS
  }
  return ROUTES.HOME
}

export function getCurrentUser(): User | null {
  return storage.get<User>(CURRENT_USER_KEY)
}

export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const response = await client.post<AuthResponse>('/auth/login/', { email, password })
    const user = persistSession(response.data)
    return { user, redirectPath: getRoleHomePath(user) }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Invalid email or password.'))
  }
}

export async function registerListener(payload: RegisterListenerPayload): Promise<User> {
  try {
    const response = await client.post<AuthResponse>('/auth/register/listener/', payload)
    return persistSession(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, UNEXPECTED_ERROR_MESSAGE))
  }
}

export async function registerArtist(
  payload: RegisterArtistPayload,
): Promise<User> {
  try {
    const response = await client.post<AuthResponse>(
      '/auth/register/artist/',
      payload,
    )
    return persistSession(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, UNEXPECTED_ERROR_MESSAGE))
  }
}

export async function requestPasswordRecovery(
  payload: ForgotPasswordPayload,
): Promise<void> {
  void payload
}

export async function logout(): Promise<void> {
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY)

  try {
    if (refresh) {
      await client.post('/auth/logout/', { refresh })
    }
  } catch (error) {
    void error
  } finally {
    setCurrentUser(null)
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    storage.set(CURRENT_USER_KEY, user)
    return
  }
  storage.remove(CURRENT_USER_KEY)
}
