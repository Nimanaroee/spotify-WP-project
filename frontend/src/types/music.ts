import type { EntityId, Timestamps } from './common'

export type ReleaseType = 'single' | 'album'

export interface Genre {
  id: EntityId
  name: string
}

export interface TrackSummary {
  id: EntityId
  title: string
  artist_id: EntityId
  artist_name: string
  album_id?: EntityId | null
  album_name?: string | null
  cover_art?: string | null
  duration_seconds?: number
  release_type: ReleaseType
}

export interface Track extends TrackSummary, Timestamps {
  audio_url?: string
  lyrics?: string | null
  genre?: string
  release_year?: number
  co_artists?: string[]
  listener_count?: number
  stream_count?: number
}

export interface AlbumSummary {
  id: EntityId
  title: string
  artist_id: EntityId
  artist_name: string
  cover_art?: string | null
  release_type: ReleaseType
  release_year?: number
}

export interface Album extends AlbumSummary, Timestamps {
  genre?: string
  tracks?: TrackSummary[]
  track_count?: number
  listener_count?: number
  stream_count?: number
}

export interface StreamEvent {
  id: EntityId
  track_id: EntityId
  listener_id: EntityId
  played_at: string
}

export type MusicSortField = 'listener_count' | 'release_date'

export interface MusicSearchFilters {
  query?: string
  sort_by?: MusicSortField
  release_type?: ReleaseType
}

export interface PublishReleasePayload {
  release_type: ReleaseType
  title: string
  genre?: string
  release_year?: number
  co_artists?: string[]
  cover_art?: string
  tracks: PublishTrackPayload[]
}

export interface PublishTrackPayload {
  title: string
  audio_file?: string
  lyrics?: string
  duration_seconds?: number
}

export interface TrackStats {
  track_id: EntityId
  listener_count: number
  stream_count: number
  revenue: number
}

export interface UpdateTrackPayload {
  title?: string
  lyrics?: string | null
  genre?: string
  release_year?: number
  co_artists?: string[]
  cover_art?: string
  audio_url?: string
}

export interface UpdateReleasePayload extends UpdateTrackPayload {}
