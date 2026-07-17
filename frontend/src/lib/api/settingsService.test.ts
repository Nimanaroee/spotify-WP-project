import { beforeEach, describe, expect, it, vi } from 'vitest'

import client, { ACCESS_TOKEN_KEY } from './client'
import {
  getUserSubscriptionFromApi,
  getUserPreferencesFromApi,
  hasSettingsApiSession,
  updateUserSubscriptionFromApi,
  updateUserPreferencesFromApi,
} from './settingsService'

vi.mock('./client', () => ({
  ACCESS_TOKEN_KEY: 'auth_access_token',
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
  },
}))

const response = {
  theme: 'light' as const,
  notification_limit: 30,
  app_sound_enabled: false,
  language: 'fa' as const,
  system_voice: 'calm' as const,
  created_at: '2026-07-17T10:00:00.000Z',
  updated_at: '2026-07-17T11:00:00.000Z',
}

describe('settingsService', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(client.get).mockReset()
    vi.mocked(client.patch).mockReset()
    vi.mocked(client.put).mockReset()
  })

  it('detects an authenticated settings API session', () => {
    expect(hasSettingsApiSession()).toBe(false)

    localStorage.setItem(ACCESS_TOKEN_KEY, 'access-token')

    expect(hasSettingsApiSession()).toBe(true)
  })

  it('loads and maps current user preferences', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: response })

    const preferences = await getUserPreferencesFromApi(7)

    expect(client.get).toHaveBeenCalledWith('/users/preferences/')
    expect(preferences).toEqual({
      user_id: 7,
      ...response,
    })
  })

  it('partially updates current user preferences', async () => {
    vi.mocked(client.patch).mockResolvedValue({ data: response })

    const preferences = await updateUserPreferencesFromApi(7, {
      theme: 'light',
      notification_limit: 30,
    })

    expect(client.patch).toHaveBeenCalledWith('/users/preferences/', {
      theme: 'light',
      notification_limit: 30,
    })
    expect(preferences.theme).toBe('light')
    expect(preferences.notification_limit).toBe(30)
  })

  it('loads the current user subscription', async () => {
    vi.mocked(client.get).mockResolvedValue({
      data: { subscription_tier: 'silver' },
    })

    const subscriptionTier = await getUserSubscriptionFromApi()

    expect(client.get).toHaveBeenCalledWith('/users/subscription/')
    expect(subscriptionTier).toBe('silver')
  })

  it('updates the current user subscription with PUT', async () => {
    vi.mocked(client.put).mockResolvedValue({
      data: { subscription_tier: 'gold' },
    })

    const subscriptionTier = await updateUserSubscriptionFromApi({
      subscription_tier: 'gold',
    })

    expect(client.put).toHaveBeenCalledWith('/users/subscription/', {
      subscription_tier: 'gold',
    })
    expect(subscriptionTier).toBe('gold')
  })
})
