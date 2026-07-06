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
    expect(screen.getByText('240')).toBeInTheDocument()
    expect(screen.getByText('Total streams')).toBeInTheDocument()
    expect(screen.getByText('1200')).toBeInTheDocument()
  })
})
