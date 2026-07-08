import { beforeEach, describe, expect, it } from 'vitest'
import { ROLES } from '../constants/roles'
import { storage } from './storage'
import {
  getUserProfileView,
  getManageProfile,
  removeFollower,
  unfollowAccount,
  updateUserProfile,
} from './userProfileService'

describe('userProfileService', () => {
  beforeEach(() => {
    localStorage.clear()
    storage.set('users', [
      {
        id: 1,
        username: 'listener',
        email: 'listener@example.com',
        password: 'password123',
        display_name: 'Listener',
        role: ROLES.LISTENER,
        birth_date: '2000-01-01',
        gender: 'prefer_not_to_say',
        profile_picture: null,
        subscription_tier: 'basic',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        username: 'follower',
        email: 'follower@example.com',
        password: 'password123',
        display_name: 'Follower Friend',
        role: ROLES.LISTENER,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 3,
        username: 'following',
        email: 'following@example.com',
        password: 'password123',
        display_name: 'Following Friend',
        role: ROLES.LISTENER,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 4,
        username: 'silver_listener',
        email: 'silver@example.com',
        password: 'password123',
        display_name: 'Silver Listener',
        role: ROLES.LISTENER,
        profile_picture: null,
        subscription_tier: 'silver',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ])
    storage.set('daily_streams', { 1: 37 })
    storage.set('follows', [
      {
        id: 1,
        follower_id: 2,
        followed_id: 1,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        follower_id: 1,
        followed_id: 3,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 3,
        follower_id: 1,
        followed_id: 1,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ])
  })

  it('loads profile details with daily stream statistics and non-self relationships', () => {
    const profile = getManageProfile(1)

    expect(profile.user.username).toBe('listener')
    expect(profile.daily_streams_count).toBe(37)
    expect(profile.user.followers_count).toBe(1)
    expect(profile.user.following_count).toBe(1)
    expect(profile.followers[0].display_name).toBe('Follower Friend')
    expect(profile.following[0].display_name).toBe('Following Friend')
  })

  it('loads read-only profile followers and following lists', () => {
    const profile = getUserProfileView(2, 'listener')

    expect(profile.followers).toHaveLength(1)
    expect(profile.following).toHaveLength(1)
  })

  it('loads read-only profile details by numeric user id route value', () => {
    const profile = getUserProfileView(1, '2')

    expect(profile.user.username).toBe('follower')
    expect(profile.user.id).toBe(2)
  })

  it('removes a follower relationship', () => {
    const profile = removeFollower(1, 2)

    expect(profile.followers).toHaveLength(0)
    expect(profile.following).toHaveLength(1)
  })

  it('removes a following relationship', () => {
    const profile = unfollowAccount(1, 3)

    expect(profile.following).toHaveLength(0)
    expect(profile.followers).toHaveLength(1)
  })

  it('updates editable personal information', () => {
    const updatedUser = updateUserProfile(1, {
      display_name: 'Updated Listener',
      birth_date: '1999-09-09',
      gender: 'other',
    })

    expect(updatedUser.display_name).toBe('Updated Listener')
    expect(updatedUser.birth_date).toBe('1999-09-09')
    expect(updatedUser.gender).toBe('other')
  })

  it('prevents Basic subscribers from changing profile pictures', () => {
    updateUserProfile(1, { profile_picture: 'https://example.com/avatar.png' })

    expect(getManageProfile(1).user.profile_picture).toBeNull()
  })

  it('allows non-Basic subscribers to change profile pictures', () => {
    updateUserProfile(4, { profile_picture: 'data:image/png;base64,avatar' })

    expect(getManageProfile(4).user.profile_picture).toBe(
      'data:image/png;base64,avatar',
    )
  })
})
