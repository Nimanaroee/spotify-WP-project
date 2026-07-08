import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import UserProfilePage from './UserProfilePage'
import ManagePage from './ManagePage'
import { ROLES } from '../lib/constants/roles'
import { ROUTES } from '../lib/constants/routes'
import { storage } from '../lib/mock/storage'
import { useAuthStore } from '../store/authStore'
import { usePlayerStore } from '../store/playerStore'
import { ThemeModeContext } from '../theme/ThemeModeContext'

function TestProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeModeContext.Provider value={{ mode: 'dark', toggleThemeMode: () => undefined }}>
      <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
    </ThemeModeContext.Provider>
  )
}

function renderUserProfilePage(path = '/profile/other_user') {
  return render(
    <TestProviders>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={ROUTES.MANAGE} element={<ManagePage />} />
          <Route path="/profile/:username" element={<UserProfilePage />} />
          <Route path="/albums/:albumId" element={<div>Album detail page</div>} />
        </Routes>
      </MemoryRouter>
    </TestProviders>,
  )
}

function setMatchMedia(matches: boolean): void {
  window.matchMedia = ((query: string) =>
    ({
      addEventListener: () => undefined,
      addListener: () => undefined,
      dispatchEvent: () => false,
      matches,
      media: query,
      onchange: null,
      removeEventListener: () => undefined,
      removeListener: () => undefined,
    }) as MediaQueryList) as typeof window.matchMedia
}

describe('UserProfilePage', () => {
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
        username: 'other_user',
        email: 'other@example.com',
        password: 'password123',
        display_name: 'Other User',
        role: ROLES.LISTENER,
        subscription_tier: 'silver',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 3,
        username: 'demo_artist',
        email: 'artist@example.com',
        password: 'password123',
        display_name: 'Demo Artist',
        role: ROLES.ARTIST,
        subscription_tier: 'basic',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ])
    storage.set('artist_profiles', [
      {
        id: 1,
        user_id: 3,
        stage_name: 'Neon Artist',
        bio: 'Synth pop from Tehran.',
        verification_status: 'approved',
        is_verified: true,
        listener_count: 240,
        total_streams: 1200,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ])
    storage.set('albums', [
      {
        id: 1,
        title: 'City Lights',
        artist_id: 3,
        artist_name: 'Neon Artist',
        release_type: 'album',
        release_year: 2026,
        track_count: 2,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ])
    storage.set('tracks', [
      {
        id: 1,
        title: 'Night Drive',
        artist_id: 3,
        artist_name: 'Neon Artist',
        release_type: 'single',
        duration_seconds: 180,
        listener_count: 100,
        stream_count: 500,
        created_at: '2026-01-02T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
      },
    ])
    storage.set('follows', [])
    storage.set('daily_streams', { 2: 9 })
    useAuthStore.setState({
      user: {
        id: 1,
        username: 'listener',
        email: 'listener@example.com',
        display_name: 'Listener',
        role: ROLES.LISTENER,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    })
    usePlayerStore.setState({
      currentTrack: null,
      queue: [],
      isPlaying: false,
      progressSeconds: 0,
    })
    setMatchMedia(false)
  })

  it('shows read-only profile details for another user', () => {
    renderUserProfilePage()

    expect(screen.getByRole('heading', { name: 'Other User' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /follow/i })).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
  })

  it('toggles follow state for another user', async () => {
    const user = userEvent.setup()
    renderUserProfilePage()

    await user.click(screen.getByRole('button', { name: /follow/i }))

    expect(screen.getByRole('button', { name: /unfollow/i })).toBeInTheDocument()
  })

  it('shows the current listener in an artist followers list after following', async () => {
    const user = userEvent.setup()
    renderUserProfilePage('/profile/demo_artist')

    await user.click(screen.getByRole('button', { name: /follow/i }))

    expect(screen.getByRole('button', { name: /unfollow/i })).toBeInTheDocument()
    expect(screen.getByText('Listener')).toBeInTheDocument()
  })

  it('shows artist followers and following lists before release sections', () => {
    storage.set('follows', [
      {
        id: 1,
        follower_id: 1,
        followed_id: 3,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        follower_id: 3,
        followed_id: 2,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ])

    renderUserProfilePage('/profile/demo_artist')

    expect(screen.getByRole('heading', { name: 'Followers (1)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Following (1)' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /listener/i })).toHaveAttribute('href', '/manage')
    expect(screen.getByRole('link', { name: /other user/i })).toHaveAttribute('href', '/profile/other_user')
    expect(
      screen
        .getByRole('heading', { name: 'Followers (1)' })
        .compareDocumentPosition(screen.getByRole('heading', { name: 'Albums' })),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('links profile follower and following rows to their profile pages or own management page', () => {
    storage.set('follows', [
      {
        id: 1,
        follower_id: 1,
        followed_id: 2,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        follower_id: 2,
        followed_id: 3,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ])

    renderUserProfilePage('/profile/other_user')

    expect(screen.getByRole('link', { name: /listener/i })).toHaveAttribute('href', '/manage')
    expect(screen.getByRole('link', { name: /demo artist/i })).toHaveAttribute('href', '/profile/demo_artist')
  })

  it('redirects the current user to their management page', async () => {
    renderUserProfilePage('/profile/listener')

    expect(await screen.findByRole('heading', { name: /listener/i })).toBeInTheDocument()
  })

  it('renders fixed-height scrollable follower and following panels', () => {
    renderUserProfilePage()

    expect(screen.getAllByRole('list')[0]).toHaveStyle({ height: '320px' })
  })

  it('keeps follower and following panels compact on mobile', () => {
    setMatchMedia(true)
    window.innerWidth = 375
    window.innerHeight = 812
    window.dispatchEvent(new Event('resize'))

    renderUserProfilePage()

    expect(screen.getAllByRole('list')[0]).toHaveStyle({ height: '260px' })
  })

  it('shows musician profile content and hides analytics for non-Gold viewers', () => {
    renderUserProfilePage('/profile/demo_artist')

    expect(screen.getByRole('heading', { name: 'Neon Artist' })).toBeInTheDocument()
    expect(screen.getByText('Verified Artist')).toBeInTheDocument()
    expect(screen.getByText('Synth pop from Tehran.')).toBeInTheDocument()
    expect(screen.getByText('City Lights')).toBeInTheDocument()
    expect(screen.getByText('Night Drive')).toBeInTheDocument()
    expect(
      screen.getByText('Upgrade to Gold to view premium artist analytics.'),
    ).toBeInTheDocument()
  })

  it('renders artist albums and singles in fixed scroll boxes newest first', () => {
    storage.set('albums', [
      {
        id: 1,
        title: 'City Lights',
        artist_id: 3,
        artist_name: 'Neon Artist',
        release_type: 'album',
        release_year: 2025,
        track_count: 2,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        title: 'Future City',
        artist_id: 3,
        artist_name: 'Neon Artist',
        release_type: 'album',
        release_year: 2026,
        track_count: 3,
        created_at: '2026-02-01T00:00:00.000Z',
        updated_at: '2026-02-01T00:00:00.000Z',
      },
    ])
    storage.set('tracks', [
      {
        id: 1,
        title: 'Night Drive',
        artist_id: 3,
        artist_name: 'Neon Artist',
        release_type: 'single',
        duration_seconds: 180,
        created_at: '2026-01-02T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 2,
        title: 'Morning Drive',
        artist_id: 3,
        artist_name: 'Neon Artist',
        release_type: 'single',
        duration_seconds: 180,
        created_at: '2026-03-02T00:00:00.000Z',
        updated_at: '2026-03-02T00:00:00.000Z',
      },
    ])

    renderUserProfilePage('/profile/demo_artist')

    expect(screen.getByLabelText('Albums')).toHaveStyle({ height: '260px', overflowY: 'auto' })
    expect(screen.getByLabelText('Singles')).toHaveStyle({ height: '260px', overflowY: 'auto' })
    expect(screen.getByText('Future City').compareDocumentPosition(screen.getByText('City Lights'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(screen.getByText('Morning Drive').compareDocumentPosition(screen.getByText('Night Drive'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('opens artist albums and plays artist songs from the profile page', async () => {
    const user = userEvent.setup()
    renderUserProfilePage('/profile/demo_artist')

    await user.click(screen.getByRole('button', { name: /city lights/i }))
    expect(screen.getByText('Album detail page')).toBeInTheDocument()

    renderUserProfilePage('/profile/demo_artist')
    await user.click(screen.getByRole('button', { name: /night drive/i }))

    expect(usePlayerStore.getState().currentTrack?.title).toBe('Night Drive')
    expect(usePlayerStore.getState().isPlaying).toBe(true)
  })

  it('counts listener streams and artist streams when music starts', async () => {
    const user = userEvent.setup()
    renderUserProfilePage('/profile/demo_artist')

    await user.click(screen.getByRole('button', { name: /night drive/i }))

    expect(storage.get<Record<number, number>>('daily_streams')).toEqual({ 1: 1, 2: 9 })
    expect(storage.get<Record<number, number[]>>('artist_listeners')).toEqual({ 3: [1] })
    expect(
      storage.get<Array<{ id: number; stream_count?: number; listener_count?: number }>>('tracks')?.[0],
    ).toEqual(expect.objectContaining({ stream_count: 501, listener_count: 1 }))
  })

  it('updates visible artist stream stats immediately after playing from profile', async () => {
    const user = userEvent.setup()
    storage.set('daily_streams', { 2: 9 })
    useAuthStore.setState({
      user: {
        id: 1,
        username: 'listener',
        email: 'listener@example.com',
        display_name: 'Listener',
        role: ROLES.LISTENER,
        subscription_tier: 'gold',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    })
    renderUserProfilePage('/profile/demo_artist')

    await user.click(screen.getByRole('button', { name: /night drive/i }))

    expect(screen.getByText('Total listeners')).toBeInTheDocument()
    expect(screen.getByText('Total streams')).toBeInTheDocument()
    expect(screen.getByText('501')).toBeInTheDocument()
    expect(storage.get<Record<number, number>>('daily_streams')).toEqual({ 1: 1, 2: 9 })
  })

  it('shows premium musician analytics for Gold viewers', () => {
    useAuthStore.setState({
      user: {
        id: 1,
        username: 'listener',
        email: 'listener@example.com',
        display_name: 'Listener',
        role: ROLES.LISTENER,
        subscription_tier: 'gold',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    })

    renderUserProfilePage('/profile/demo_artist')

    expect(screen.getByText('Total listeners')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('Total streams')).toBeInTheDocument()
    expect(screen.getByText('500')).toBeInTheDocument()
  })
})
