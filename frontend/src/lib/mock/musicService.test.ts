import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deleteTrack,
  getTrackStats,
  listArtistReleases,
  publishRelease,
  recordTrackPlay,
  updateTrack,
} from './musicService'
import { clearMockMediaCacheForTests, getMockMedia } from './mediaCache'
import type { ArtistProfile } from '../../types/artist'
import type { PublishReleasePayload, Track } from '../../types/music'

const storageState = new Map<string, unknown>()

vi.mock('./storage', () => ({
  storage: {
    get: vi.fn((key: string) => storageState.get(key) ?? null),
    set: vi.fn((key: string, value: unknown) => {
      storageState.set(key, value)
    }),
    remove: vi.fn((key: string) => {
      storageState.delete(key)
    }),
  },
}))

const createdAt = '2026-01-01T00:00:00.000Z'

const verifiedProfile: ArtistProfile = {
  id: 1,
  user_id: 2,
  stage_name: 'Demo Artist',
  verification_status: 'approved',
  is_verified: true,
  created_at: createdAt,
  updated_at: createdAt,
}

const unverifiedProfile: ArtistProfile = {
  id: 2,
  user_id: 11,
  stage_name: 'Neon Waves',
  verification_status: 'pending',
  is_verified: false,
  created_at: createdAt,
  updated_at: createdAt,
}

const audioData = 'data:audio/mpeg;base64,abc'

const singlePayload: PublishReleasePayload = {
  release_type: 'single',
  title: 'New Single',
  genre: 'Pop',
  release_year: 2026,
  co_artists: ['Guest'],
  cover_art: 'data:image/png;base64,cover',
  tracks: [
    {
      title: 'Single Track',
      audio_file: audioData,
      lyrics: 'Hello world',
    },
  ],
}

const albumPayload: PublishReleasePayload = {
  release_type: 'album',
  title: 'New Album',
  genre: 'Rock',
  release_year: 2026,
  tracks: [
    { title: 'Track A', audio_file: audioData },
    { title: 'Track B', audio_file: audioData },
  ],
}

describe('musicService', () => {
  beforeEach(() => {
    storageState.clear()
    sessionStorage.clear()
    clearMockMediaCacheForTests()
    storageState.set('artist_profiles', [verifiedProfile, unverifiedProfile])
    storageState.set('tracks', [] as Track[])
    storageState.set('albums', [])
  })

  it('publishes a single release for a verified artist', async () => {
    const created = await publishRelease(2, 'Demo Artist', singlePayload)
    expect(created).toHaveLength(1)
    expect(created[0].artist_id).toBe(2)
    expect(created[0].release_type).toBe('single')
    expect(listArtistReleases(2)).toHaveLength(1)
  })

  it('publishes an album with multiple tracks', async () => {
    const created = await publishRelease(2, 'Demo Artist', albumPayload)
    expect(created).toHaveLength(2)
    expect(created.every((track) => track.album_id === 1)).toBe(true)
    expect(storageState.get('albums')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: 'New Album', artist_id: 2, track_count: 2 }),
      ]),
    )
  })

  it('updates track metadata', async () => {
    await publishRelease(2, 'Demo Artist', singlePayload)
    const [track] = listArtistReleases(2)
    const updated = await updateTrack(track.id, 2, {
      title: 'Renamed Single',
      lyrics: 'Updated lyrics',
    })
    expect(updated.title).toBe('Renamed Single')
    expect(updated.lyrics).toBe('Updated lyrics')
  })

  it('deletes a track scoped to the artist', async () => {
    await publishRelease(2, 'Demo Artist', singlePayload)
    const stored = storageState.get('tracks') as Track[]
    const audioRef = stored[0].audio_url
    const [track] = listArtistReleases(2)
    await deleteTrack(track.id, 2)
    expect(listArtistReleases(2)).toHaveLength(0)
    if (audioRef?.startsWith('mock-media://')) {
      expect(getMockMedia(audioRef)).toBeUndefined()
    }
  })

  it('calculates track stats with mock revenue', () => {
    storageState.set('tracks', [
      {
        id: 1,
        title: 'Seeded',
        artist_id: 2,
        artist_name: 'Demo Artist',
        release_type: 'single',
        stream_count: 100,
        listener_count: 40,
        created_at: createdAt,
        updated_at: createdAt,
      },
    ] as Track[])

    const stats = getTrackStats(1, 2)
    expect(stats.stream_count).toBe(100)
    expect(stats.revenue).toBe(5)
  })

  it('records stream starts and keeps listeners distinct per track and artist', () => {
    storageState.set('tracks', [
      {
        id: 1,
        title: 'Seeded',
        artist_id: 2,
        artist_name: 'Demo Artist',
        release_type: 'single',
        stream_count: 100,
        listener_count: 40,
        created_at: createdAt,
        updated_at: createdAt,
      },
    ] as Track[])

    recordTrackPlay(1, 7)
    recordTrackPlay(1, 7)
    recordTrackPlay(1, 8)

    const [track] = storageState.get('tracks') as Track[]
    expect(track.stream_count).toBe(103)
    expect(track.listener_count).toBe(2)
    expect(storageState.get('daily_streams')).toEqual({ 7: 2, 8: 1 })
    expect(storageState.get('track_listeners')).toEqual({ 1: [7, 8] })
    expect(storageState.get('artist_listeners')).toEqual({ 2: [7, 8] })
  })

  it('blocks publish for unverified artists', async () => {
    await expect(publishRelease(11, 'Neon Waves', singlePayload)).rejects.toThrow(
      /verified artists/i,
    )
  })

  it('stores media refs in localStorage and resolves playable URLs from cache', async () => {
    await publishRelease(2, 'Demo Artist', singlePayload)
    const stored = storageState.get('tracks') as Track[]
    expect(stored[0].audio_url).toMatch(/^mock-media:\/\/track\/\d+\/audio$/)
    expect(stored[0].cover_art).toMatch(/^mock-media:\/\/track\/\d+\/cover$/)

    const [track] = listArtistReleases(2)
    expect(track.audio_url).toBe(audioData)
    expect(track.cover_art).toBe(singlePayload.cover_art)
  })
})
