import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import {
  getManageArtistProfileFromApi,
  getManageProfileFromApi,
  unfollowUsername,
  updateManageArtistProfileFromApi,
  updateManageProfileFromApi,
} from '../lib/api/profileService'
import { ROLES } from '../lib/constants/roles'
import { ROUTES } from '../lib/constants/routes'
import { useAuthStore } from '../store/authStore'
import ManagePage from './ManagePage'

vi.mock('../lib/api/profileService', () => ({
  getManageArtistProfileFromApi: vi.fn(),
  getManageProfileFromApi: vi.fn(),
  unfollowUsername: vi.fn(),
  updateManageArtistProfileFromApi: vi.fn(),
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

const artistUser = {
  id: 2,
  username: 'artist',
  email: 'artist@example.com',
  display_name: 'Artist',
  role: ROLES.ARTIST,
  subscription_tier: 'basic' as const,
  created_at: '2026-01-01T00:00:00.000Z',
}

const artistProfile = {
  user: {
    ...artistUser,
    followers_count: 0,
    following_count: 0,
    daily_streams_count: 0,
    profile_picture: null,
  },
  daily_streams_count: 0,
  is_following: false,
  followers: [],
  following: [],
  artist_profile: {
    id: 2,
    user_id: 2,
    stage_name: 'Artist',
    bio: 'Artist biography.',
    verification_status: 'approved' as const,
    is_verified: true,
    listener_count: 12,
    total_streams: 40,
    created_at: '',
  },
  albums: [],
  singles: [],
  listener_count: 12,
  total_streams: 40,
}

describe('ManagePage API integration', () => {
  beforeEach(() => {
    vi.mocked(getManageProfileFromApi).mockReset()
    vi.mocked(getManageArtistProfileFromApi).mockReset()
    vi.mocked(updateManageProfileFromApi).mockReset()
    vi.mocked(updateManageArtistProfileFromApi).mockReset()
    vi.mocked(unfollowUsername).mockReset()
    vi.mocked(getManageProfileFromApi).mockResolvedValue(profile)
    vi.mocked(getManageArtistProfileFromApi).mockResolvedValue(artistProfile)
    vi.mocked(updateManageProfileFromApi).mockResolvedValue({
      ...profile,
      user: {
        ...profile.user,
        profile_picture: 'http://localhost:8000/media/profile-pictures/avatar.png',
      },
    })
    vi.mocked(updateManageArtistProfileFromApi).mockResolvedValue({
      ...artistProfile,
      user: {
        ...artistProfile.user,
        profile_picture:
          'http://localhost:8000/media/profile-pictures/artist-avatar.png',
      },
      artist_profile: {
        ...artistProfile.artist_profile,
        stage_name: 'Updated Artist',
        bio: 'Updated biography.',
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
    const silverProfile = {
      ...profile,
      user: { ...profile.user, subscription_tier: 'silver' as const },
    }
    vi.mocked(getManageProfileFromApi).mockResolvedValue(silverProfile)
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

  it('shows an upgrade hint instead of the photo button for basic accounts in edit mode', async () => {
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

    expect(
      screen.queryByLabelText(/profile photo upload/i),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(/upgrade your subscription to change your profile photo/i),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(updateManageProfileFromApi).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'listener' }),
      expect.objectContaining({ display_name: 'Listener' }),
      null,
    )
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

  it('loads and updates the artist manage profile through the artist endpoint', async () => {
    const user = userEvent.setup()
    useAuthStore.setState({ user: artistUser })

    render(
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={[ROUTES.MANAGE]}>
          <Routes>
            <Route path={ROUTES.MANAGE} element={<ManagePage />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    )

    expect(
      await screen.findByRole('heading', { name: 'Artist' }),
    ).toBeInTheDocument()
    expect(getManageArtistProfileFromApi).toHaveBeenCalled()

    await user.clear(screen.getByLabelText(/artistic name/i))
    await user.type(screen.getByLabelText(/artistic name/i), 'Updated Artist')
    await user.clear(screen.getByLabelText(/biography/i))
    await user.type(screen.getByLabelText(/biography/i), 'Updated biography.')
    const photo = new File(['avatar'], 'artist-avatar.png', {
      type: 'image/png',
    })
    await user.upload(screen.getByLabelText(/profile photo upload/i), photo)
    await user.click(screen.getByRole('button', { name: /save artist profile/i }))

    expect(updateManageArtistProfileFromApi).toHaveBeenCalledWith(
      'Updated Artist',
      'Updated biography.',
      photo,
    )
    expect(useAuthStore.getState().user?.display_name).toBe('Updated Artist')
  })

  it('saves artist text changes without sending a profile photo', async () => {
    const user = userEvent.setup()
    useAuthStore.setState({ user: artistUser })

    render(
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={[ROUTES.MANAGE]}>
          <Routes>
            <Route path={ROUTES.MANAGE} element={<ManagePage />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    )

    await screen.findByRole('heading', { name: 'Artist' })
    await user.clear(screen.getByLabelText(/artistic name/i))
    await user.type(screen.getByLabelText(/artistic name/i), 'Updated Artist')
    await user.click(screen.getByRole('button', { name: /save artist profile/i }))

    expect(updateManageArtistProfileFromApi).toHaveBeenCalledWith(
      'Updated Artist',
      'Artist biography.',
      null,
    )
  })
})
