import type { TrackSummary } from './music'

/** Repeat modes required by the music player spec. */
export type RepeatMode = 'none' | 'all' | 'one'

export interface QueueItem {
  track: TrackSummary
  source: 'album' | 'playlist' | 'single' | 'queue'
  source_id?: number
}

/** Client-side player state (Phase 1 mock; synced via backend in Phase 2). */
export interface PlayerState {
  currentTrack: TrackSummary | null
  queue: QueueItem[]
  isPlaying: boolean
  progressSeconds: number
  volume: number
  repeatMode: RepeatMode
  shuffle: boolean
  isExpanded: boolean
}
