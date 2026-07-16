import type { Role } from '../lib/constants/roles'
import type { SubscriptionTier } from '../lib/constants/subscriptionLimits'
import type { EntityId, Timestamps } from './common'

export type Gender = 'male' | 'female'

export interface User extends Timestamps {
  id: EntityId
  username: string
  email: string
  display_name: string
  role: Role
  birth_date?: string
  gender?: Gender
  profile_picture?: string | null
  subscription_tier?: SubscriptionTier
  followers_count?: number
  following_count?: number
  daily_streams_count?: number
}

export interface UserSummary {
  id: EntityId
  display_name: string
  username?: string
  profile_picture?: string | null
  role: Role
}

export interface Follow extends Timestamps {
  id: EntityId
  follower_id: EntityId
  followed_id: EntityId
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterListenerPayload {
  display_name: string
  email: string
  password: string
  password_confirmation: string
  birth_date: string
  gender: Gender
  privacy_policy_accepted: boolean
}

export interface RegisterArtistPayload {
  email: string
  password: string
  password_confirmation: string
  stage_name: string
  portfolio_links: string[]
}

export interface ForgotPasswordPayload {
  email: string
}

export interface UpdateUserProfilePayload {
  display_name?: string
  birth_date?: string
  gender?: Gender
  profile_picture?: string | null
}

export interface ManageProfile {
  user: User
  daily_streams_count: number
  followers: UserSummary[]
  following: UserSummary[]
}

export interface UserProfileView {
  user: User
  daily_streams_count: number
  is_following: boolean
  followers: UserSummary[]
  following: UserSummary[]
}
