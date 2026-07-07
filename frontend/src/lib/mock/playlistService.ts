import { storage } from './storage';
import { hydrateTrack, resolveDisplayUrl } from './hydrateMedia';
import { SUBSCRIPTION_LIMITS } from '../constants/subscriptionLimits';
import type { Playlist, PlaylistTrack, Track, User } from '../../types';

const PLAYLISTS_KEY = 'playlists';
const PLAYLIST_TRACKS_KEY = 'playlist_tracks';
const TRACKS_KEY = 'tracks';

function nowIso(): string {
  return new Date().toISOString();
}

function getNextId(items: Array<{ id: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

export function getUserPlaylists(userId: number): Playlist[] {
  const playlists = storage.get<Playlist[]>(PLAYLISTS_KEY) ?? [];
  const playlistTracks = storage.get<PlaylistTrack[]>(PLAYLIST_TRACKS_KEY) ?? [];
  const allTracks = storage.get<Track[]>(TRACKS_KEY) ?? [];

  const userPlaylists = playlists
    .filter((p) => p.owner_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  // Hydrate with Track Summaries
  return userPlaylists.map((playlist) => {
    const ptMappings = playlistTracks
      .filter((pt) => pt.playlist_id === playlist.id)
      .sort((a, b) => a.position - b.position);

    const populatedTracks = ptMappings
      .map((pt) => allTracks.find((tr) => tr.id === pt.track_id))
      .filter(Boolean)
      .map((track) => hydrateTrack(track as Track));

    return {
      ...playlist,
      cover_art: resolveDisplayUrl(playlist.cover_art),
      tracks: populatedTracks,
      track_count: populatedTracks.length,
    };
  });
}

// ---------------- NEW METHODS FOR DISCOVER PAGE ----------------
export function toggleTrackInPlaylist(userId: number, playlistId: number, trackId: number, state: boolean): void {
  const playlists = storage.get<Playlist[]>(PLAYLISTS_KEY) ?? [];
  const ownsPlaylist = playlists.some(p => p.id === playlistId && p.owner_id === userId);
  
  if (!ownsPlaylist) throw new Error('Cannot modify playlist');

  let playlistTracks = storage.get<PlaylistTrack[]>(PLAYLIST_TRACKS_KEY) ?? [];
  const existingMapping = playlistTracks.find(pt => pt.playlist_id === playlistId && pt.track_id === trackId);

  if (state && !existingMapping) {
    const createdAt = nowIso();
    // determine latest pos
    const position = playlistTracks.filter(pt => pt.playlist_id === playlistId).length;
    
    playlistTracks.push({
      id: getNextId(playlistTracks),
      playlist_id: playlistId,
      track_id: trackId,
      position,
      created_at: createdAt,
      updated_at: createdAt
    });
  } else if (!state && existingMapping) {
    playlistTracks = playlistTracks.filter(pt => pt.id !== existingMapping.id);
  }

  storage.set(PLAYLIST_TRACKS_KEY, playlistTracks);
}
// ---------------------------------------------------------------

export function createPlaylist(user: User, name: string): Playlist {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('Playlist name cannot be empty.');

  const limit = SUBSCRIPTION_LIMITS[user.subscription_tier ?? 'basic'].playlistLimit;
  const playlists = storage.get<Playlist[]>(PLAYLISTS_KEY) ?? [];
  const userPlaylistsCount = playlists.filter((p) => p.owner_id === user.id).length;

  if (limit !== Infinity && userPlaylistsCount >= limit) {
    throw new Error('Playlist limit reached for your subscription tier.');
  }

  const createdAt = nowIso();
  const newPlaylist: Playlist = {
    id: getNextId(playlists),
    owner_id: user.id,
    name: trimmedName,
    created_at: createdAt,
    updated_at: createdAt,
    cover_art: null,
  };

  storage.set(PLAYLISTS_KEY, [...playlists, newPlaylist]);
  return { ...newPlaylist, tracks: [], track_count: 0 };
}

export function renamePlaylist(userId: number, playlistId: number, name: string): Playlist {
  const playlists = storage.get<Playlist[]>(PLAYLISTS_KEY) ?? [];
  const idx = playlists.findIndex((p) => p.id === playlistId && p.owner_id === userId);

  if (idx === -1) throw new Error('Playlist not found.');
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('Playlist name cannot be empty.');

  const updatedPlaylist = {
    ...playlists[idx],
    name: trimmedName,
    updated_at: nowIso(),
  };

  playlists[idx] = updatedPlaylist;
  storage.set(PLAYLISTS_KEY, playlists);
  return updatedPlaylist;
}

export function deletePlaylist(userId: number, playlistId: number): void {
  const playlists = storage.get<Playlist[]>(PLAYLISTS_KEY) ?? [];
  const filtered = playlists.filter((p) => !(p.id === playlistId && p.owner_id === userId));
  
  if (filtered.length === playlists.length) {
    throw new Error('Playlist not found or permission denied.');
  }

  storage.set(PLAYLISTS_KEY, filtered);

  const ptMappings = storage.get<PlaylistTrack[]>(PLAYLIST_TRACKS_KEY) ?? [];
  const activeMappings = ptMappings.filter((pt) => pt.playlist_id !== playlistId);
  storage.set(PLAYLIST_TRACKS_KEY, activeMappings);
}