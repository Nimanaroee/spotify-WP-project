import client from './client'
import type { Album, Track, MusicSortField } from '../../types'

export async function searchCatalog(query: string, sortBy: MusicSortField) {
  try {
    const response = await client.get('/music/catalog/search/', { params: { query, sort_by: sortBy } })
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Search failed')
  }
}

export async function getAlbumById(id: number): Promise<{ album: Album; tracks: Track[] }> {
  try {
    const response = await client.get(`/music/albums/${id}/`)
    return { album: response.data, tracks: response.data.tracks || [] }
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Album not found')
  }
}

export async function recordTrackPlay(id: number): Promise<Track> {
  try {
    const response = await client.post(`/music/tracks/${id}/play/`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Playback failed. Early Access or Limit Reached.')
  }
}