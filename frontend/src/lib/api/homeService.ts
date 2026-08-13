import client from './client'
import type { Album, PlaylistSummary, Track } from '../../types'

export interface HomeDataResponse {
  recent_playlists: PlaylistSummary[]
  latest_albums: Album[]
  top_songs: Track[]
  latest_releases: Track[]
  early_access: Track[]
  recommended_tracks: Track[]
}

export async function getHomeData(): Promise<HomeDataResponse> {
  try {
    const response = await client.get<HomeDataResponse>('/music/catalog/home/')
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to load home data')
  }
}