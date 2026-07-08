import { beforeEach, describe, expect, it } from 'vitest'
import { clearMockMediaCacheForTests, saveMockMedia } from './mediaCache'
import { getRecentPlaylists, getTopSongs } from './homeService'
import { storage } from './storage'
import type { Track } from '../../types/music'

const createdAt = '2026-01-01T00:00:00.000Z'

describe('homeService', () => {
  beforeEach(() => {
    storage.set('tracks', [])
    storage.set('playlists', [])
    clearMockMediaCacheForTests()
  })

  it('does not invent recent playlists when storage is empty', () => {
    expect(getRecentPlaylists()).toEqual([])
  })

  it('returns hydrated cover URLs instead of mock-media refs', async () => {
    const coverRef = 'mock-media://track/1/cover'
    const coverData = 'data:image/png;base64,cover'
    await saveMockMedia(coverRef, coverData)

    storage.set('tracks', [
      {
        id: 1,
        title: 'Hydrated Song',
        artist_id: 2,
        artist_name: 'Demo Artist',
        release_type: 'single',
        cover_art: coverRef,
        audio_url: '',
        stream_count: 10,
        created_at: createdAt,
        updated_at: createdAt,
      },
    ] satisfies Track[])

    const [track] = getTopSongs()
    expect(track.cover_art).toBe(coverData)
  })
})
