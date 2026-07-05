import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import UserProfilePage from './UserProfilePage'
import ListenerManagementPage from './ListenerManagementPage'
import { ROLES } from '../lib/constants/roles'
import { ROUTES } from '../lib/constants/routes'
import { storage } from '../lib/mock/storage'
import { useAuthStore } from '../store/authStore'

function renderUserProfilePage(path = '/profile/other_user') {
  return render(
    <ThemeProvider theme={createTheme()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={ROUTES.MANAGE} element={<ListenerManagementPage />} />
          <Route path="/profile/:username" element={<UserProfilePage />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
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
})
