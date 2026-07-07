import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '../theme/appTheme'
import { MemoryRouter } from 'react-router-dom'
import ArtworkManagementPage from './ArtworkManagementPage'
import { ROLES } from '../lib/constants/roles'
import { storage } from '../lib/mock/storage'
import { useAuthStore } from '../store/authStore'
import { ThemeModeContext } from '../theme/ThemeModeContext'
import type { ArtistProfile } from '../types/artist'

const createdAt = '2026-01-01T00:00:00.000Z'

function renderPage() {
  return render(
    <ThemeModeContext.Provider value={{ mode: 'dark', toggleThemeMode: () => undefined }}>
      <ThemeProvider theme={createAppTheme('dark')}>
        <MemoryRouter>
          <ArtworkManagementPage />
        </MemoryRouter>
      </ThemeProvider>
    </ThemeModeContext.Provider>,
  )
}

describe('ArtworkManagementPage', () => {
  beforeEach(() => {
    localStorage.clear()
    storage.set('artist_profiles', [
      {
        id: 1,
        user_id: 2,
        stage_name: 'Demo Artist',
        verification_status: 'approved',
        is_verified: true,
        created_at: createdAt,
        updated_at: createdAt,
      } satisfies ArtistProfile,
    ])
    storage.set('tracks', [])
    storage.set('albums', [])

    useAuthStore.setState({
      user: {
        id: 2,
        username: 'demo_artist',
        email: 'artist@example.com',
        display_name: 'Demo Artist',
        role: ROLES.ARTIST,
        subscription_tier: 'basic',
        created_at: createdAt,
        updated_at: createdAt,
      },
    })
  })

  it('shows blocked message for unverified artists', () => {
    storage.set('artist_profiles', [
      {
        id: 2,
        user_id: 11,
        stage_name: 'Neon Waves',
        verification_status: 'pending',
        is_verified: false,
        created_at: createdAt,
        updated_at: createdAt,
      } satisfies ArtistProfile,
    ])

    useAuthStore.setState({
      user: {
        id: 11,
        username: 'pending_artist',
        email: 'pending@example.com',
        display_name: 'Neon Waves',
        role: ROLES.ARTIST,
        subscription_tier: 'basic',
        created_at: createdAt,
        updated_at: createdAt,
      },
    })

    renderPage()
    expect(
      screen.getByText(/your account must be approved before managing releases/i),
    ).toBeInTheDocument()
  })

  it('shows empty state when there are no releases', () => {
    renderPage()
    expect(screen.getByText(/you have not published any tracks yet/i)).toBeInTheDocument()
  })

  it('renders release list inside a scrollable table container when releases exist', () => {
    storage.set('tracks', [
      {
        id: 1,
        artist_id: 2,
        title: 'Midnight Run',
        release_type: 'single',
        genre: 'Electronic',
        release_year: 2026,
        cover_art: '',
        audio_url: '',
        created_at: createdAt,
        updated_at: createdAt,
      },
    ])

    renderPage()

    const table = screen.getByRole('table')
    expect(table.closest('.MuiTableContainer-root')).toHaveStyle({ overflowX: 'auto' })
    expect(screen.getByText('Midnight Run')).toBeInTheDocument()
  })

  it('shows a newly published single in My Releases after publish', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /^publish$/i }))
    await user.type(screen.getByLabelText(/release title/i), 'Fresh Single')
    await user.type(screen.getByLabelText(/^track title$/i), 'Fresh Track')

    const audioInput = document.querySelector('input[type="file"][accept*="audio"]')
    expect(audioInput).toBeTruthy()

    const audioFile = new File(['audio-bytes'], 'fresh-track.mp3', { type: 'audio/mpeg' })
    await user.upload(audioInput as HTMLInputElement, audioFile)

    await waitFor(() => {
      expect(screen.getAllByText(/fresh-track\.mp3/i).length).toBeGreaterThan(0)
    })

    await user.click(screen.getByRole('button', { name: /publish release/i }))

    await waitFor(() => {
      expect(screen.getByText('Fresh Track')).toBeInTheDocument()
    })
    expect(screen.getByText(/release published successfully/i)).toBeInTheDocument()
    expect(storage.get<Array<{ title: string }>>('tracks')).toHaveLength(1)
  })
})
