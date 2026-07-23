import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import {
  followUsername,
  getPublicProfileFromApi,
  unfollowUsername,
} from '../lib/api/profileService'
import { ROLES } from '../lib/constants/roles'
import { useAuthStore } from '../store/authStore'
import UserProfilePage from './UserProfilePage'

vi.mock('../lib/api/profileService', () => ({
  followUsername: vi.fn(),
  getPublicProfileFromApi: vi.fn(),
  unfollowUsername: vi.fn(),
}))

describe('UserProfilePage API integration', () => {
  beforeEach(() => {
    vi.mocked(getPublicProfileFromApi).mockReset()
    vi.mocked(followUsername).mockReset()
    vi.mocked(unfollowUsername).mockReset()
    useAuthStore.setState({
      user: {
        id: 1,
        username: 'viewer',
        email: 'viewer@example.com',
        display_name: 'Viewer',
        role: ROLES.LISTENER,
        subscription_tier: 'basic',
        created_at: '2026-01-01T00:00:00.000Z',
      },
    })
  })

  it('loads the username route from the public profile API', async () => {
    vi.mocked(getPublicProfileFromApi).mockResolvedValue({
      user: {
        id: 2,
        username: 'other_user',
        email: '',
        display_name: 'Other User',
        role: ROLES.LISTENER,
        birth_date: '2000-01-02',
        gender: 'female',
        subscription_tier: 'silver',
        followers_count: 1,
        following_count: 0,
        daily_streams_count: 9,
        created_at: '',
      },
      daily_streams_count: 9,
      is_following: false,
      followers: [],
      following: [],
    })

    render(
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={['/profile/other_user']}>
          <Routes>
            <Route path="/profile/:username" element={<UserProfilePage />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    )

    expect(
      await screen.findByRole('heading', { name: 'Other User' }),
    ).toBeInTheDocument()
    expect(getPublicProfileFromApi).toHaveBeenCalledWith('other_user')
    expect(screen.getByText('9')).toBeInTheDocument()
  })

  it('follows and refreshes followers from the public profile API', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()
    const initialProfile = {
      user: {
        id: 2,
        username: 'other_user',
        email: '',
        display_name: 'Other User',
        role: ROLES.LISTENER,
        followers_count: 0,
        following_count: 0,
        created_at: '',
      },
      daily_streams_count: 0,
      is_following: false,
      followers: [],
      following: [],
    }
    const refreshedProfile = {
      ...initialProfile,
      user: { ...initialProfile.user, followers_count: 1 },
      is_following: true,
      followers: [
        {
          id: 1,
          display_name: 'Viewer',
          username: 'viewer',
          profile_picture: null,
          role: ROLES.LISTENER,
        },
      ],
    }
    vi.mocked(getPublicProfileFromApi)
      .mockResolvedValueOnce(initialProfile)
      .mockResolvedValueOnce(refreshedProfile)
    vi.mocked(followUsername).mockResolvedValue({
      user: refreshedProfile.user,
      is_following: true,
    })

    render(
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={['/profile/other_user']}>
          <Routes>
            <Route path="/profile/:username" element={<UserProfilePage />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    )

    await user.click(await screen.findByRole('button', { name: /^follow$/i }))

    expect(followUsername).toHaveBeenCalledWith('other_user')
    expect(getPublicProfileFromApi).toHaveBeenCalledTimes(2)
    expect(
      await screen.findByRole('button', { name: /unfollow/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Viewer')).toBeInTheDocument()
  })

  it('unfollows and refreshes followers from the public profile API', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()
    const initialProfile = {
      user: {
        id: 2,
        username: 'other_user',
        email: '',
        display_name: 'Other User',
        role: ROLES.LISTENER,
        followers_count: 1,
        following_count: 0,
        created_at: '',
      },
      daily_streams_count: 0,
      is_following: true,
      followers: [
        {
          id: 1,
          display_name: 'Viewer',
          username: 'viewer',
          profile_picture: null,
          role: ROLES.LISTENER,
        },
      ],
      following: [],
    }
    const refreshedProfile = {
      ...initialProfile,
      user: { ...initialProfile.user, followers_count: 0 },
      is_following: false,
      followers: [],
    }
    vi.mocked(getPublicProfileFromApi)
      .mockResolvedValueOnce(initialProfile)
      .mockResolvedValueOnce(refreshedProfile)
    vi.mocked(unfollowUsername).mockResolvedValue({
      user: refreshedProfile.user,
      is_following: false,
    })

    render(
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={['/profile/other_user']}>
          <Routes>
            <Route path="/profile/:username" element={<UserProfilePage />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    )

    await user.click(await screen.findByRole('button', { name: /unfollow/i }))

    expect(unfollowUsername).toHaveBeenCalledWith('other_user')
    expect(getPublicProfileFromApi).toHaveBeenCalledTimes(2)
    expect(
      await screen.findByRole('button', { name: /^follow$/i }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Viewer')).not.toBeInTheDocument()
  })
})
