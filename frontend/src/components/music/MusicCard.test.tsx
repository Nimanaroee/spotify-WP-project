import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import MusicCard from './MusicCard';
import { ROLES } from '../../lib/constants/roles';
import { storage } from '../../lib/mock/storage';
import { useAuthStore } from '../../store/authStore';
import type { CatalogItem } from '../../lib/mock/musicService';

function ProfileRoute() {
  const { username } = useParams();

  return <div>Artist profile: {username}</div>;
}

function renderMusicCard(item: CatalogItem) {
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
  });

  it('opens the publisher profile by username instead of artist id', async () => {
    const user = userEvent.setup();
    const item: CatalogItem = {
      id: 1,
      title: 'Artist Single',
      artist_id: 4,
      artist_name: 'Demo Artist',
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
