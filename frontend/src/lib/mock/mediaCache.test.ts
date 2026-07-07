import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearMockMediaCacheForTests,
  createTrackMediaRef,
  getMockMedia,
  preloadMockMediaCache,
  saveMockMedia,
  toStoredMediaRef,
} from './mediaCache'

describe('mediaCache', () => {
  beforeEach(() => {
    sessionStorage.clear()
    clearMockMediaCacheForTests()
  })

  it('stores and resolves data URLs by ref', async () => {
    const ref = createTrackMediaRef(1, 'audio')
    const dataUrl = 'data:audio/mpeg;base64,abc'

    await saveMockMedia(ref, dataUrl)
    expect(getMockMedia(ref)).toBe(dataUrl)
  })

  it('preloads refs from IndexedDB into memory', async () => {
    const ref = createTrackMediaRef(2, 'cover')
    const dataUrl = 'data:image/png;base64,cover'

    await toStoredMediaRef(dataUrl, ref)
    clearMockMediaCacheForTests()

    await preloadMockMediaCache()
    expect(getMockMedia(ref)).toBe(dataUrl)
  })
})
