import { isAxiosError } from 'axios'

import { ROLES } from '../constants/roles'
import type {
  Album,
  ArtistProfile,
  ManageProfile,
  Track,
  UpdateUserProfilePayload,
  User,
  UserProfileView,
  UserSummary,
} from '../../types'
import client, { ACCESS_TOKEN_KEY } from './client'

interface UserShortInfoResponse {
  display_name: string
  username: string
  avatar: string | null
}

export interface FollowStatus {
  user: UserSummary
  is_following: boolean
}

interface FollowStatusResponse {
  user: UserShortInfoResponse
  is_following: boolean
}

interface ProfileResponse {
  user_name: string
  display_name: string
  bearth_date: string | null
  gender: User['gender'] | null
  num_following: number
  num_follower: number
  streamed_today: number
  subscription: NonNullable<User['subscription_tier']>
  profile_photo: string | null
  followings: UserShortInfoResponse[]
  followers: UserShortInfoResponse[]
}

interface PublicArtistProfileResponse {
  stage_name: string
  bio: string
  verification_status: ArtistProfile['verification_status']
  is_verified: boolean
  listener_count: number
  total_streams: number
}

interface PublicProfileResponse extends ProfileResponse {
  role: User['role']
  is_following: boolean
  artist_profile: PublicArtistProfileResponse | null
  albums: Album[]
  singles: Track[]
}

export interface PublicArtistProfileView extends UserProfileView {
  artist_profile: ArtistProfile
  albums: Album[]
  singles: Track[]
  listener_count: number
  total_streams: number
}

export type PublicProfileView = UserProfileView | PublicArtistProfileView

interface ArtistProfileUpdateRequest {
  stage_name?: string
  bio?: string
  profile_photo?: File | null
}

interface ProfileUpdateRequest {
  display_name?: string
  gender?: User['gender']
  bearth_date?: string | null
  profile_photo?: File | null
}

function getApiErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') {
      return detail
    }
  }
  return 'Unable to load or update the profile.'
}

function usernameToId(username: string): number {
  return Array.from(username).reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
    0,
  )
}

function toUserSummary(user: UserShortInfoResponse): UserSummary {
  return {
    id: usernameToId(user.username),
    display_name: user.display_name,
    username: user.username,
    profile_picture: user.avatar,
    role: ROLES.LISTENER,
  }
}

function toFollowStatus(response: FollowStatusResponse): FollowStatus {
  return {
    user: toUserSummary(response.user),
    is_following: response.is_following,
  }
}

function toManageProfile(
  response: ProfileResponse,
  currentUser: User,
): ManageProfile {
  return {
    user: {
      ...currentUser,
      username: response.user_name,
      display_name: response.display_name,
      birth_date: response.bearth_date ?? undefined,
      gender: response.gender ?? undefined,
      profile_picture: response.profile_photo,
      subscription_tier: response.subscription,
      followers_count: response.num_follower,
      following_count: response.num_following,
      daily_streams_count: response.streamed_today,
    },
    daily_streams_count: response.streamed_today,
    followers: response.followers.map(toUserSummary),
    following: response.followings.map(toUserSummary),
  }
}

function toPublicProfile(
  response: PublicProfileResponse,
): PublicProfileView {
  const userId = usernameToId(response.user_name)
  const baseProfile: UserProfileView = {
    user: {
      id: userId,
      username: response.user_name,
      email: '',
      display_name: response.display_name,
      role: response.role,
      birth_date: response.bearth_date ?? undefined,
      gender: response.gender ?? undefined,
      profile_picture: response.profile_photo,
      subscription_tier: response.subscription,
      followers_count: response.num_follower,
      following_count: response.num_following,
      daily_streams_count: response.streamed_today,
      created_at: '',
    },
    daily_streams_count: response.streamed_today,
    is_following: response.is_following,
    followers: response.followers.map(toUserSummary),
    following: response.followings.map(toUserSummary),
  }

  if (!response.artist_profile) {
    return baseProfile
  }

  return {
    ...baseProfile,
    artist_profile: {
      id: userId,
      user_id: userId,
      stage_name: response.artist_profile.stage_name,
      bio: response.artist_profile.bio,
      verification_status: response.artist_profile.verification_status,
      is_verified: response.artist_profile.is_verified,
      listener_count: response.artist_profile.listener_count,
      total_streams: response.artist_profile.total_streams,
      created_at: '',
    },
    albums: response.albums,
    singles: response.singles,
    listener_count: response.artist_profile.listener_count,
    total_streams: response.artist_profile.total_streams,
  }
}

function toFormData(payload: ProfileUpdateRequest): FormData {
  const formData = new FormData()

  if (payload.display_name !== undefined) {
    formData.append('display_name', payload.display_name)
  }
  if (payload.gender !== undefined) {
    formData.append('gender', payload.gender)
  }
  if (payload.bearth_date !== undefined) {
    formData.append('bearth_date', payload.bearth_date ?? '')
  }
  if (payload.profile_photo instanceof File) {
    formData.append('profile_photo', payload.profile_photo)
  }
  return formData
}

function toArtistFormData(payload: ArtistProfileUpdateRequest): FormData {
  const formData = new FormData()

  if (payload.stage_name !== undefined) {
    formData.append('stage_name', payload.stage_name)
  }
  if (payload.bio !== undefined) {
    formData.append('bio', payload.bio)
  }
  if (payload.profile_photo instanceof File) {
    formData.append('profile_photo', payload.profile_photo)
  }
  return formData
}

export function hasProfileApiSession(): boolean {
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY))
}

export async function getManageProfileFromApi(
  currentUser: User,
): Promise<ManageProfile> {
  try {
    const response = await client.get<ProfileResponse>(
      '/users/profile/listener/',
    )
    return toManageProfile(response.data, currentUser)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function getManageArtistProfileFromApi(): Promise<PublicArtistProfileView> {
  try {
    const response = await client.get<PublicProfileResponse>(
      '/users/profile/artist/',
    )
    const profile = toPublicProfile(response.data)
    if (!('artist_profile' in profile)) {
      throw new Error('Artist profile not found.')
    }
    return profile
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function getPublicProfileFromApi(
  username: string,
): Promise<PublicProfileView> {
  try {
    const response = await client.get<PublicProfileResponse>(
      `/users/profiles/${encodeURIComponent(username)}/`,
    )
    return toPublicProfile(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function followUsername(username: string): Promise<FollowStatus> {
  try {
    const response = await client.post<FollowStatusResponse>(
      `/users/follows/${encodeURIComponent(username)}/`,
    )
    return toFollowStatus(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function unfollowUsername(
  username: string,
): Promise<FollowStatus> {
  try {
    const response = await client.delete<FollowStatusResponse>(
      `/users/follows/${encodeURIComponent(username)}/`,
    )
    return toFollowStatus(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function updateManageProfileFromApi(
  currentUser: User,
  payload: UpdateUserProfilePayload,
  profilePhoto?: File | null,
): Promise<ManageProfile> {
  const request: ProfileUpdateRequest = {
    display_name: payload.display_name,
    gender: payload.gender,
    bearth_date: payload.birth_date ?? null,
    profile_photo: profilePhoto,
  }

  try {
    const response = await client.patch<ProfileResponse>(
      '/users/profile/listener/',
      profilePhoto ? toFormData(request) : request,
    )
    return toManageProfile(response.data, currentUser)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function updateManageArtistProfileFromApi(
  stageName: string,
  bio: string,
  profilePhoto?: File | null,
): Promise<PublicArtistProfileView> {
  const request: ArtistProfileUpdateRequest = {
    stage_name: stageName,
    bio,
    ...(profilePhoto ? { profile_photo: profilePhoto } : {}),
  }

  try {
    const response = await client.patch<PublicProfileResponse>(
      '/users/profile/artist/',
      profilePhoto ? toArtistFormData(request) : request,
    )
    const profile = toPublicProfile(response.data)
    if (!('artist_profile' in profile)) {
      throw new Error('Artist profile not found.')
    }
    return profile
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}
