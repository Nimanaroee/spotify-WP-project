import { isAxiosError } from 'axios'

import type {
  EntityId,
  UpdateSubscriptionTierPayload,
  UpdateUserPreferencesPayload,
  UserPreferences,
} from '../../types'
import type { SubscriptionTier } from '../constants/subscriptionLimits'
import type { AppThemeMode } from '../../theme/appTheme'
import client from './client'

interface PreferencesResponse {
  theme: AppThemeMode
  notification_limit: number
  app_sound_enabled: boolean
  language: UserPreferences['language']
  system_voice: UserPreferences['system_voice']
  created_at: string
  updated_at: string
}

interface SubscriptionResponse {
  subscription_tier: SubscriptionTier
}

function getApiErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') {
      return detail
    }
  }
  return 'Unable to load or update preferences.'
}

function toUserPreferences(
  response: PreferencesResponse,
  userId: EntityId,
): UserPreferences {
  return {
    user_id: userId,
    ...response,
  }
}

export async function getUserPreferencesFromApi(
  userId: EntityId,
): Promise<UserPreferences> {
  try {
    const response = await client.get<PreferencesResponse>('/users/preferences/')
    return toUserPreferences(response.data, userId)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function updateUserPreferencesFromApi(
  userId: EntityId,
  payload: UpdateUserPreferencesPayload,
): Promise<UserPreferences> {
  try {
    const response = await client.patch<PreferencesResponse>(
      '/users/preferences/',
      payload,
    )
    return toUserPreferences(response.data, userId)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function getUserSubscriptionFromApi(): Promise<SubscriptionTier> {
  try {
    const response = await client.get<SubscriptionResponse>(
      '/users/subscription/',
    )
    return response.data.subscription_tier
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function updateUserSubscriptionFromApi(
  payload: UpdateSubscriptionTierPayload,
): Promise<SubscriptionTier> {
  try {
    const response = await client.put<SubscriptionResponse>(
      '/users/subscription/',
      payload,
    )
    return response.data.subscription_tier
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}
