import type { EntityId, Timestamps } from './common'
import type { TrackSummary } from './music'

export interface PlaylistSummary {
  id: EntityId
  name: string
  cover_art?: string | null
  track_count?: number
}

export interface Playlist extends PlaylistSummary, Timestamps {
  owner_id: EntityId
  tracks?: TrackSummary[]
}

export interface PlaylistTrack extends Timestamps {
  id: EntityId
  playlist_id: EntityId
  track_id: EntityId
  track?: TrackSummary
  position: number
}

export interface CreatePlaylistPayload {
  name: string
}

export interface RenamePlaylistPayload {
  name: string
}

export interface AddTrackToPlaylistPayload {
  track_id: EntityId
}
