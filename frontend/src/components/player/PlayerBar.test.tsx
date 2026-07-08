import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import PlayerBar from './PlayerBar';
import { ROLES } from '../../lib/constants/roles';
import { storage } from '../../lib/mock/storage';
import { useAuthStore } from '../../store/authStore';
import { usePlayerStore } from '../../store/playerStore';
import { LanguageContext } from '../../theme/LanguageContext';

function ProfileRoute() {
  const { username } = useParams();

  return <div>Artist profile: {username}</div>;
}

function renderPlayerBar() {
  return render(
    <LanguageContext.Provider
      value={{
        language: 'en',
        setLanguage: () => undefined,
        toggleLanguage: () => undefined,
      }}
    >
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<PlayerBar />} />
            <Route path="/profile/:username" element={<ProfileRoute />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </LanguageContext.Provider>,
  );
}

describe('PlayerBar', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.set('users', [
      {
        id: 4,
        username: 'demo_artist',
        email: 'artist@example.com',
        password: 'password123',
        display_name: 'Demo Artist',
        role: ROLES.ARTIST,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]);
    useAuthStore.setState({
      user: {
        id: 1,
        username: 'listener',
        email: 'listener@example.com',
        display_name: 'Listener',
        role: ROLES.LISTENER,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    });
    usePlayerStore.setState({
      currentTrack: {
        id: 1,
        title: 'Artist Single',
        artist_id: 4,
        artist_name: 'Demo Artist',
        release_type: 'single',
        duration_seconds: 180,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      queue: [],
      isPlaying: true,
      progressSeconds: 0,
      durationSeconds: 180,
    });
  });

  it('opens the current track publisher profile by username instead of artist id', async () => {
    const user = userEvent.setup();
    renderPlayerBar();

    await user.click(screen.getByText('Demo Artist'));

    expect(screen.getByText('Artist profile: demo_artist')).toBeInTheDocument();
    expect(screen.queryByText('Artist profile: 4')).not.toBeInTheDocument();
  });
});
