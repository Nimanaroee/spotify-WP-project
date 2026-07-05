import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPricing, updatePricing } from './subscriptionAdminService'

const storageState = new Map<string, unknown>()

vi.mock('./storage', () => ({
  storage: {
    get: vi.fn((key: string) => storageState.get(key) ?? null),
    set: vi.fn((key: string, value: unknown) => {
      storageState.set(key, value)
    }),
    remove: vi.fn((key: string) => {
      storageState.delete(key)
    }),
  },
}))

describe('subscriptionAdminService', () => {
  beforeEach(() => {
    storageState.clear()
  })

  it('returns default pricing when storage is empty', () => {
    const pricing = getPricing()
    expect(pricing.silver_price).toBe(9.99)
    expect(pricing.gold_price).toBe(19.99)
  })

  it('persists updated subscription prices', () => {
    const updated = updatePricing({ silver_price: 12.5, gold_price: 24.99 })
    expect(updated.silver_price).toBe(12.5)
    expect(updated.gold_price).toBe(24.99)
    expect(getPricing().gold_price).toBe(24.99)
  })

  it('rejects non-positive prices', () => {
    expect(() => updatePricing({ silver_price: 0, gold_price: 10 })).toThrow(
      'Prices must be greater than zero.',
    )
  })
})
