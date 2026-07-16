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
import type { ArtistVerificationRequest } from '../../types/artist'
import client, { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from './client'

const CURRENT_USER_KEY = 'current_user'
const AUTH_USER_ID_KEY = 'auth_user_id'
const USERS_KEY = 'users'
const VERIFICATION_REQUESTS_KEY = 'verification_requests'
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

export interface ArtistRegistrationResult {
  status: 'pending_approval'
  message: string
  user?: User
}

interface StoredUser extends User {
  account_status?: 'active' | 'pending_approval'
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

function nowIso(): string {
  return new Date().toISOString()
}

function getNextId(items: Array<{ id: number }>): number {
  return items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1
}

function toMockCompatibleUser(user: User, accountStatus?: StoredUser['account_status']): StoredUser {
  const currentTime = nowIso()
  return {
    ...user,
    username: user.username || String(user.id),
    display_name: user.display_name || user.username || user.email,
    subscription_tier: user.subscription_tier ?? 'basic',
    followers_count: user.followers_count ?? 0,
    following_count: user.following_count ?? 0,
    daily_streams_count: user.daily_streams_count ?? 0,
    created_at: user.created_at || currentTime,
    updated_at: user.updated_at ?? currentTime,
    account_status: accountStatus,
  }
}

function readMockUsers(): StoredUser[] {
  return storage.get<StoredUser[]>(USERS_KEY) ?? []
}

function writeMockCurrentUser(user: User | null): void {
  if (user) {
    storage.set(CURRENT_USER_KEY, user)
    storage.set(AUTH_USER_ID_KEY, user.id)
    return
  }

  storage.remove(CURRENT_USER_KEY)
  storage.remove(AUTH_USER_ID_KEY)
}

function upsertMockUser(user: User, accountStatus?: StoredUser['account_status']): User {
  const users = readMockUsers()
  const mockUser = toMockCompatibleUser(user, accountStatus)
  const existingIndex = users.findIndex(
    (candidate) => candidate.id === user.id || candidate.email === user.email,
  )
  const nextUsers =
    existingIndex === -1
      ? [...users, mockUser]
      : users.map((candidate, index) =>
          index === existingIndex
            ? {
                ...candidate,
                ...mockUser,
                account_status: accountStatus ?? candidate.account_status,
              }
            : candidate,
        )

  storage.set(USERS_KEY, nextUsers)
  return mockUser
}

function syncMockUser(user: User, accountStatus?: StoredUser['account_status']): User {
  const mockUser = upsertMockUser(user, accountStatus)
  writeMockCurrentUser(mockUser)
  return mockUser
}

function syncArtistVerificationRequest(
  user: User,
  payload: RegisterArtistPayload,
): void {
  const requests =
    storage.get<ArtistVerificationRequest[]>(VERIFICATION_REQUESTS_KEY) ?? []
  const existingIndex = requests.findIndex(
    (request) => request.user_id === user.id || request.email === user.email,
  )
  const currentTime = nowIso()
  const request: ArtistVerificationRequest = {
    id: existingIndex === -1 ? getNextId(requests) : requests[existingIndex].id,
    user_id: user.id,
    stage_name: payload.stage_name.trim(),
    email: user.email,
    portfolio_links: payload.portfolio_links,
    verification_status: 'pending',
    created_at:
      existingIndex === -1 ? currentTime : requests[existingIndex].created_at,
    updated_at: currentTime,
  }

  storage.set(
    VERIFICATION_REQUESTS_KEY,
    existingIndex === -1
      ? [...requests, request]
      : requests.map((candidate, index) =>
          index === existingIndex ? request : candidate,
        ),
  )
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
): Promise<ArtistRegistrationResult> {
  try {
    const response = await client.post<ArtistRegistrationResult>(
      '/auth/register/artist/',
      payload,
    )
    if (response.data.user) {
      upsertMockUser(response.data.user, 'pending_approval')
      syncArtistVerificationRequest(response.data.user, payload)
    }
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, UNEXPECTED_ERROR_MESSAGE))
  }
}

export async function requestPasswordRecovery(
  payload: ForgotPasswordPayload,
): Promise<void> {
  void payload
}

export function logout(): void {
  setCurrentUser(null)
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    syncMockUser(user)
    return
  }
  writeMockCurrentUser(null)
}
