import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material'
import LoginPage from './LoginPage'
import HomePage from './HomePage'
import { ROLES } from '../lib/constants/roles'
import { ROUTES } from '../lib/constants/routes'
import { login, setCurrentUser } from '../lib/api/authService'
import { useAuthStore } from '../store/authStore'
import { ThemeModeContext } from '../theme/ThemeModeContext'

vi.mock('../lib/api/authService', () => ({
  getCurrentUser: vi.fn(() => null),
  login: vi.fn(),
  logout: vi.fn(),
  setCurrentUser: vi.fn(),
}))

function renderLoginPage() {
  return render(
    <ThemeModeContext.Provider value={{ mode: 'dark', toggleThemeMode: () => undefined }}>
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </ThemeModeContext.Provider>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ user: null })
    vi.mocked(login).mockReset()
    vi.mocked(setCurrentUser).mockReset()
  })

  it('shows validation messages for empty fields', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.click(screen.getByRole('button', { name: /log in/i }))

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
  })

  it('logs in with valid credentials', async () => {
    const user = userEvent.setup()
    vi.mocked(login).mockResolvedValue({
      redirectPath: ROUTES.HOME,
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
    renderLoginPage()

    await user.type(screen.getByLabelText(/email/i), 'listener@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    expect(
      await screen.findByRole('heading', { name: /most-listened songs/i }),
    ).toBeInTheDocument()
    expect(useAuthStore.getState().user?.email).toBe('listener@example.com')
  })

  it('logs in unapproved artists without blocking the session', async () => {
    const user = userEvent.setup()
    vi.mocked(login).mockResolvedValue({
      redirectPath: ROUTES.HOME,
      user: {
        id: 2,
        username: 'pending_artist',
        email: 'pending@example.com',
        display_name: 'Pending Artist',
        role: ROLES.ARTIST,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    })
    renderLoginPage()

    await user.type(screen.getByLabelText(/email/i), 'pending@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    expect(
      await screen.findByRole('heading', { name: /most-listened songs/i }),
    ).toBeInTheDocument()
    expect(useAuthStore.getState().user?.email).toBe('pending@example.com')
  })

  it('links to password recovery', () => {
    renderLoginPage()

    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute(
      'href',
      '/forgot-password',
    )
  })
})
