import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material'
import { MemoryRouter } from 'react-router-dom'
import TicketsPage from './TicketsPage'
import { createAppTheme } from '../../theme/appTheme'
import { storage } from '../../lib/mock/storage'
import { ThemeModeContext } from '../../theme/ThemeModeContext'
import type { ArtistVerificationRequest } from '../../types/artist'
import type { SupportTicket } from '../../types/support'

const createdAt = '2026-01-01T00:00:00.000Z'

function renderTicketsPage(initialEntry = '/admin/tickets') {
  return render(
    <ThemeModeContext.Provider value={{ mode: 'dark', toggleThemeMode: () => undefined }}>
      <ThemeProvider theme={createAppTheme('dark')}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <TicketsPage />
        </MemoryRouter>
      </ThemeProvider>
    </ThemeModeContext.Provider>,
  )
}

describe('TicketsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    storage.set('tickets', [
      {
        id: 1,
        user_id: 1,
        user_name: 'Demo User',
        subject: 'Cannot create more playlists',
        status: 'open',
        messages: [],
        created_at: createdAt,
        updated_at: createdAt,
      } satisfies SupportTicket,
    ])
    storage.set('verification_requests', [
      {
        id: 1,
        user_id: 11,
        email: 'pending@example.com',
        stage_name: 'Neon Waves',
        portfolio_links: ['https://example.com/portfolio'],
        verification_status: 'pending',
        created_at: createdAt,
        updated_at: createdAt,
      } satisfies ArtistVerificationRequest,
    ])
  })

  it('renders scrollable tabs with full labels', () => {
    renderTicketsPage()

    expect(screen.getByRole('tab', { name: /support tickets/i })).toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: /artist approval requests/i }),
    ).toBeInTheDocument()
  })

  it('wraps ticket rows in a horizontally scrollable table container', () => {
    renderTicketsPage()

    const table = screen.getByRole('table')
    expect(table.closest('.MuiTableContainer-root')).toHaveStyle({ overflowX: 'auto' })
    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('Demo User')).toBeInTheDocument()
  })

  it('shows verification requests in the second tab', async () => {
    const user = userEvent.setup()
    renderTicketsPage()

    await user.click(screen.getByRole('tab', { name: /artist approval requests/i }))

    expect(screen.getByText('Neon Waves')).toBeInTheDocument()
    expect(screen.getByText('pending@example.com')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view portfolio/i })).toBeInTheDocument()
  })
})
