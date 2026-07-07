import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import HomePage from './HomePage'
import LoginPage from './LoginPage'
import { ROLES } from '../lib/constants/roles'
import { storage } from '../lib/mock/storage'
import { useAuthStore } from '../store/authStore'
import { ThemeModeContext } from '../theme/ThemeModeContext'

function renderHomePage() {
  return render(
    <ThemeModeContext.Provider value={{ mode: 'dark', toggleThemeMode: () => undefined }}>
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </ThemeModeContext.Provider>,
  )
}

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear()
    storage.set('auth_user_id', 1)
    useAuthStore.setState({
      user: {
        id: 1,
        username: 'listener',
        email: 'listener@example.com',
        display_name: 'Listener',
        role: ROLES.LISTENER,
        subscription_tier: 'basic',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    })
  })

  it('logs out and returns to login', async () => {
    const user = userEvent.setup()
    renderHomePage()

    await user.click(screen.getByRole('button', { name: /logout/i }))

    expect(storage.get<number>('auth_user_id')).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
    expect(await screen.findByRole('heading', { name: /welcome/i })).toBeInTheDocument()
  })

  it('shows listener settings in sidebar', () => {
    renderHomePage()

    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /artist studio/i })).not.toBeInTheDocument()
  })

  it('shows artist studio entry points for musicians', () => {
    useAuthStore.setState({
      user: {
        id: 2,
        username: 'artist',
        email: 'artist@example.com',
        display_name: 'Artist',
        role: ROLES.ARTIST,
        subscription_tier: 'basic',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    })

    renderHomePage()

    expect(screen.getAllByRole('link', { name: /artist studio/i }).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: /artist studio/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
  })
})
