import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '../theme/appTheme'
import { MemoryRouter } from 'react-router-dom'
import ArtworkManagementPage from './ArtworkManagementPage'
import { ROLES } from '../lib/constants/roles'
import { useAuthStore } from '../store/authStore'
import { ThemeModeContext } from '../theme/ThemeModeContext'
import { getManageArtistProfileFromApi } from '../lib/api/profileService'
import { publishRelease, listArtistReleases } from '../lib/api/musicService'

vi.mock('../lib/api/profileService', () => ({
  getManageArtistProfileFromApi: vi.fn(),
}))

vi.mock('../lib/api/musicService', () => ({
  listArtistReleases: vi.fn(),
  publishRelease: vi.fn(),
  deleteTrack: vi.fn(),
  updateTrack: vi.fn(),
}))

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
    
    vi.mocked(getManageArtistProfileFromApi).mockResolvedValue({
      user: { id: 2, display_name: 'Demo Artist', role: ROLES.ARTIST, email: 'artist@example.com' } as any,
      artist_profile: { id: 1, user_id: 2, stage_name: 'Demo Artist', verification_status: 'approved', is_verified: true, created_at: createdAt, updated_at: createdAt } as any,
      albums: [],
      singles: [],
      listener_count: 0,
      total_streams: 0,
      daily_streams_count: 0,
      followers: [],
      following: [],
      is_following: false
    });

    vi.mocked(listArtistReleases).mockResolvedValue([]);

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

  it('shows blocked message for unverified artists', async () => {
    vi.mocked(getManageArtistProfileFromApi).mockResolvedValue({
      artist_profile: { verification_status: 'pending', is_verified: false }
    } as any);

    renderPage()
    expect(
      await screen.findByText(/your account must be approved before managing releases/i),
    ).toBeInTheDocument()
  })

  it('shows empty state when there are no releases', async () => {
    renderPage()
    expect(await screen.findByText(/you have not published any tracks yet/i)).toBeInTheDocument()
  })

  it('renders release list inside a scrollable table container when releases exist', async () => {
    vi.mocked(listArtistReleases).mockResolvedValue([
      {
        id: 1,
        artist_id: 2,
        title: 'Midnight Run',
        artist_name: 'Demo Artist',
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

    const table = await screen.findByRole('table')
    expect(table.closest('.MuiTableContainer-root')).toHaveStyle({ overflowX: 'auto' })
    expect(screen.getByText('Midnight Run')).toBeInTheDocument()
  })

  it('shows a newly published single in My Releases after publish', async () => {
    const user = userEvent.setup()
    
    vi.mocked(publishRelease).mockResolvedValue([
      { id: 2, title: 'Fresh Track', artist_id: 2, artist_name: 'Demo Artist', release_type: 'single', created_at: createdAt } as any
    ])
    
    renderPage()

    await user.click(await screen.findByRole('button', { name: /^publish$/i }))
    await user.type(screen.getByLabelText(/release title/i), 'Fresh Single')
    await user.type(screen.getByLabelText(/^track title$/i), 'Fresh Track')

    const audioInput = document.querySelector('input[type="file"][accept*="audio"]')
    expect(audioInput).toBeTruthy()

    const audioFile = new File(['audio-bytes'], 'fresh-track.mp3', { type: 'audio/mpeg' })
    await user.upload(audioInput as HTMLInputElement, audioFile)

    await waitFor(() => {
      expect(screen.getAllByText(/fresh-track\.mp3/i).length).toBeGreaterThan(0)
    })

    // Prepare list releases to return the new track on the subsequent fetch
    vi.mocked(listArtistReleases).mockResolvedValue([
      { id: 2, title: 'Fresh Track', artist_id: 2, artist_name: 'Demo Artist', release_type: 'single', created_at: createdAt } as any
    ])

    await user.click(screen.getByRole('button', { name: /publish release/i }))

    await waitFor(() => {
      expect(screen.getByText('Fresh Track')).toBeInTheDocument()
    })
    
    expect(publishRelease).toHaveBeenCalled();
  })
})