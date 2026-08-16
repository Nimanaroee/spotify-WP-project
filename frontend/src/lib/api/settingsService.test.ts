import { beforeEach, describe, expect, it, vi } from 'vitest'

import client from './client'
import {
  createSubscriptionPaymentFromApi,
  deleteAccountFromApi,
  getSubscriptionFeesFromApi,
  getUserSubscriptionFromApi,
  getUserPreferencesFromApi,
  updateUserSubscriptionFromApi,
  updateUserPreferencesFromApi,
} from './settingsService'

vi.mock('./client', () => ({
  ACCESS_TOKEN_KEY: 'auth_access_token',
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
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
    vi.mocked(client.post).mockReset()
    vi.mocked(client.put).mockReset()
    vi.mocked(client.delete).mockReset()
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
      data: { subscription_tier: 'silver', expires_at: null },
    })

    const subscription = await getUserSubscriptionFromApi()

    expect(client.get).toHaveBeenCalledWith('/users/subscription/')
    expect(subscription).toEqual({
      subscription_tier: 'silver',
      expires_at: null,
    })
  })

  it('updates the current user subscription with PUT', async () => {
    vi.mocked(client.put).mockResolvedValue({
      data: { subscription_tier: 'gold', expires_at: null },
    })

    const subscription = await updateUserSubscriptionFromApi({
      subscription_tier: 'gold',
      duration_months: 3,
      payment_log_id: 42,
    })

    expect(client.put).toHaveBeenCalledWith('/users/subscription/', {
      subscription_tier: 'gold',
      duration_months: 3,
      payment_log_id: 42,
    })
    expect(subscription).toEqual({
      subscription_tier: 'gold',
      expires_at: null,
    })
  })

  it('loads monthly fees and starts a payment', async () => {
    vi.mocked(client.get).mockResolvedValue({
      data: {
        results: [
          { subscription_tier: 'basic', price_per_month: 0 },
          { subscription_tier: 'silver', price_per_month: 9.99 },
          { subscription_tier: 'gold', price_per_month: 19.99 },
        ],
      },
    })
    vi.mocked(client.post).mockResolvedValue({
      data: {
        id: 42,
        redirect_url: 'https://payment.zarinpal.com/pg/StartPay/A-test-authority',
      },
    })

    const fees = await getSubscriptionFeesFromApi()
    const paymentLog = await createSubscriptionPaymentFromApi({
      duration_months: 3,
      account_type: 'gold',
    })

    expect(client.get).toHaveBeenCalledWith('/subscription/')
    expect(fees).toHaveLength(3)
    expect(client.post).toHaveBeenCalledWith('/payment/', {
      duration_months: 3,
      account_type: 'gold',
    })
    expect(paymentLog.id).toBe(42)
    expect(paymentLog.redirect_url).toContain('payment.zarinpal.com')
  })

  it('deletes the authenticated account', async () => {
    vi.mocked(client.delete).mockResolvedValue({ data: undefined })

    await deleteAccountFromApi()

    expect(client.delete).toHaveBeenCalledWith('/users/account/')
  })
})
