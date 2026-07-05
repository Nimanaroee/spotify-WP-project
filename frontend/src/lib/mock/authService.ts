import { ROLES } from '../constants/roles'
import { ROUTES } from '../constants/routes'
import { storage } from './storage'
import type {
  ForgotPasswordPayload,
  RegisterArtistPayload,
  RegisterListenerPayload,
  User,
} from '../../types/user'
import type { ArtistVerificationRequest } from '../../types/artist'

interface StoredUser extends User {
  password: string
  account_status?: 'active' | 'pending_approval'
}

export interface LoginResult {
  user: User
  redirectPath: string
}

export interface ArtistRegistrationResult {
  status: 'pending_approval'
  message: string
}

const USERS_KEY = 'users'
const AUTH_USER_ID_KEY = 'auth_user_id'
const CURRENT_USER_KEY = 'current_user'
const VERIFICATION_REQUESTS_KEY = 'verification_requests'
const PASSWORD_RECOVERY_REQUESTS_KEY = 'password_recovery_requests'

function nowIso(): string {
  return new Date().toISOString()
}

function readUsers(): StoredUser[] {
  return storage.get<StoredUser[]>(USERS_KEY) ?? []
}

function writeUsers(users: StoredUser[]): void {
  storage.set(USERS_KEY, users)
}

function writeCurrentUser(user: User | null): void {
  if (user) {
    storage.set(CURRENT_USER_KEY, user)
    storage.set(AUTH_USER_ID_KEY, user.id)
    return
  }

  storage.remove(CURRENT_USER_KEY)
  storage.remove(AUTH_USER_ID_KEY)
}

function withoutPassword(user: StoredUser): User {
  const { password: _password, account_status: _accountStatus, ...publicUser } = user
  return publicUser
}

function getNextId(items: Array<{ id: number }>): number {
  return items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function createUsername(source: string, users: StoredUser[]): string {
  const base =
    source
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'user'
  let username = base
  let suffix = 1

  while (users.some((user) => user.username === username)) {
    suffix += 1
    username = `${base}_${suffix}`
  }

  return username
}

export function getRoleHomePath(user: User): string {
  if (user.role === ROLES.SUPPORT || user.role === ROLES.ADMIN) {
    return ROUTES.ADMIN_TICKETS
  }
  return ROUTES.HOME
}

export function getCurrentUser(): User | null {
  const currentUser = storage.get<User>(CURRENT_USER_KEY)
  if (currentUser) {
    return currentUser
  }

  const userId = storage.get<number>(AUTH_USER_ID_KEY)
  if (!userId) {
    return null
  }

  const user = readUsers().find((candidate) => candidate.id === userId)
  return user ? withoutPassword(user) : null
}

export function login(email: string, password: string): LoginResult {
  const normalizedEmail = normalizeEmail(email)
  const user = readUsers().find((candidate) => candidate.email === normalizedEmail)

  if (user?.account_status === 'pending_approval') {
    throw new Error('Your artist account is pending approval.')
  }

  if (!user || user.password !== password) {
    throw new Error('Invalid email or password.')
  }

  const publicUser = withoutPassword(user)
  writeCurrentUser(publicUser)
  return { user: publicUser, redirectPath: getRoleHomePath(publicUser) }
}

export function registerListener(payload: RegisterListenerPayload): User {
  const users = readUsers()
  const normalizedEmail = normalizeEmail(payload.email)

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error('An account with this email already exists.')
  }

  const createdAt = nowIso()
  const user: StoredUser = {
    id: getNextId(users),
    username: createUsername(payload.display_name, users),
    email: normalizedEmail,
    password: payload.password,
    display_name: payload.display_name.trim(),
    role: ROLES.LISTENER,
    birth_date: payload.birth_date,
    gender: payload.gender,
    subscription_tier: 'basic',
    followers_count: 0,
    following_count: 0,
    daily_streams_count: 0,
    created_at: createdAt,
    updated_at: createdAt,
  }

  writeUsers([...users, user])
  writeCurrentUser(withoutPassword(user))
  return withoutPassword(user)
}

export function registerArtist(
  payload: RegisterArtistPayload,
): ArtistRegistrationResult {
  const users = readUsers()
  const normalizedEmail = normalizeEmail(payload.email)

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error('An account with this email already exists.')
  }

  const createdAt = nowIso()
  const user: StoredUser = {
    id: getNextId(users),
    username: createUsername(payload.stage_name, users),
    email: normalizedEmail,
    password: payload.password,
    display_name: payload.stage_name.trim(),
    role: ROLES.ARTIST,
    subscription_tier: 'basic',
    followers_count: 0,
    following_count: 0,
    daily_streams_count: 0,
    account_status: 'pending_approval',
    created_at: createdAt,
    updated_at: createdAt,
  }

  const currentRequests =
    storage.get<ArtistVerificationRequest[]>(VERIFICATION_REQUESTS_KEY) ?? []
  const request: ArtistVerificationRequest = {
    id: getNextId(currentRequests),
    user_id: user.id,
    stage_name: payload.stage_name.trim(),
    email: normalizedEmail,
    portfolio_links: payload.portfolio_links,
    verification_status: 'pending',
    created_at: createdAt,
    updated_at: createdAt,
  }

  writeUsers([...users, user])
  storage.set(VERIFICATION_REQUESTS_KEY, [...currentRequests, request])

  return {
    status: 'pending_approval',
    message: 'Your artist account request is pending approval.',
  }
}

export function requestPasswordRecovery(payload: ForgotPasswordPayload): void {
  const requests = storage.get<ForgotPasswordPayload[]>(PASSWORD_RECOVERY_REQUESTS_KEY) ?? []
  storage.set(PASSWORD_RECOVERY_REQUESTS_KEY, [
    ...requests,
    { email: normalizeEmail(payload.email) },
  ])
}

export function logout(): void {
  writeCurrentUser(null)
}

export function setCurrentUser(user: User | null): void {
  writeCurrentUser(user)
}
