import type { Album, Track } from '../../types/music'
import { isMockMediaRef, resolveMediaUrl } from './mediaCache'

export function hydrateTrack(track: Track): Track {
  return {
    ...track,
    audio_url: resolveMediaUrl(track.audio_url),
    cover_art: resolveMediaUrl(track.cover_art) ?? null,
  }
}

export function hydrateAlbum(album: Album): Album {
  return {
    ...album,
    cover_art: resolveMediaUrl(album.cover_art) ?? null,
    tracks: album.tracks?.map((track) => ({
      ...track,
      cover_art: resolveMediaUrl(track.cover_art) ?? null,
    })),
  }
}

export function hydrateTracks(tracks: Track[]): Track[] {
  return tracks.map(hydrateTrack)
}

export function resolveDisplayUrl(
  stored: string | null | undefined,
): string | null {
  if (!stored?.trim()) {
    return null
  }
  if (isMockMediaRef(stored)) {
    return resolveMediaUrl(stored) ?? null
  }
  return stored
}
