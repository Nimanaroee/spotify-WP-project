import { isAxiosError } from 'axios'
import type { Playlist } from '../../types'
import client from './client'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    
    if (error.response?.data && typeof error.response.data === 'object') {
      const firstError = Object.values(error.response.data)[0];
      if (Array.isArray(firstError) && typeof firstError[0] === 'string') {
        return firstError[0];
      }
    }
  }
  return fallback
}

export async function getUserPlaylists(): Promise<Playlist[]> {
  try {
    // The backend paginates ModelViewSets by default. 
    // For playlists, we'll extract the results array.
    const response = await client.get<PaginatedResponse<Playlist>>('/music/playlists/')
    return response.data.results
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to load playlists.'))
  }
}

export async function createPlaylist(name: string): Promise<Playlist> {
  try {
    const response = await client.post<Playlist>('/music/playlists/', { name })
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to create playlist.'))
  }
}

export async function renamePlaylist(playlistId: number, name: string): Promise<Playlist> {
  try {
    const response = await client.patch<Playlist>(`/music/playlists/${playlistId}/`, { name })
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to rename playlist.'))
  }
}

export async function deletePlaylist(playlistId: number): Promise<void> {
  try {
    await client.delete(`/music/playlists/${playlistId}/`)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to delete playlist.'))
  }
}

export async function toggleTrackInPlaylist(
  playlistId: number,
  trackId: number,
  state: boolean
): Promise<Playlist> {
  try {
    const response = await client.post<Playlist>(`/music/playlists/${playlistId}/toggle_track/`, {
      track_id: trackId,
      state,
    })
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to update playlist tracks.'))
  }
}