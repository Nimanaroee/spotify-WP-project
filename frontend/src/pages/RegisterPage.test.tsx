import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material'
import RegisterPage from './RegisterPage'
import { registerArtist, registerListener, setCurrentUser } from '../lib/api/authService'
import { useAuthStore } from '../store/authStore'
import type { User } from '../types/user'

vi.mock('../lib/api/authService', () => ({
  getCurrentUser: vi.fn(() => null),
  registerArtist: vi.fn(),
  registerListener: vi.fn(),
  setCurrentUser: vi.fn(),
}))

function renderRegisterPage() {
  return render(
    <ThemeProvider theme={createTheme()}>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ user: null })
    vi.mocked(registerArtist).mockReset()
    vi.mocked(registerListener).mockReset()
    vi.mocked(setCurrentUser).mockReset()
  })

  it('opens the privacy policy dialog', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    await user.click(screen.getByRole('button', { name: /privacy policy/i }))

    expect(screen.getByRole('dialog')).toHaveTextContent('Privacy Policy')
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Listener Terms and Privacy Policy',
    )
    expect(screen.getByRole('dialog')).toHaveTextContent('Listener Privacy Policy')
  })

  it('opens the artist privacy policy dialog', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    await user.click(screen.getByRole('tab', { name: /artist/i }))
    await user.click(screen.getByRole('button', { name: /privacy policy/i }))

    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Artist Terms and Privacy Policy',
    )
    expect(screen.getByRole('dialog')).toHaveTextContent('Artist Privacy Policy')
  })

  it('logs in after artist registration', async () => {
    const user = userEvent.setup()
    const artistUser: User = {
      id: 10,
      username: 'the_artist',
      email: 'artist@example.com',
      display_name: 'The Artist',
      role: 'artist',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    }
    vi.mocked(registerArtist).mockResolvedValue(artistUser)
    renderRegisterPage()

    await user.click(screen.getByRole('tab', { name: /artist/i }))
    await user.type(screen.getByLabelText(/^email$/i), 'artist@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await user.type(screen.getByLabelText(/artistic\/stage name/i), 'The Artist')
    await user.type(
      screen.getByLabelText(/portfolio links/i),
      'https://example.com/music',
    )
    const privacyCheckbox = screen.getByLabelText(/i agree to the terms and/i)
    await user.click(privacyCheckbox)
    expect(privacyCheckbox).toBeChecked()
    await user.click(screen.getByRole('button', { name: /^register$/i }))

    await waitFor(() => {
      expect(registerArtist).toHaveBeenCalledWith({
        email: 'artist@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        stage_name: 'The Artist',
        portfolio_links: ['https://example.com/music'],
      })
    })
    await waitFor(() => {
      expect(useAuthStore.getState().user).toEqual(artistUser)
    })
  })
})
