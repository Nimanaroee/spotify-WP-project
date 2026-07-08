import { REVENUE_PER_STREAM } from '../constants/musicGenres'
import type {
  Album,
  PublishReleasePayload,
  Track,
  TrackStats,
  UpdateTrackPayload,
} from '../../types/music'
import { useCatalogStore } from '../../store/catalogStore'
import { isVerifiedArtist } from './artistProfileService'
import { hydrateAlbum, hydrateTrack } from './hydrateMedia'
import {
  createAlbumCoverRef,
  createTrackMediaRef,
  deleteMockMediaForAlbum,
  deleteMockMediaForTrack,
  toStoredMediaRef,
} from './mediaCache'
import { storage } from './storage'

const TRACKS_KEY = 'tracks'
const ALBUMS_KEY = 'albums'
const DAILY_STREAMS_KEY = 'daily_streams'
const TRACK_LISTENERS_KEY = 'track_listeners'
const ARTIST_LISTENERS_KEY = 'artist_listeners'

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
  useCatalogStore.getState().bumpCatalogVersion()
}

function readAlbums(): Album[] {
  return storage.get<Album[]>(ALBUMS_KEY) ?? []
}

function writeAlbums(albums: Album[]): void {
  storage.set(ALBUMS_KEY, albums)
  useCatalogStore.getState().bumpCatalogVersion()
}

function readListenerMap(key: string): Record<number, number[]> {
  return storage.get<Record<number, number[]>>(key) ?? {}
}

function addDistinctListener(
  listenersByOwner: Record<number, number[]>,
  ownerId: number,
  listenerId: number,
): Record<number, number[]> {
  const currentListeners = listenersByOwner[ownerId] ?? []

  if (currentListeners.includes(listenerId)) {
    return listenersByOwner
  }

  return {
    ...listenersByOwner,
    [ownerId]: [...currentListeners, listenerId],
  }
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

  const tracks = readTracks().filter((t) => t.album_id === albumId).map(hydrateTrack)
  return { album: hydrateAlbum(album), tracks }
}

export function searchCatalog(query: string, sortBy: 'release_date' | 'listener_count'): CatalogItem[] {
  const normalizedQuery = query.trim().toLowerCase()

  const tracks = readTracks()
  const albums = readAlbums()

  let results: CatalogItem[] = [
    ...tracks.map((t) => ({ ...hydrateTrack(t), itemType: 'track' as const })),
    ...albums.map((a) => ({ ...hydrateAlbum(a), itemType: 'album' as const })),
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
  return hydrateTrack(track)
}

// ---------------------------------------------------------------

export function listArtistReleases(artistId: number): Track[] {
  return readTracks()
    .filter((track) => track.artist_id === artistId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(hydrateTrack)
}

export function getTrack(trackId: number, artistId: number): Track {
  assertVerifiedArtist(artistId)
  return hydrateTrack(getOwnedTrack(trackId, artistId))
}

export function getTrackStats(trackId: number, artistId: number): TrackStats {
  const track = getOwnedTrack(trackId, artistId)
  const trackListeners = readListenerMap(TRACK_LISTENERS_KEY)
  const streamCount = track.stream_count ?? 0
  return {
    track_id: track.id,
    listener_count: trackListeners[track.id]?.length ?? track.listener_count ?? 0,
    stream_count: streamCount,
    revenue: streamCount * REVENUE_PER_STREAM,
  }
}

export function recordTrackPlay(trackId: number, listenerId: number): Track {
  const tracks = readTracks()
  const track = tracks.find((item) => item.id === trackId)

  if (!track) {
    throw new Error('Track not found')
  }

  const trackListeners = addDistinctListener(
    readListenerMap(TRACK_LISTENERS_KEY),
    track.id,
    listenerId,
  )
  const artistListeners = addDistinctListener(
    readListenerMap(ARTIST_LISTENERS_KEY),
    track.artist_id,
    listenerId,
  )
  const nextTrack: Track = {
    ...track,
    stream_count: (track.stream_count ?? 0) + 1,
    listener_count: trackListeners[track.id]?.length ?? 0,
  }

  storage.set(TRACK_LISTENERS_KEY, trackListeners)
  storage.set(ARTIST_LISTENERS_KEY, artistListeners)
  writeTracks(tracks.map((item) => (item.id === trackId ? nextTrack : item)))

  const albums = readAlbums()
  if (track.album_id) {
    const albumTracks = tracks.map((item) => (item.id === trackId ? nextTrack : item))
    writeAlbums(
      albums.map((album) => {
        if (album.id !== track.album_id) {
          return album
        }

        const tracksForAlbum = albumTracks.filter((item) => item.album_id === album.id)
        const albumListenerIds = new Set<number>()
        const latestTrackListeners = readListenerMap(TRACK_LISTENERS_KEY)
        tracksForAlbum.forEach((albumTrack) => {
          const trackListeners = latestTrackListeners[albumTrack.id] ?? []
          trackListeners.forEach((id) => albumListenerIds.add(id))
        })

        return {
          ...album,
          stream_count: tracksForAlbum.reduce((total, item) => total + (item.stream_count ?? 0), 0),
          listener_count: albumListenerIds.size,
        }
      }),
    )
  }

  const dailyStreams = storage.get<Record<number, number>>(DAILY_STREAMS_KEY) ?? {}
  storage.set(DAILY_STREAMS_KEY, {
    ...dailyStreams,
    [listenerId]: (dailyStreams[listenerId] ?? 0) + 1,
  })

  return hydrateTrack(nextTrack)
}

export async function publishRelease(
  artistId: number,
  stageName: string,
  payload: PublishReleasePayload,
): Promise<Track[]> {
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
  let albumCoverRef: string | null | undefined = null

  if (payload.release_type === 'album') {
    albumId = getNextId(albums)
    albumName = trimmedTitle
    albumCoverRef = await toStoredMediaRef(
      payload.cover_art,
      createAlbumCoverRef(albumId),
    )
    const album: Album = {
      id: albumId,
      title: trimmedTitle,
      artist_id: artistId,
      artist_name: stageName,
      cover_art: albumCoverRef ?? null,
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
    const trackId = nextTrackId
    const trackCoverRef = await toStoredMediaRef(
      payload.cover_art,
      createTrackMediaRef(trackId, 'cover'),
    )
    const trackAudioRef = await toStoredMediaRef(
      trackPayload.audio_file,
      createTrackMediaRef(trackId, 'audio'),
    )
    const track: Track = {
      id: trackId,
      title: trackPayload.title.trim(),
      artist_id: artistId,
      artist_name: stageName,
      album_id: albumId,
      album_name: albumName,
      cover_art: trackCoverRef ?? null,
      duration_seconds: trackPayload.duration_seconds,
      release_type: payload.release_type,
      audio_url: trackAudioRef,
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
  return createdTracks.map(hydrateTrack)
}

export async function updateTrack(
  trackId: number,
  artistId: number,
  payload: UpdateTrackPayload,
): Promise<Track> {
  assertVerifiedArtist(artistId)
  const tracks = readTracks()
  const index = tracks.findIndex((track) => track.id === trackId)

  if (index === -1 || tracks[index].artist_id !== artistId) {
    throw new Error('Track not found.')
  }

  const current = tracks[index]
  const updatedAt = nowIso()
  const coverArt =
    payload.cover_art !== undefined
      ? (await toStoredMediaRef(payload.cover_art, createTrackMediaRef(trackId, 'cover'))) ??
        null
      : current.cover_art
  const audioUrl =
    payload.audio_url !== undefined
      ? await toStoredMediaRef(payload.audio_url, createTrackMediaRef(trackId, 'audio'))
      : current.audio_url

  const updated: Track = {
    ...current,
    title: payload.title?.trim() || current.title,
    lyrics: payload.lyrics !== undefined ? payload.lyrics : current.lyrics,
    genre: payload.genre ?? current.genre,
    release_year: payload.release_year ?? current.release_year,
    co_artists: payload.co_artists ?? current.co_artists,
    cover_art: coverArt,
    audio_url: audioUrl,
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

  return hydrateTrack(updated)
}

export async function deleteTrack(trackId: number, artistId: number): Promise<void> {
  assertVerifiedArtist(artistId)
  const tracks = readTracks()
  const track = tracks.find((item) => item.id === trackId)

  if (!track || track.artist_id !== artistId) {
    throw new Error('Track not found.')
  }

  const albumIdToCleanup = track.album_id
  const remainingTracks = tracks.filter((item) => item.id !== trackId)
  writeTracks(remainingTracks)
  await deleteMockMediaForTrack(trackId)

  if (albumIdToCleanup) {
    const albumTracks = remainingTracks.filter((item) => item.album_id === albumIdToCleanup)
    if (albumTracks.length === 0) {
      writeAlbums(readAlbums().filter((album) => album.id !== albumIdToCleanup))
      await deleteMockMediaForAlbum(albumIdToCleanup)
    } else {
      const albums = readAlbums()
      const albumIndex = albums.findIndex((album) => album.id === albumIdToCleanup)
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
