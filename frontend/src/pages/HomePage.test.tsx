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

function renderHomePage() {
  return render(
    <ThemeProvider theme={createTheme()}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
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

  it('shows listener profile management entry point', () => {
    renderHomePage()

    expect(
      screen.getByRole('button', { name: /manage listener profile/i }),
    ).toBeInTheDocument()
  })
})
