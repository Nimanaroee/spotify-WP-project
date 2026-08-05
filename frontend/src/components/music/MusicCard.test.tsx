import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import MusicCard from './MusicCard';
import { ROLES } from '../../lib/constants/roles';
import { useAuthStore } from '../../store/authStore';

function ProfileRoute() {
  const { username } = useParams();

  return <div>Artist profile: {username}</div>;
}

function renderMusicCard(item: any) {
  return render(
    <ThemeProvider theme={createTheme()}>
      <MemoryRouter initialEntries={['/albums']}>
        <Routes>
          <Route
            path="/albums"
            element={
              <MusicCard
                item={item}
                onManagePlaylists={vi.fn()}
                onTriggerPlayer={vi.fn()}
              />
            }
          />
          <Route path="/profile/:username" element={<ProfileRoute />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('MusicCard', () => {
  beforeEach(() => {
    localStorage.clear();

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
  });

  it('opens the publisher profile by username instead of artist id', async () => {
    const user = userEvent.setup();
    const item = {
      id: 1,
      title: 'Artist Single',
      artist_id: 4,
      artist_name: 'Demo Artist',
      artist_username: 'demo_artist',
      release_type: 'single',
      itemType: 'track',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    };

    renderMusicCard(item);

    await user.click(screen.getByText('Demo Artist'));

    expect(screen.getByText('Artist profile: demo_artist')).toBeInTheDocument();
    expect(screen.queryByText('Artist profile: 4')).not.toBeInTheDocument();
  });
});