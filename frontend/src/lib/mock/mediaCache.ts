const MOCK_MEDIA_PREFIX = 'mock-media://'
const DB_NAME = 'spotify_mock_media'
const STORE_NAME = 'blobs'
const DB_VERSION = 1
const LEGACY_SESSION_KEY = 'mock_media_cache'

const memoryCache = new Map<string, string>()
let cacheReady = false

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'))
    })
  }
  return dbPromise
}

async function idbGetAll(): Promise<Record<string, string>> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const entries: Record<string, string> = {}
    const request = store.openCursor()

    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        entries[cursor.key as string] = cursor.value as string
        cursor.continue()
        return
      }
      resolve(entries)
    }
    request.onerror = () => reject(request.error ?? new Error('Failed to read IndexedDB'))
  })
}

async function idbPut(ref: string, dataUrl: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(dataUrl, ref)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Failed to write IndexedDB'))
  })
}

async function idbDelete(ref: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(ref)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Failed to delete from IndexedDB'))
  })
}

function readLegacySessionCache(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(LEGACY_SESSION_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function clearLegacySessionCache(): void {
  try {
    sessionStorage.removeItem(LEGACY_SESSION_KEY)
  } catch {
    // Ignore
  }
}

export function isMockMediaRef(value: string | null | undefined): value is string {
  return Boolean(value?.startsWith(MOCK_MEDIA_PREFIX))
}

export function isPlayableMediaUrl(value: string | null | undefined): boolean {
  if (!value?.trim()) {
    return false
  }
  if (value.startsWith(MOCK_MEDIA_PREFIX)) {
    return Boolean(getMockMedia(value))
  }
  return (
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    value.startsWith('http://') ||
    value.startsWith('https://')
  )
}

export function createTrackMediaRef(
  trackId: number,
  kind: 'audio' | 'cover',
): string {
  return `${MOCK_MEDIA_PREFIX}track/${trackId}/${kind}`
}

export function createAlbumCoverRef(albumId: number): string {
  return `${MOCK_MEDIA_PREFIX}album/${albumId}/cover`
}

export function isMediaCacheReady(): boolean {
  return cacheReady
}

export async function saveMockMedia(
  ref: string,
  dataUrl: string | undefined | null,
): Promise<void> {
  if (!dataUrl?.startsWith('data:')) {
    return
  }
  memoryCache.set(ref, dataUrl)
  await idbPut(ref, dataUrl)
}

export function getMockMedia(ref: string): string | undefined {
  return memoryCache.get(ref)
}

export function resolveMediaUrl(
  stored: string | null | undefined,
): string | undefined {
  if (!stored?.trim()) {
    return undefined
  }
  if (isMockMediaRef(stored)) {
    return getMockMedia(stored)
  }
  return stored
}

export async function toStoredMediaRef(
  dataUrl: string | undefined | null,
  ref: string,
): Promise<string | undefined> {
  if (!dataUrl?.trim()) {
    return undefined
  }
  if (dataUrl.startsWith('data:')) {
    await saveMockMedia(ref, dataUrl)
    return ref
  }
  return dataUrl
}

export async function deleteMockMedia(ref: string): Promise<void> {
  memoryCache.delete(ref)
  await idbDelete(ref)
}

export async function deleteMockMediaForTrack(trackId: number): Promise<void> {
  await Promise.all([
    deleteMockMedia(createTrackMediaRef(trackId, 'audio')),
    deleteMockMedia(createTrackMediaRef(trackId, 'cover')),
  ])
}

export async function deleteMockMediaForAlbum(albumId: number): Promise<void> {
  await deleteMockMedia(createAlbumCoverRef(albumId))
}

export async function preloadMockMediaCache(): Promise<void> {
  const idbEntries = await idbGetAll()
  for (const [ref, dataUrl] of Object.entries(idbEntries)) {
    memoryCache.set(ref, dataUrl)
  }

  const legacyEntries = readLegacySessionCache()
  const migrationWrites: Promise<void>[] = []
  for (const [ref, dataUrl] of Object.entries(legacyEntries)) {
    if (!memoryCache.has(ref)) {
      memoryCache.set(ref, dataUrl)
      migrationWrites.push(idbPut(ref, dataUrl))
    }
  }
  await Promise.all(migrationWrites)
  if (Object.keys(legacyEntries).length > 0) {
    clearLegacySessionCache()
  }

  cacheReady = true
}

export function clearMockMediaCacheForTests(): void {
  memoryCache.clear()
  cacheReady = false
  dbPromise = null
}
