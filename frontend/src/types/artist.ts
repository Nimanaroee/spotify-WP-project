import type { EntityId, Timestamps } from './common'
import type { UserSummary } from './user'

export type VerificationStatus = 'pending' | 'approved' | 'rejected'

export interface ArtistProfile extends Timestamps {
  id: EntityId
  user_id: EntityId
  user?: UserSummary
  stage_name: string
  bio?: string
  portfolio_links?: string[]
  verification_status: VerificationStatus
  is_verified: boolean
  listener_count?: number
  total_streams?: number
}

export interface ArtistVerificationRequest extends Timestamps {
  id: EntityId
  user_id: EntityId
  stage_name: string
  email: string
  portfolio_links: string[]
  verification_status: VerificationStatus
  rejection_reason?: string
}

export interface RejectArtistPayload {
  reason: string
}

export interface UpdateArtistProfilePayload {
  stage_name?: string
  bio?: string
  portfolio_links?: string[]
}
