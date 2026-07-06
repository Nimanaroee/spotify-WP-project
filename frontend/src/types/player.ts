import type { TrackSummary } from './music'

export type RepeatMode = 'none' | 'all' | 'one'

export interface QueueItem {
  track: TrackSummary
  source: 'album' | 'playlist' | 'single' | 'queue'
  source_id?: number
}

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
