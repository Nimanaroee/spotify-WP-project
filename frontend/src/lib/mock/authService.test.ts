import { beforeEach, describe, expect, it } from 'vitest'
import { ROLES } from '../constants/roles'
import { storage } from './storage'
import {
  getCurrentUser,
  getRoleHomePath,
  login,
  logout,
  registerArtist,
  registerListener,
  requestPasswordRecovery,
} from './authService'
import type { User } from '../../types/user'
import type { ArtistVerificationRequest } from '../../types/artist'

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear()
    storage.set('users', [
      {
        id: 1,
        username: 'listener',
        email: 'listener@example.com',
        password: 'password123',
        display_name: 'Listener',
        role: ROLES.LISTENER,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        username: 'manager',
        email: 'manager@example.com',
        password: 'password123',
        display_name: 'Manager',
        role: ROLES.ADMIN,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 3,
        username: 'pending_artist',
        email: 'pending@example.com',
        password: 'password123',
        display_name: 'Pending Artist',
        role: ROLES.ARTIST,
        account_status: 'pending_approval',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ])
  })

  it('logs in a user and stores the current session id', () => {
    const result = login('listener@example.com', 'password123')

    expect(result.user.email).toBe('listener@example.com')
    expect(result.redirectPath).toBe('/')
    expect(storage.get<number>('auth_user_id')).toBe(1)
    expect(storage.get<User>('current_user')?.email).toBe('listener@example.com')
    expect(getCurrentUser()?.display_name).toBe('Listener')
  })

  it('rejects invalid credentials', () => {
    expect(() => login('listener@example.com', 'wrong-password')).toThrow(
      'Invalid email or password.',
    )
  })

  it('maps staff roles to the admin destination', () => {
    const manager = storage.get<User[]>('users')?.[1]

    expect(manager ? getRoleHomePath(manager) : '').toBe('/admin/tickets')
  })

  it('allows unverified artists to log in without a verified badge', () => {
    const result = login('pending@example.com', 'password123')

    expect(result.user.email).toBe('pending@example.com')
    expect(result.user.role).toBe(ROLES.ARTIST)
    expect(storage.get<number>('auth_user_id')).toBe(3)
  })

  it('registers a listener and starts a session', () => {
    const user = registerListener({
      display_name: 'New Listener',
      email: 'New.Listener@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      birth_date: '2000-01-01',
      gender: 'male',
      privacy_policy_accepted: true,
    })

    expect(user.role).toBe(ROLES.LISTENER)
    expect(user.email).toBe('new.listener@example.com')
    expect(storage.get<number>('auth_user_id')).toBe(user.id)
    expect(storage.get<User>('current_user')?.email).toBe('new.listener@example.com')
  })

  it('registers an artist, stores verification request, and starts a session', () => {
    const user = registerArtist({
      email: 'artist@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      stage_name: 'The Artist',
      portfolio_links: ['https://example.com/music'],
    })
    const requests =
      storage.get<ArtistVerificationRequest[]>('verification_requests') ?? []

    expect(user.role).toBe(ROLES.ARTIST)
    expect(user.email).toBe('artist@example.com')
    expect(requests).toHaveLength(1)
    expect(requests[0].verification_status).toBe('pending')
    expect(storage.get<number>('auth_user_id')).toBe(user.id)
    expect(storage.get<User>('current_user')?.email).toBe('artist@example.com')
  })

  it('records password recovery requests', () => {
    requestPasswordRecovery({ email: ' Listener@Example.com ' })

    expect(storage.get<Array<{ email: string }>>('password_recovery_requests')).toEqual([
      { email: 'listener@example.com' },
    ])
  })

  it('clears the current session on logout', () => {
    login('listener@example.com', 'password123')
    logout()

    expect(storage.get<number>('auth_user_id')).toBeNull()
    expect(storage.get<User>('current_user')).toBeNull()
  })
})
