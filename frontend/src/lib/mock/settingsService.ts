import type {
  EntityId,
  UpdateSubscriptionTierPayload,
  UpdateUserPreferencesPayload,
  User,
  UserPreferences,
} from '../../types'
import { storage } from './storage'

const USER_PREFERENCES_KEY = 'user_preferences'
const USERS_KEY = 'users'
const CURRENT_USER_KEY = 'current_user'
const AUTH_USER_ID_KEY = 'auth_user_id'

interface StoredUser extends User {
  password?: string
}

function nowIso(): string {
  return new Date().toISOString()
}

function readPreferences(): UserPreferences[] {
  return storage.get<UserPreferences[]>(USER_PREFERENCES_KEY) ?? []
}

function writePreferences(preferences: UserPreferences[]): void {
  storage.set(USER_PREFERENCES_KEY, preferences)
}

function readUsers(): StoredUser[] {
  return storage.get<StoredUser[]>(USERS_KEY) ?? []
}

function writeUsers(users: StoredUser[]): void {
  storage.set(USERS_KEY, users)
}

function stripPassword(user: StoredUser): User {
  const { password: _password, ...publicUser } = user
  return publicUser
}

function defaultPreferences(userId: EntityId): UserPreferences {
  const createdAt = nowIso()

  return {
    user_id: userId,
    notification_limit: 20,
    app_sound_enabled: true,
    language: 'en',
    system_voice: 'default',
    created_at: createdAt,
    updated_at: createdAt,
  }
}

export function getUserPreferences(userId: EntityId): UserPreferences {
  const preferences = readPreferences()
  const existingPreferences = preferences.find(
    (preference) => preference.user_id === userId,
  )

  if (existingPreferences) {
    return existingPreferences
  }

  const createdPreferences = defaultPreferences(userId)
  writePreferences([...preferences, createdPreferences])
  return createdPreferences
}

export function updateUserPreferences(
  userId: EntityId,
  payload: UpdateUserPreferencesPayload,
): UserPreferences {
  const preferences = readPreferences()
  const currentPreferences =
    preferences.find((preference) => preference.user_id === userId) ??
    defaultPreferences(userId)
  const nextPreferences: UserPreferences = {
    ...currentPreferences,
    ...payload,
    notification_limit:
      payload.notification_limit ?? currentPreferences.notification_limit,
    updated_at: nowIso(),
  }
  const hasExistingPreferences = preferences.some(
    (preference) => preference.user_id === userId,
  )

  writePreferences(
    hasExistingPreferences
      ? preferences.map((preference) =>
          preference.user_id === userId ? nextPreferences : preference,
        )
      : [...preferences, nextPreferences],
  )

  return nextPreferences
}

export function updateSubscriptionTier(
  userId: EntityId,
  payload: UpdateSubscriptionTierPayload,
): User {
  const users = readUsers()
  const user = users.find((candidate) => candidate.id === userId)

  if (!user) {
    throw new Error('User not found.')
  }

  const nextUser: StoredUser = {
    ...user,
    subscription_tier: payload.subscription_tier,
    updated_at: nowIso(),
  }

  writeUsers(users.map((candidate) => (candidate.id === userId ? nextUser : candidate)))
  storage.set(CURRENT_USER_KEY, stripPassword(nextUser))
  storage.set(AUTH_USER_ID_KEY, nextUser.id)

  return stripPassword(nextUser)
}

export function deleteAccount(userId: EntityId): void {
  writeUsers(readUsers().filter((user) => user.id !== userId))
  writePreferences(readPreferences().filter((preference) => preference.user_id !== userId))
  storage.remove(CURRENT_USER_KEY)
  storage.remove(AUTH_USER_ID_KEY)
}
