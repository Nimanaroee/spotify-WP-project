import type { EntityId, Timestamps } from './common'
import type { SubscriptionTier } from '../lib/constants/subscriptionLimits'

export type AppLanguage = 'en' | 'fa'
export type SystemVoice = 'default' | 'calm' | 'bright'

export interface UserPreferences extends Timestamps {
  user_id: EntityId
  notification_limit: number
  app_sound_enabled: boolean
  language: AppLanguage
  system_voice: SystemVoice
}

export interface UpdateUserPreferencesPayload {
  notification_limit?: number
  app_sound_enabled?: boolean
  language?: AppLanguage
  system_voice?: SystemVoice
}

export interface UpdateSubscriptionTierPayload {
  subscription_tier: SubscriptionTier
}
