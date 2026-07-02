import type { EntityId, Timestamps } from './common'

export type AppLanguage = 'en' | 'fa'

export interface UserPreferences extends Timestamps {
  user_id: EntityId
  notification_limit: number
  app_sound_enabled: boolean
  language: AppLanguage
}

export interface UpdateUserPreferencesPayload {
  notification_limit?: number
  app_sound_enabled?: boolean
  language?: AppLanguage
}
