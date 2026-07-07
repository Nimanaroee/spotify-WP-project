import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  approveRequest,
  getRequest,
  listPendingRequests,
  rejectRequest,
} from './verificationService'

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

const createNotification = vi.fn()
vi.mock('./notificationService', () => ({
  createNotification: (...args: unknown[]) => createNotification(...args),
}))

describe('verificationService', () => {
  beforeEach(() => {
    storageState.clear()
    createNotification.mockClear()
    const createdAt = new Date().toISOString()
    storageState.set('verification_requests', [
      {
        id: 1,
        user_id: 5,
        stage_name: 'Neon Waves',
        email: 'pending@example.com',
        portfolio_links: ['https://example.com/portfolio'],
        verification_status: 'pending',
        created_at: createdAt,
        updated_at: createdAt,
      },
    ])
    storageState.set('users', [
      {
        id: 5,
        username: 'pending_artist',
        email: 'pending@example.com',
        password: 'password123',
        display_name: 'Neon Waves',
        role: 'artist',
        account_status: 'pending_approval',
        created_at: createdAt,
        updated_at: createdAt,
      },
    ])
    storageState.set('artist_profiles', [])
  })

  it('lists only pending verification requests', () => {
    expect(listPendingRequests()).toHaveLength(1)
  })

  it('approves a request and notifies the artist', () => {
    const updated = approveRequest(1)
    expect(updated.verification_status).toBe('approved')
    expect(getRequest(1)?.verification_status).toBe('approved')
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_id: 5,
        category: 'account_approval',
      }),
    )
  })

  it('updates an existing pending artist profile when approving', () => {
    const createdAt = new Date().toISOString()
    storageState.set('artist_profiles', [
      {
        id: 1,
        user_id: 5,
        stage_name: 'Neon Waves',
        bio: '',
        portfolio_links: [],
        verification_status: 'pending',
        is_verified: false,
        created_at: createdAt,
        updated_at: createdAt,
      },
    ])

    approveRequest(1)

    const profiles = storageState.get('artist_profiles') as Array<{
      verification_status: string
      is_verified: boolean
    }>
    expect(profiles).toHaveLength(1)
    expect(profiles[0].verification_status).toBe('approved')
    expect(profiles[0].is_verified).toBe(true)
  })

  it('rejects a request with a reason', () => {
    const updated = rejectRequest(1, 'Portfolio quality is insufficient.')
    expect(updated.verification_status).toBe('rejected')
    expect(updated.rejection_reason).toBe('Portfolio quality is insufficient.')
  })

  it('requires a rejection reason', () => {
    expect(() => rejectRequest(1, '   ')).toThrow('A rejection reason is required.')
  })
})
