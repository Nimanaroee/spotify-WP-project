import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material'
import ForgotPasswordPage from './ForgotPasswordPage'
import { storage } from '../lib/mock/storage'

function renderForgotPasswordPage() {
  return render(
    <ThemeProvider theme={createTheme()}>
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores a recovery request after email submission', async () => {
    const user = userEvent.setup()
    renderForgotPasswordPage()

    await user.type(screen.getByLabelText(/email/i), 'person@example.com')
    await user.click(screen.getByRole('button', { name: /send recovery email/i }))

    expect(await screen.findByText(/request saved/i)).toBeInTheDocument()
    expect(storage.get<Array<{ email: string }>>('password_recovery_requests')).toEqual([
      { email: 'person@example.com' },
    ])
  })
})
