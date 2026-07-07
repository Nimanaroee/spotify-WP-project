import type { ArtistProfile, UpdateArtistProfilePayload } from '../../types/artist'
import type { Album, Track } from '../../types/music'
import type { EntityId, User, UserProfileView } from '../../types'
import { ROLES } from '../constants/roles'
import { hydrateAlbum, hydrateTrack } from './hydrateMedia'
import { storage } from './storage'

const ARTIST_PROFILES_KEY = 'artist_profiles'
const USERS_KEY = 'users'
const TRACKS_KEY = 'tracks'
const ALBUMS_KEY = 'albums'

interface ArtistProfileView extends UserProfileView {
  artist_profile: ArtistProfile
  albums: Album[]
  singles: Track[]
  listener_count: number
  total_streams: number
}

interface StoredUser extends User {
  password?: string
}

function nowIso(): string {
  return new Date().toISOString()
}

function readProfiles(): ArtistProfile[] {
  return storage.get<ArtistProfile[]>(ARTIST_PROFILES_KEY) ?? []
}

function writeProfiles(profiles: ArtistProfile[]): void {
  storage.set(ARTIST_PROFILES_KEY, profiles)
}

function readUsers(): StoredUser[] {
  return storage.get<StoredUser[]>(USERS_KEY) ?? []
}

function writeUsers(users: StoredUser[]): void {
  storage.set(USERS_KEY, users)
}

function readTracks(): Track[] {
  return storage.get<Track[]>(TRACKS_KEY) ?? []
}

function readAlbums(): Album[] {
  return storage.get<Album[]>(ALBUMS_KEY) ?? []
}

function stripPassword(user: StoredUser): User {
  const { password: _password, ...publicUser } = user
  return publicUser
}

function getNextId(items: Array<{ id: number }>): number {
  return items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1
}

export function getProfileByUserId(userId: number): ArtistProfile | null {
  const profiles = readProfiles()
  return profiles.find((profile) => profile.user_id === userId) ?? null
}

export function isVerifiedArtist(userId: number): boolean {
  const profile = getProfileByUserId(userId)
  return profile?.is_verified === true
}

export function ensureArtistProfile(user: User): ArtistProfile {
  const profiles = readProfiles()
  const existingProfile = profiles.find((profile) => profile.user_id === user.id)

  if (existingProfile) {
    return existingProfile
  }

  const createdAt = nowIso()
  const profile: ArtistProfile = {
    id: getNextId(profiles),
    user_id: user.id,
    stage_name: user.display_name,
    bio: '',
    portfolio_links: [],
    verification_status: 'pending',
    is_verified: false,
    listener_count: 0,
    total_streams: 0,
    created_at: createdAt,
    updated_at: createdAt,
  }

  writeProfiles([...profiles, profile])
  return profile
}

export function getArtistProfileView(
  _viewerId: EntityId,
  _username: string,
  baseProfile: UserProfileView,
): ArtistProfileView {
  const artistUser = baseProfile.user

  if (artistUser.role !== ROLES.ARTIST) {
    throw new Error('Artist profile not found.')
  }

  const artistProfile = ensureArtistProfile(artistUser)
  const tracks = readTracks()
    .filter((track) => track.artist_id === artistUser.id)
    .map(hydrateTrack)
  const albums = readAlbums()
    .filter((album) => album.artist_id === artistUser.id)
    .map((album) => hydrateAlbum({
      ...album,
      tracks: tracks.filter((track) => track.album_id === album.id),
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  const singles = tracks
    .filter((track) => track.release_type === 'single')
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  const listenerCount =
    artistProfile.listener_count ??
    tracks.reduce((total, track) => total + (track.listener_count ?? 0), 0)
  const totalStreams =
    artistProfile.total_streams ??
    tracks.reduce((total, track) => total + (track.stream_count ?? 0), 0)

  return {
    ...baseProfile,
    artist_profile: artistProfile,
    albums,
    singles,
    listener_count: listenerCount,
    total_streams: totalStreams,
  }
}

export function getOwnArtistProfileView(
  userId: EntityId,
  baseProfile: UserProfileView,
): ArtistProfileView {
  return getArtistProfileView(userId, baseProfile.user.username, baseProfile)
}

export function updateArtistProfile(
  userId: EntityId,
  payload: UpdateArtistProfilePayload,
): ArtistProfile {
  const users = readUsers()
  const user = users.find((candidate) => candidate.id === userId)

  if (!user || user.role !== ROLES.ARTIST) {
    throw new Error('Artist profile not found.')
  }

  const profiles = readProfiles()
  const existingProfile =
    profiles.find((profile) => profile.user_id === userId) ?? ensureArtistProfile(user)
  const updatedAt = nowIso()
  const stageName = payload.stage_name?.trim() || existingProfile.stage_name
  const nextProfile: ArtistProfile = {
    ...existingProfile,
    stage_name: stageName,
    bio: payload.bio !== undefined ? payload.bio : existingProfile.bio,
    portfolio_links: payload.portfolio_links ?? existingProfile.portfolio_links,
    updated_at: updatedAt,
  }
  const profileExists = profiles.some((profile) => profile.user_id === userId)
  writeProfiles(
    profileExists
      ? profiles.map((profile) => (profile.user_id === userId ? nextProfile : profile))
      : [...profiles, nextProfile],
  )

  const nextUser: StoredUser = {
    ...user,
    display_name: stageName,
    profile_picture:
      payload.profile_picture !== undefined
        ? payload.profile_picture
        : user.profile_picture,
    updated_at: updatedAt,
  }
  writeUsers(users.map((candidate) => (candidate.id === userId ? nextUser : candidate)))
  storage.set('current_user', stripPassword(nextUser))

  return nextProfile
}

export type { ArtistProfileView }
