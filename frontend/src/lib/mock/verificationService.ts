import type { ArtistProfile, ArtistVerificationRequest } from '../../types/artist'
import { ROLES } from '../constants/roles'
import { adminVerificationDetailPath } from '../constants/routes'
import { createNotification } from './notificationService'
import { storage } from './storage'

const VERIFICATION_REQUESTS_KEY = 'verification_requests'
const USERS_KEY = 'users'
const ARTIST_PROFILES_KEY = 'artist_profiles'

interface StoredUser {
  id: number
  username: string
  email: string
  password: string
  display_name: string
  role: string
  account_status?: 'active' | 'pending_approval'
  subscription_tier?: string
  created_at: string
  updated_at: string
}

function nowIso(): string {
  return new Date().toISOString()
}

function getNextId(items: Array<{ id: number }>): number {
  return items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1
}

export function listPendingRequests(): ArtistVerificationRequest[] {
  const requests = storage.get<ArtistVerificationRequest[]>(VERIFICATION_REQUESTS_KEY) ?? []
  return requests
    .filter((r) => r.verification_status === 'pending')
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function getRequest(id: number): ArtistVerificationRequest | null {
  const requests = storage.get<ArtistVerificationRequest[]>(VERIFICATION_REQUESTS_KEY) ?? []
  return requests.find((r) => r.id === id) ?? null
}

export function approveRequest(id: number): ArtistVerificationRequest {
  const requests = storage.get<ArtistVerificationRequest[]>(VERIFICATION_REQUESTS_KEY) ?? []
  const requestIndex = requests.findIndex((r) => r.id === id)

  if (requestIndex === -1) {
    throw new Error('Verification request not found.')
  }

  const request = requests[requestIndex]
  if (request.verification_status !== 'pending') {
    throw new Error('This request has already been processed.')
  }

  const updatedAt = nowIso()
  const updatedRequest: ArtistVerificationRequest = {
    ...request,
    verification_status: 'approved',
    updated_at: updatedAt,
  }

  const updatedRequests = [...requests]
  updatedRequests[requestIndex] = updatedRequest
  storage.set(VERIFICATION_REQUESTS_KEY, updatedRequests)

  const users = storage.get<StoredUser[]>(USERS_KEY) ?? []
  const userIndex = users.findIndex((u) => u.id === request.user_id)
  if (userIndex !== -1) {
    const updatedUsers = [...users]
    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      account_status: 'active',
      updated_at: updatedAt,
    }
    storage.set(USERS_KEY, updatedUsers)
  }

  const profiles = storage.get<ArtistProfile[]>(ARTIST_PROFILES_KEY) ?? []
  const existingProfile = profiles.find((p) => p.user_id === request.user_id)
  if (!existingProfile) {
    const profile: ArtistProfile = {
      id: getNextId(profiles),
      user_id: request.user_id,
      stage_name: request.stage_name,
      portfolio_links: request.portfolio_links,
      verification_status: 'approved',
      is_verified: true,
      created_at: updatedAt,
      updated_at: updatedAt,
    }
    storage.set(ARTIST_PROFILES_KEY, [...profiles, profile])
  }

  createNotification({
    recipient_id: request.user_id,
    category: 'account_approval',
    title: 'Artist account approved',
    message: `Your artist account "${request.stage_name}" has been approved. You can now log in and access Artist Studio.`,
    link: '/artist/studio',
  })

  return updatedRequest
}

export function rejectRequest(id: number, reason: string): ArtistVerificationRequest {
  const trimmedReason = reason.trim()
  if (!trimmedReason) {
    throw new Error('A rejection reason is required.')
  }

  const requests = storage.get<ArtistVerificationRequest[]>(VERIFICATION_REQUESTS_KEY) ?? []
  const requestIndex = requests.findIndex((r) => r.id === id)

  if (requestIndex === -1) {
    throw new Error('Verification request not found.')
  }

  const request = requests[requestIndex]
  if (request.verification_status !== 'pending') {
    throw new Error('This request has already been processed.')
  }

  const updatedAt = nowIso()
  const updatedRequest: ArtistVerificationRequest = {
    ...request,
    verification_status: 'rejected',
    rejection_reason: trimmedReason,
    updated_at: updatedAt,
  }

  const updatedRequests = [...requests]
  updatedRequests[requestIndex] = updatedRequest
  storage.set(VERIFICATION_REQUESTS_KEY, updatedRequests)

  createNotification({
    recipient_id: request.user_id,
    category: 'account_rejection',
    title: 'Artist account rejected',
    message: `Your artist account request was rejected. Reason: ${trimmedReason}`,
    link: adminVerificationDetailPath(id),
  })

  return updatedRequest
}

export function listAllRequests(): ArtistVerificationRequest[] {
  const requests = storage.get<ArtistVerificationRequest[]>(VERIFICATION_REQUESTS_KEY) ?? []
  return requests.sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function notifyStaffOfNewRequest(request: ArtistVerificationRequest): void {
  const users = storage.get<StoredUser[]>(USERS_KEY) ?? []
  const staffUsers = users.filter(
    (u) => u.role === ROLES.SUPPORT || u.role === ROLES.ADMIN,
  )

  for (const staff of staffUsers) {
    createNotification({
      recipient_id: staff.id,
      category: 'artist_verification_request',
      title: 'New artist verification request',
      message: `${request.stage_name} (${request.email}) submitted a verification request.`,
      link: adminVerificationDetailPath(request.id),
    })
  }
}
