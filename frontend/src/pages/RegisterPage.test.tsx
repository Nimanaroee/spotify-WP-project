import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material'
import RegisterPage from './RegisterPage'
import { registerArtist, registerListener, setCurrentUser } from '../lib/api/authService'
import { useAuthStore } from '../store/authStore'

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
      'Your privacy is important to us',
    )
  })

  it('submits artist registration as pending approval', async () => {
    const user = userEvent.setup()
    vi.mocked(registerArtist).mockResolvedValue({
      status: 'pending_approval',
      message: 'Your artist account request is pending approval.',
    })
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
    await user.click(screen.getByRole('button', { name: /^register$/i }))

    expect(await screen.findByText(/pending approval/i)).toBeInTheDocument()
    expect(registerArtist).toHaveBeenCalledWith({
      email: 'artist@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      stage_name: 'The Artist',
      portfolio_links: ['https://example.com/music'],
    })
    expect(useAuthStore.getState().user).toBeNull()
  })
})
