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
import { getUserPreferencesFromApi } from '../lib/api/settingsService'
import { useAuthStore } from '../store/authStore'
import { LanguageContext } from '../theme/LanguageContext'
import { ThemeModeContext } from '../theme/ThemeModeContext'

vi.mock('../lib/api/authService', () => ({
  getCurrentUser: vi.fn(() => null),
  login: vi.fn(),
  logout: vi.fn(),
  setCurrentUser: vi.fn(),
}))

vi.mock('../lib/api/settingsService', () => ({
  getUserPreferencesFromApi: vi.fn(),
}))

function renderLoginPage({
  setLanguage = vi.fn(),
  setThemeMode = vi.fn(),
}: {
  setLanguage?: (language: 'en' | 'fa') => void
  setThemeMode?: (mode: 'light' | 'dark') => void
} = {}) {
  return render(
    <LanguageContext.Provider
      value={{
        language: 'en',
        setLanguage,
        toggleLanguage: () => undefined,
      }}
    >
      <ThemeModeContext.Provider
        value={{
          mode: 'dark',
          setThemeMode,
          toggleThemeMode: () => undefined,
        }}
      >
        <ThemeProvider theme={createTheme()}>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      </ThemeModeContext.Provider>
    </LanguageContext.Provider>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ user: null })
    vi.mocked(login).mockReset()
    vi.mocked(setCurrentUser).mockReset()
    vi.mocked(getUserPreferencesFromApi).mockReset()
    vi.mocked(getUserPreferencesFromApi).mockResolvedValue({
      user_id: 1,
      theme: 'dark',
      notification_limit: 20,
      app_sound_enabled: true,
      language: 'en',
      system_voice: 'default',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    })
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

  it('loads and applies the user preferences before navigating', async () => {
    const user = userEvent.setup()
    const setLanguage = vi.fn()
    const setThemeMode = vi.fn()
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
    vi.mocked(getUserPreferencesFromApi).mockResolvedValue({
      user_id: 1,
      theme: 'light',
      notification_limit: 30,
      app_sound_enabled: false,
      language: 'fa',
      system_voice: 'calm',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
    })
    renderLoginPage({ setLanguage, setThemeMode })

    await user.type(screen.getByLabelText(/email/i), 'listener@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    expect(getUserPreferencesFromApi).toHaveBeenCalledWith(1)
    expect(setLanguage).toHaveBeenCalledWith('fa')
    expect(setThemeMode).toHaveBeenCalledWith('light')
    expect(
      await screen.findByRole('heading', { name: /most-listened songs/i }),
    ).toBeInTheDocument()
  })

  it('continues login when preferences cannot be loaded', async () => {
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
    vi.mocked(getUserPreferencesFromApi).mockRejectedValue(
      new Error('Unable to load preferences.'),
    )
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
