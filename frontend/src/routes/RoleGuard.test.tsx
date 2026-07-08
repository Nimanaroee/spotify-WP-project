import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ROLES } from '../lib/constants/roles'
import RoleGuard, { hasRole } from './RoleGuard'
import { useAuthStore } from '../store/authStore'
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

describe('RoleGuard', () => {
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
})
