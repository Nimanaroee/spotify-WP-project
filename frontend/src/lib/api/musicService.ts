import { isAxiosError } from 'axios'
import type { PublishReleasePayload, Track, UpdateTrackPayload } from '../../types/music'
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
    
    // Attempt to extract validation errors
    if (error.response?.data && typeof error.response.data === 'object') {
      const firstError = Object.values(error.response.data)[0];
      if (Array.isArray(firstError) && typeof firstError[0] === 'string') {
        return firstError[0];
      }
    }
  }
  return fallback
}

export async function listArtistReleases(artistId?: number): Promise<Track[]> {
  try {
    const response = await client.get<PaginatedResponse<Track>>('/music/artist/releases/')
    return response.data.results
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to load releases.'))
  }
}

export async function publishRelease(
  artistId: number,
  stageName: string,
  payload: PublishReleasePayload
): Promise<Track[]> {
  const formData = new FormData()

  formData.append('release_type', payload.release_type)
  formData.append('title', payload.title)
  if (payload.genre) formData.append('genre', payload.genre)
  if (payload.release_year) formData.append('release_year', payload.release_year.toString())
  
  if (payload.co_artists && payload.co_artists.length > 0) {
    payload.co_artists.forEach((artist) => formData.append('co_artists', artist))
  }

  if (payload.cover_art instanceof File) {
    formData.append('cover_art', payload.cover_art)
  }

  payload.tracks.forEach((track, index) => {
    formData.append(`tracks[${index}][title]`, track.title)
    if (track.audio_file instanceof File) {
      formData.append(`tracks[${index}][audio_file]`, track.audio_file)
    }
    if (track.lyrics) {
      formData.append(`tracks[${index}][lyrics]`, track.lyrics)
    }
    if (track.duration_seconds) {
      formData.append(`tracks[${index}][duration_seconds]`, track.duration_seconds.toString())
    }
  })

  try {
    const response = await client.post<Track[]>('/music/artist/releases/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to publish release.'))
  }
}

export async function updateTrack(
  trackId: number,
  artistId: number,
  payload: UpdateTrackPayload
): Promise<Track> {
  const formData = new FormData()

  if (payload.title) formData.append('title', payload.title)
  if (payload.genre) formData.append('genre', payload.genre)
  if (payload.release_year) formData.append('release_year', payload.release_year.toString())
  if (payload.lyrics !== undefined) formData.append('lyrics', payload.lyrics || '')
  
  if (payload.co_artists) {
    payload.co_artists.forEach((artist) => formData.append('co_artists', artist))
  }

  if (payload.cover_art instanceof File) formData.append('cover_art', payload.cover_art)
  if (payload.audio_url instanceof File) formData.append('audio_file', payload.audio_url)

  try {
    const response = await client.patch<Track>(`/music/artist/releases/${trackId}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to update track.'))
  }
}

export async function deleteTrack(trackId: number, artistId: number): Promise<void> {
  try {
    await client.delete(`/music/artist/releases/${trackId}/`)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to delete track.'))
  }
}