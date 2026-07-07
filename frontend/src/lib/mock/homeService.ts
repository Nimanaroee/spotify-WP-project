import { storage } from './storage';
import type { AlbumSummary, TrackSummary, PlaylistSummary } from '../../types';

export function getRecentPlaylists(): PlaylistSummary[] {
  const playlists = storage.get<PlaylistSummary[]>('playlists') ?? [];
  if (playlists.length > 0) {
    return playlists.slice(0, 10);
  }
  
  return [
    { id: 9001, name: 'Late Night Drives', cover_art: null, track_count: 12 },
    { id: 9002, name: 'Deep Focus Work', cover_art: null, track_count: 34 },
    { id: 9003, name: '90s Pop Mix', cover_art: null, track_count: 22 },
    { id: 9004, name: 'Classical Studying', cover_art: null, track_count: 14 }
  ];
}

export function getLatestAlbums(): AlbumSummary[] {
  const albums = storage.get<AlbumSummary[]>('albums') || [];
  return albums
    .sort((a, b) => new Date(b.release_year ?? 0).getTime() - new Date(a.release_year ?? 0).getTime())
    .slice(0, 10);
}

export function getTopSongs(): TrackSummary[] {
  const tracks = storage.get<TrackSummary[]>('tracks') || [];
  return tracks
    .sort((a, b) => (b.stream_count || 0) - (a.stream_count || 0))
    .slice(0, 10);
}

export function getEarlyAccessReleases(): TrackSummary[] {
  const tracks = storage.get<TrackSummary[]>('tracks') || [];
  return tracks
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title))
    .slice(0, 6);
}