import { REVENUE_PER_STREAM } from '../constants/musicGenres'
import type {
  Album,
  PublishReleasePayload,
  Track,
  TrackStats,
  UpdateTrackPayload,
} from '../../types/music'
import { isVerifiedArtist } from './artistProfileService'
import { storage } from './storage'

const TRACKS_KEY = 'tracks'
const ALBUMS_KEY = 'albums'

// We mix and unify output type so the list page can dynamically map Albums alongside standalone Songs
export type CatalogItem =
  | (Track & { itemType: 'track' })
  | (Album & { itemType: 'album' })

function nowIso(): string {
  return new Date().toISOString()
}

function getNextId(items: Array<{ id: number }>): number {
  return items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1
}

function readTracks(): Track[] {
  return storage.get<Track[]>(TRACKS_KEY) ?? []
}

function writeTracks(tracks: Track[]): void {
  storage.set(TRACKS_KEY, tracks)
}

function readAlbums(): Album[] {
  return storage.get<Album[]>(ALBUMS_KEY) ?? []
}

function writeAlbums(albums: Album[]): void {
  storage.set(ALBUMS_KEY, albums)
}

function assertVerifiedArtist(artistId: number): void {
  if (!isVerifiedArtist(artistId)) {
    throw new Error('Only verified artists can manage releases.')
  }
}

function getOwnedTrack(trackId: number, artistId: number): Track {
  const track = readTracks().find((item) => item.id === trackId)
  if (!track || track.artist_id !== artistId) {
    throw new Error('Track not found.')
  }
  return track
}

// ---------------- NEW METHODS FOR DISCOVER PAGE ----------------
export function getAlbumById(albumId: number): { album: Album; tracks: Track[] } {
  const albums = readAlbums()
  const album = albums.find((a) => a.id === albumId)
  if (!album) throw new Error('Album not found')

  const tracks = readTracks().filter((t) => t.album_id === albumId)
  return { album, tracks }
}

export function searchCatalog(query: string, sortBy: 'release_date' | 'listener_count'): CatalogItem[] {
  const normalizedQuery = query.trim().toLowerCase()

  const tracks = readTracks()
  const albums = readAlbums()

  let results: CatalogItem[] = [
    ...tracks.map((t) => ({ ...t, itemType: 'track' as const })),
    ...albums.map((a) => ({ ...a, itemType: 'album' as const })),
  ]

  // Filter 
  if (normalizedQuery) {
    results = results.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(normalizedQuery)
      const artistMatch = item.artist_name.toLowerCase().includes(normalizedQuery)
      return titleMatch || artistMatch
    })
  }

  // Sort
  if (sortBy === 'listener_count') {
    results.sort((a, b) => (b.listener_count ?? 0) - (a.listener_count ?? 0))
  } else {
    // Newer releases first
    results.sort((a, b) => {
      const yearDiff = (b.release_year ?? 0) - (a.release_year ?? 0)
      if (yearDiff !== 0) return yearDiff
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }

  return results
}

export function getTrackById(trackId: number): Track {
  const track = readTracks().find((item) => item.id === trackId)
  if (!track) throw new Error('Track not found')
  return track
}
// ---------------------------------------------------------------

export function listArtistReleases(artistId: number): Track[] {
  return readTracks()
    .filter((track) => track.artist_id === artistId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function getTrack(trackId: number, artistId: number): Track {
  assertVerifiedArtist(artistId)
  return getOwnedTrack(trackId, artistId)
}

export function getTrackStats(trackId: number, artistId: number): TrackStats {
  const track = getOwnedTrack(trackId, artistId)
  const streamCount = track.stream_count ?? 0
  return {
    track_id: track.id,
    listener_count: track.listener_count ?? 0,
    stream_count: streamCount,
    revenue: streamCount * REVENUE_PER_STREAM,
  }
}

export function publishRelease(
  artistId: number,
  stageName: string,
  payload: PublishReleasePayload,
): Track[] {
  assertVerifiedArtist(artistId)

  const trimmedTitle = payload.title.trim()
  if (!trimmedTitle) {
    throw new Error('Release title is required.')
  }

  if (payload.tracks.length === 0) {
    throw new Error('At least one track is required.')
  }

  if (payload.release_type === 'single' && payload.tracks.length !== 1) {
    throw new Error('A single release must contain exactly one track.')
  }

  if (payload.release_type === 'album' && payload.tracks.length < 2) {
    throw new Error('An album must contain at least two tracks.')
  }

  for (const trackPayload of payload.tracks) {
    if (!trackPayload.title.trim()) {
      throw new Error('Each track must have a title.')
    }
    if (!trackPayload.audio_file?.trim()) {
      throw new Error('Each track must include an audio file.')
    }
  }

  const createdAt = nowIso()
  const tracks = readTracks()
  const albums = readAlbums()
  const createdTracks: Track[] = []

  let albumId: number | null = null
  let albumName: string | null = null

  if (payload.release_type === 'album') {
    albumId = getNextId(albums)
    albumName = trimmedTitle
    const album: Album = {
      id: albumId,
      title: trimmedTitle,
      artist_id: artistId,
      artist_name: stageName,
      cover_art: payload.cover_art ?? null,
      release_type: 'album',
      release_year: payload.release_year,
      genre: payload.genre,
      track_count: payload.tracks.length,
      listener_count: 0,
      stream_count: 0,
      created_at: createdAt,
      updated_at: createdAt,
    }
    writeAlbums([...albums, album])
  }

  let nextTrackId = getNextId(tracks)

  for (const trackPayload of payload.tracks) {
    const track: Track = {
      id: nextTrackId,
      title: trackPayload.title.trim(),
      artist_id: artistId,
      artist_name: stageName,
      album_id: albumId,
      album_name: albumName,
      cover_art: payload.cover_art ?? null,
      duration_seconds: trackPayload.duration_seconds,
      release_type: payload.release_type,
      audio_url: trackPayload.audio_file,
      lyrics: trackPayload.lyrics?.trim() || null,
      genre: payload.genre,
      release_year: payload.release_year,
      co_artists: payload.co_artists,
      listener_count: 0,
      stream_count: 0,
      created_at: createdAt,
      updated_at: createdAt,
    }
    createdTracks.push(track)
    nextTrackId += 1
  }

  writeTracks([...tracks, ...createdTracks])
  return createdTracks
}

export function updateTrack(
  trackId: number,
  artistId: number,
  payload: UpdateTrackPayload,
): Track {
  assertVerifiedArtist(artistId)
  const tracks = readTracks()
  const index = tracks.findIndex((track) => track.id === trackId)

  if (index === -1 || tracks[index].artist_id !== artistId) {
    throw new Error('Track not found.')
  }

  const current = tracks[index]
  const updatedAt = nowIso()
  const updated: Track = {
    ...current,
    title: payload.title?.trim() || current.title,
    lyrics: payload.lyrics !== undefined ? payload.lyrics : current.lyrics,
    genre: payload.genre ?? current.genre,
    release_year: payload.release_year ?? current.release_year,
    co_artists: payload.co_artists ?? current.co_artists,
    cover_art: payload.cover_art ?? current.cover_art,
    audio_url: payload.audio_url ?? current.audio_url,
    updated_at: updatedAt,
  }

  const nextTracks = [...tracks]
  nextTracks[index] = updated
  writeTracks(nextTracks)

  if (updated.album_id) {
    const albums = readAlbums()
    const albumIndex = albums.findIndex((album) => album.id === updated.album_id)
    if (albumIndex !== -1) {
      const nextAlbums = [...albums]
      nextAlbums[albumIndex] = {
        ...nextAlbums[albumIndex],
        genre: updated.genre,
        release_year: updated.release_year,
        cover_art: updated.cover_art ?? nextAlbums[albumIndex].cover_art,
        updated_at: updatedAt,
      }
      writeAlbums(nextAlbums)
    }
  }

  return updated
}

export function deleteTrack(trackId: number, artistId: number): void {
  assertVerifiedArtist(artistId)
  const tracks = readTracks()
  const track = tracks.find((item) => item.id === trackId)

  if (!track || track.artist_id !== artistId) {
    throw new Error('Track not found.')
  }

  const remainingTracks = tracks.filter((item) => item.id !== trackId)
  writeTracks(remainingTracks)

  if (track.album_id) {
    const albumTracks = remainingTracks.filter((item) => item.album_id === track.album_id)
    if (albumTracks.length === 0) {
      writeAlbums(readAlbums().filter((album) => album.id !== track.album_id))
    } else {
      const albums = readAlbums()
      const albumIndex = albums.findIndex((album) => album.id === track.album_id)
      if (albumIndex !== -1) {
        const nextAlbums = [...albums]
        nextAlbums[albumIndex] = {
          ...nextAlbums[albumIndex],
          track_count: albumTracks.length,
          updated_at: nowIso(),
        }
        writeAlbums(nextAlbums)
      }
    }
  }
}