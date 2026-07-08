import { storage } from './storage';
import { hydrateAlbum, hydrateTrack, resolveDisplayUrl } from './hydrateMedia';
import type { Album, Track, PlaylistSummary } from '../../types';

export function getRecentPlaylists(): PlaylistSummary[] {
  const playlists = storage.get<PlaylistSummary[]>('playlists') ?? [];
  return playlists.slice(0, 10).map((playlist) => ({
    ...playlist,
    cover_art: resolveDisplayUrl(playlist.cover_art),
  }));
}

export function getLatestAlbums(): Album[] {
  const albums = storage.get<Album[]>('albums') || [];
  return albums
    .sort((a, b) => new Date(b.release_year ?? 0).getTime() - new Date(a.release_year ?? 0).getTime())
    .slice(0, 10)
    .map(hydrateAlbum);
}

export function getTopSongs(): Track[] {
  const tracks = storage.get<Track[]>('tracks') || [];
  return tracks
    .sort((a, b) => (b.stream_count || 0) - (a.stream_count || 0))
    .slice(0, 10)
    .map(hydrateTrack);
}

export function getEarlyAccessReleases(): Track[] {
  const tracks = storage.get<Track[]>('tracks') || [];
  return tracks
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title))
    .slice(0, 6)
    .map(hydrateTrack);
}

export function getLatestReleases(): Track[] {
  const tracks = storage.get<Track[]>('tracks') || [];
  return tracks
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10)
    .map(hydrateTrack);
}
