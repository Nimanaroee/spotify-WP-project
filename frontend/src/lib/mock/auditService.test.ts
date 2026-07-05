import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ROLES } from '../constants/roles'
import { confirmSettlement, listMonthlyAudits } from './auditService'

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

vi.mock('./notificationService', () => ({
  createNotification: vi.fn(),
}))

describe('auditService', () => {
  beforeEach(() => {
    storageState.clear()
    const now = new Date()
    storageState.set('artist_audits', [
      {
        id: 1,
        artist_id: 2,
        artist_name: 'Demo Artist',
        period_year: now.getFullYear(),
        period_month: now.getMonth() + 1,
        unique_listeners_count: 100,
        total_streams_count: 500,
        payout_amount: 25,
        payment_status: 'pending',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
    ])
  })

  it('lists audits for the selected period', () => {
    const now = new Date()
    const audits = listMonthlyAudits(now.getFullYear(), now.getMonth() + 1)
    expect(audits).toHaveLength(1)
    expect(audits[0].artist_name).toBe('Demo Artist')
  })

  it('confirms settlement for admin role', () => {
    const updated = confirmSettlement(1, ROLES.ADMIN)
    expect(updated.payment_status).toBe('settled')
  })

  it('rejects settlement for support role', () => {
    expect(() => confirmSettlement(1, ROLES.SUPPORT)).toThrow(
      'Only system admins can confirm settlement.',
    )
  })
})
