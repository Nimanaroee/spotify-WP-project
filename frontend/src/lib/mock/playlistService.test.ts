import { beforeEach, describe, expect, it } from 'vitest';
import { useCatalogStore } from '../../store/catalogStore';
import { deletePlaylist } from './playlistService';
import { storage } from './storage';

describe('playlistService', () => {
  beforeEach(() => {
    localStorage.clear();
    useCatalogStore.setState({ version: 0 });
  });

  it('bumps the catalog version when a playlist is deleted', () => {
    storage.set('playlists', [
      {
        id: 1,
        owner_id: 2,
        name: 'Morning Mix',
        cover_art: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]);
    storage.set('playlist_tracks', [
      {
        id: 1,
        playlist_id: 1,
        track_id: 11,
        position: 0,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]);

    deletePlaylist(2, 1);

    expect(storage.get('playlists')).toEqual([]);
    expect(storage.get('playlist_tracks')).toEqual([]);
    expect(useCatalogStore.getState().version).toBe(2);
  });
});
