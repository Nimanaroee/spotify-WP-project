import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { ROLES } from '../lib/constants/roles'
import RoleGuard, { hasRole } from './RoleGuard'
import { useAuthStore } from '../store/authStore'
import { useLayoutStore } from '../store/layoutStore'
import type { User } from '../types'

function TestChild() {
  return <div>Protected content</div>
}

const supportUser: User = {
  id: 3,
  username: 'support_agent',
  email: 'support@example.com',
  display_name: 'Support Agent',
  role: ROLES.SUPPORT,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const listenerUser: User = {
  id: 1,
  username: 'listener',
  email: 'listener@example.com',
  display_name: 'Listener',
  role: ROLES.LISTENER,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
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

describe('RoleGuard', () => {
  beforeEach(() => {
    useLayoutStore.setState({ sidebarOpen: false, isInitialized: false })
    setMatchMedia(false)
  })

  it('hasRole returns true when user role is allowed', () => {
    expect(hasRole(supportUser, [ROLES.SUPPORT, ROLES.ADMIN])).toBe(true)
    expect(hasRole(supportUser, [ROLES.ADMIN])).toBe(false)
    expect(hasRole(null, [ROLES.ADMIN])).toBe(false)
  })

  it('redirects unauthenticated users to login', () => {
    useAuthStore.setState({ user: null })

    render(
      <MemoryRouter initialEntries={['/admin/subscriptions']}>
        <Routes>
          <Route
            path="/admin/subscriptions"
            element={
              <RoleGuard allowedRoles={[ROLES.ADMIN]}>
                <TestChild />
              </RoleGuard>
            }
          />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders children when role is allowed', () => {
    useAuthStore.setState({ user: supportUser })

    render(
      <MemoryRouter initialEntries={['/admin/tickets']}>
        <Routes>
          <Route
            path="/admin/tickets"
            element={
              <RoleGuard allowedRoles={[ROLES.SUPPORT, ROLES.ADMIN]}>
                <TestChild />
              </RoleGuard>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('redirects support staff away from listener and artist management routes', () => {
    useAuthStore.setState({ user: supportUser })

    render(
      <MemoryRouter initialEntries={['/manage']}>
        <Routes>
          <Route
            path="/manage"
            element={
              <RoleGuard allowedRoles={[ROLES.LISTENER, ROLES.ARTIST]}>
                <TestChild />
              </RoleGuard>
            }
          />
          <Route path="/" element={<div>Home page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Home page')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('shows the shared sidebar on manage and profile routes for listeners', () => {
    useAuthStore.setState({ user: listenerUser })

    render(
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={['/manage']}>
          <Routes>
            <Route
              path="/manage"
              element={
                <RoleGuard allowedRoles={[ROLES.LISTENER, ROLES.ARTIST]}>
                  <MainLayout>
                    <div>Manage content</div>
                  </MainLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/profile/:username"
              element={
                <RoleGuard allowedRoles={[ROLES.LISTENER, ROLES.ARTIST, ROLES.SUPPORT, ROLES.ADMIN]}>
                  <MainLayout>
                    <div>Profile content</div>
                  </MainLayout>
                </RoleGuard>
              }
            />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    )

    expect(screen.getByText('Manage content')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
  })

  it('keeps the shared sidebar expandable on mobile routes', async () => {
    const user = userEvent.setup()
    useAuthStore.setState({ user: listenerUser })
    setMatchMedia(true)

    render(
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={['/profile/listener']}>
          <Routes>
            <Route
              path="/profile/:username"
              element={
                <RoleGuard allowedRoles={[ROLES.LISTENER, ROLES.ARTIST, ROLES.SUPPORT, ROLES.ADMIN]}>
                  <MainLayout>
                    <div>Profile content</div>
                  </MainLayout>
                </RoleGuard>
              }
            />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: /open sidebar/i }))

    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /close sidebar/i })).toBeInTheDocument()
  })
})
