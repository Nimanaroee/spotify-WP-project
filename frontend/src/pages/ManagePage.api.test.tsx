import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import {
  getManageProfileFromApi,
  hasProfileApiSession,
  unfollowUsername,
  updateManageProfileFromApi,
} from '../lib/api/profileService'
import { ROLES } from '../lib/constants/roles'
import { ROUTES } from '../lib/constants/routes'
import { useAuthStore } from '../store/authStore'
import ManagePage from './ManagePage'

vi.mock('../lib/api/profileService', () => ({
  getManageProfileFromApi: vi.fn(),
  hasProfileApiSession: vi.fn(),
  unfollowUsername: vi.fn(),
  updateManageProfileFromApi: vi.fn(),
}))

const authUser = {
  id: 1,
  username: 'listener',
  email: 'listener@example.com',
  display_name: 'Listener',
  role: ROLES.LISTENER,
  subscription_tier: 'basic' as const,
  created_at: '2026-01-01T00:00:00.000Z',
}

const profile = {
  user: {
    ...authUser,
    followers_count: 0,
    following_count: 0,
    daily_streams_count: 0,
  },
  daily_streams_count: 0,
  followers: [],
  following: [],
}

describe('ManagePage API integration', () => {
  beforeEach(() => {
    vi.mocked(hasProfileApiSession).mockReturnValue(true)
    vi.mocked(getManageProfileFromApi).mockReset()
    vi.mocked(updateManageProfileFromApi).mockReset()
    vi.mocked(unfollowUsername).mockReset()
    vi.mocked(getManageProfileFromApi).mockResolvedValue(profile)
    vi.mocked(updateManageProfileFromApi).mockResolvedValue({
      ...profile,
      user: {
        ...profile.user,
        profile_picture: 'http://localhost:8000/media/profile-pictures/avatar.png',
      },
    })
    useAuthStore.setState({ user: authUser })
    window.matchMedia = vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: true,
      media: '(max-width:767px)',
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })
  })

  it('uploads the selected profile photo when saving and exiting edit mode', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={[ROUTES.MANAGE]}>
          <Routes>
            <Route path={ROUTES.MANAGE} element={<ManagePage />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    )

    await screen.findByRole('heading', { name: 'Listener' })
    await user.click(screen.getByRole('button', { name: /edit/i }))

    const photo = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText(/profile photo upload/i), photo)

    expect(updateManageProfileFromApi).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(updateManageProfileFromApi).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'listener' }),
      expect.objectContaining({ display_name: 'Listener' }),
      photo,
    )
    expect(
      screen.queryByRole('button', { name: /save changes/i }),
    ).not.toBeInTheDocument()
  })

  it('unfollows from the following box and refreshes the manage profile', async () => {
    const user = userEvent.setup()
    const profileWithFollowing = {
      ...profile,
      user: { ...profile.user, following_count: 1 },
      following: [
        {
          id: 2,
          display_name: 'Following User',
          username: 'following_user',
          profile_picture: null,
          role: ROLES.LISTENER,
        },
      ],
    }
    vi.mocked(getManageProfileFromApi)
      .mockResolvedValueOnce(profileWithFollowing)
      .mockResolvedValueOnce(profile)
    vi.mocked(unfollowUsername).mockResolvedValue({
      user: profileWithFollowing.following[0],
      is_following: false,
    })

    render(
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={[ROUTES.MANAGE]}>
          <Routes>
            <Route path={ROUTES.MANAGE} element={<ManagePage />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    )

    await screen.findByRole('heading', { name: 'Listener' })
    await user.click(screen.getByRole('tab', { name: /following \(1\)/i }))
    await user.click(
      screen.getByRole('button', { name: /unfollow following user/i }),
    )

    expect(unfollowUsername).toHaveBeenCalledWith('following_user')
    expect(getManageProfileFromApi).toHaveBeenCalledTimes(2)
    expect(
      await screen.findByRole('tab', { name: /following \(0\)/i }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Following User')).not.toBeInTheDocument()
  })
})
