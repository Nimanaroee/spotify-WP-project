import { beforeEach, describe, expect, it, vi } from 'vitest'

import { storage } from '../mock/storage'
import client, {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from './client'
import { logout } from './authService'

vi.mock('./client', () => ({
  ACCESS_TOKEN_KEY: 'auth_access_token',
  REFRESH_TOKEN_KEY: 'auth_refresh_token',
  default: {
    post: vi.fn(),
  },
}))

describe('authService logout', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(client.post).mockReset()
    localStorage.setItem(ACCESS_TOKEN_KEY, 'access-token')
    localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-token')
    storage.set('current_user', {
      id: 1,
      username: 'listener',
      email: 'listener@example.com',
      display_name: 'Listener',
      role: 'listener',
      created_at: '2026-01-01T00:00:00.000Z',
    })
  })

  it('posts the refresh token and clears the local session', async () => {
    vi.mocked(client.post).mockResolvedValue({ status: 204 })

    await logout()

    expect(client.post).toHaveBeenCalledWith('/auth/logout/', {
      refresh: 'refresh-token',
    })
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull()
    expect(storage.get('current_user')).toBeNull()
  })

  it('still clears the local session when the logout API fails', async () => {
    vi.mocked(client.post).mockRejectedValue(new Error('Network unavailable'))

    await expect(logout()).resolves.toBeUndefined()

    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull()
    expect(storage.get('current_user')).toBeNull()
  })

  it('skips the API call when no refresh token exists', async () => {
    localStorage.removeItem(REFRESH_TOKEN_KEY)

    await logout()

    expect(client.post).not.toHaveBeenCalled()
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull()
  })
})
