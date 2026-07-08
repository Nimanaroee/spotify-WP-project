import { SUBSCRIPTION_LIMITS } from '../constants/subscriptionLimits'
import type {
  EntityId,
  Follow,
  ManageProfile,
  UpdateUserProfilePayload,
  User,
  UserSummary,
  UserProfileView,
} from '../../types'
import { storage } from './storage'

const USERS_KEY = 'users'
const FOLLOWS_KEY = 'follows'
const DAILY_STREAMS_KEY = 'daily_streams'

interface StoredUser extends User {
  password?: string
}

function nowIso(): string {
  return new Date().toISOString()
}

function readUsers(): StoredUser[] {
  return storage.get<StoredUser[]>(USERS_KEY) ?? []
}

function writeUsers(users: StoredUser[]): void {
  storage.set(USERS_KEY, users)
}

function readFollows(): Follow[] {
  return storage.get<Follow[]>(FOLLOWS_KEY) ?? []
}

function writeFollows(follows: Follow[]): void {
  storage.set(FOLLOWS_KEY, follows)
}

function stripPassword(user: StoredUser): User {
  const { password, ...publicUser } = user
  void password
  return publicUser
}

export function getUserById(userId: EntityId): User | null {
  const user = readUsers().find((candidate) => candidate.id === userId)

  return user ? stripPassword(user) : null
}

function toUserSummary(user: StoredUser): UserSummary {
  return {
    id: user.id,
    display_name: user.display_name,
    username: user.username,
    profile_picture: user.profile_picture,
    role: user.role,
  }
}

function getFollowerSummaries(
  userId: EntityId,
  follows: Follow[],
  users: StoredUser[],
): UserSummary[] {
  const followerIds = follows
    .filter((follow) => follow.followed_id === userId && follow.follower_id !== userId)
    .map((follow) => follow.follower_id)

  return users
    .filter((user) => followerIds.includes(user.id))
    .map((user) => toUserSummary(user))
}

function getFollowingSummaries(
  userId: EntityId,
  follows: Follow[],
  users: StoredUser[],
): UserSummary[] {
  const followingIds = follows
    .filter((follow) => follow.follower_id === userId && follow.followed_id !== userId)
    .map((follow) => follow.followed_id)

  return users
    .filter((user) => followingIds.includes(user.id))
    .map((user) => toUserSummary(user))
}

function isFollowing(userId: EntityId, targetUserId: EntityId, follows: Follow[]): boolean {
  return follows.some(
    (follow) => follow.follower_id === userId && follow.followed_id === targetUserId,
  )
}

export function getManageProfile(userId: EntityId): ManageProfile {
  const users = readUsers()
  const user = users.find((candidate) => candidate.id === userId)

  if (!user) {
    throw new Error('Profile not found.')
  }

  const follows = readFollows()
  const followers = getFollowerSummaries(userId, follows, users)
  const following = getFollowingSummaries(userId, follows, users)
  const dailyStreams = storage.get<Record<number, number>>(DAILY_STREAMS_KEY) ?? {}
  const dailyStreamsCount = dailyStreams[userId] ?? user.daily_streams_count ?? 0

  return {
    user: {
      ...stripPassword(user),
      followers_count: followers.length,
      following_count: following.length,
      daily_streams_count: dailyStreamsCount,
    },
    daily_streams_count: dailyStreamsCount,
    followers,
    following,
  }
}

export function getUserProfileView(
  viewerId: EntityId,
  username: string,
): UserProfileView {
  const users = readUsers()
  const userId = Number(username)
  const user = users.find((candidate) =>
    Number.isInteger(userId) && String(userId) === username
      ? candidate.id === userId
      : candidate.username === username,
  )

  if (!user) {
    throw new Error('Profile not found.')
  }

  const follows = readFollows()
  const dailyStreams = storage.get<Record<number, number>>(DAILY_STREAMS_KEY) ?? {}

  return {
    user: stripPassword(user),
    daily_streams_count: dailyStreams[user.id] ?? user.daily_streams_count ?? 0,
    is_following: isFollowing(viewerId, user.id, follows),
    followers: getFollowerSummaries(user.id, follows, users),
    following: getFollowingSummaries(user.id, follows, users),
  }
}

export function removeFollower(
  userId: EntityId,
  followerId: EntityId,
): ManageProfile {
  const follows = readFollows()
  writeFollows(
    follows.filter(
      (follow) => !(follow.follower_id === followerId && follow.followed_id === userId),
    ),
  )

  return getManageProfile(userId)
}

export function unfollowAccount(
  userId: EntityId,
  followedId: EntityId,
): ManageProfile {
  const follows = readFollows()
  writeFollows(
    follows.filter(
      (follow) => !(follow.follower_id === userId && follow.followed_id === followedId),
    ),
  )
  return getManageProfile(userId)
}

export function followAccount(
  userId: EntityId,
  followedId: EntityId,
): UserProfileView {
  const follows = readFollows()
  const followedUser = readUsers().find((candidate) => candidate.id === followedId)

  if (!followedUser) {
    throw new Error('Profile not found.')
  }

  if (isFollowing(userId, followedId, follows)) {
    return getUserProfileView(userId, followedUser.username)
  }

  const createdAt = nowIso()
  const nextId = follows.reduce((maxId, follow) => Math.max(maxId, follow.id), 0) + 1

  writeFollows([
    ...follows,
    {
      id: nextId,
      follower_id: userId,
      followed_id: followedId,
      created_at: createdAt,
      updated_at: createdAt,
    },
  ])

  return getUserProfileView(userId, followedUser.username)
}

export function updateUserProfile(
  userId: EntityId,
  payload: UpdateUserProfilePayload,
): User {
  const users = readUsers()
  const user = users.find((candidate) => candidate.id === userId)

  if (!user) {
    throw new Error('Profile not found.')
  }

  const subscriptionTier = user.subscription_tier ?? 'basic'
  const canUpdateProfilePicture = SUBSCRIPTION_LIMITS[subscriptionTier].profilePicture
  const nextUser: StoredUser = {
    ...user,
    display_name: payload.display_name?.trim() || user.display_name,
    birth_date: payload.birth_date ?? user.birth_date,
    gender: payload.gender ?? user.gender,
    profile_picture: canUpdateProfilePicture
      ? payload.profile_picture ?? user.profile_picture
      : user.profile_picture,
    updated_at: nowIso(),
  }

  writeUsers(users.map((candidate) => (candidate.id === userId ? nextUser : candidate)))
  return stripPassword(nextUser)
}
