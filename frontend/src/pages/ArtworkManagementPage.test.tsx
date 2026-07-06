import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material'
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
      <ThemeProvider theme={createTheme()}>
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
})
