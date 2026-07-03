import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material'
import RegisterPage from './RegisterPage'
import { storage } from '../lib/mock/storage'
import { useAuthStore } from '../store/authStore'

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
    storage.set('users', [])
  })

  it('opens the privacy policy dialog', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    await user.click(screen.getByRole('button', { name: /privacy policy/i }))

    expect(screen.getByRole('dialog')).toHaveTextContent('Privacy Policy')
    expect(screen.getByRole('dialog')).toHaveTextContent('1. Information We Collect')
    expect(screen.getByRole('dialog')).toHaveTextContent('Account Registration:')
  })

  it('submits artist registration as pending approval', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    await user.click(screen.getByRole('tab', { name: /artist/i }))
    await user.type(screen.getByLabelText(/^email$/i), 'artist@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await user.type(screen.getByLabelText(/artistic\/stage name/i), 'The Artist')
    await user.type(
      screen.getByLabelText(/portfolio\/work samples/i),
      'https://example.com/music',
    )
    await user.click(screen.getByRole('button', { name: /request artist approval/i }))

    expect(await screen.findByText(/pending approval/i)).toBeInTheDocument()
    expect(storage.get<unknown[]>('verification_requests')).toHaveLength(1)
    expect(useAuthStore.getState().user).toBeNull()
  })
})
