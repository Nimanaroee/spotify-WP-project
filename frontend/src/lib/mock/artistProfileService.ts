import type { ArtistProfile } from '../../types/artist'
import { storage } from './storage'

const ARTIST_PROFILES_KEY = 'artist_profiles'

export function getProfileByUserId(userId: number): ArtistProfile | null {
  const profiles = storage.get<ArtistProfile[]>(ARTIST_PROFILES_KEY) ?? []
  return profiles.find((profile) => profile.user_id === userId) ?? null
}

export function isVerifiedArtist(userId: number): boolean {
  const profile = getProfileByUserId(userId)
  return profile?.is_verified === true
}
