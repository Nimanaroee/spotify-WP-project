import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ROLES } from '../constants/roles'
import client from './client'
import {
  followUsername,
  getManageArtistProfileFromApi,
  getManageProfileFromApi,
  getPublicProfileFromApi,
  unfollowUsername,
  updateManageArtistProfileFromApi,
  updateManageProfileFromApi,
} from './profileService'

vi.mock('./client', () => ({
  ACCESS_TOKEN_KEY: 'auth_access_token',
  default: {
    delete: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}))

describe('profileService', () => {
  beforeEach(() => {
    vi.mocked(client.get).mockReset()
    vi.mocked(client.post).mockReset()
    vi.mocked(client.delete).mockReset()
    vi.mocked(client.patch).mockReset()
  })

  it('loads and maps another user profile by username', async () => {
    vi.mocked(client.get).mockResolvedValue({
      data: {
        user_name: 'other_user',
        display_name: 'Other User',
        bearth_date: '2000-01-02',
        gender: 'female',
        num_following: 1,
        num_follower: 2,
        streamed_today: 9,
        subscription: 'silver',
        profile_photo: null,
        role: ROLES.LISTENER,
        is_following: true,
        followers: [
          {
            display_name: 'Follower',
            username: 'follower',
            avatar: null,
          },
        ],
        followings: [
          {
            display_name: 'Following',
            username: 'following',
            avatar: null,
          },
        ],
        artist_profile: null,
        albums: [],
        singles: [],
      },
    })

    const profile = await getPublicProfileFromApi('other_user')

    expect(client.get).toHaveBeenCalledWith('/users/profiles/other_user/')
    expect(profile.user.username).toBe('other_user')
    expect(profile.user.display_name).toBe('Other User')
    expect(profile.user.followers_count).toBe(2)
    expect(profile.daily_streams_count).toBe(9)
    expect(profile.is_following).toBe(true)
    expect(profile.followers[0].username).toBe('follower')
    expect(profile.following[0].username).toBe('following')
  })

  it('loads the listener manage profile from the listener endpoint', async () => {
    vi.mocked(client.get).mockResolvedValue({
      data: {
        user_name: 'listener',
        display_name: 'Listener',
        bearth_date: null,
        gender: null,
        num_following: 0,
        num_follower: 0,
        streamed_today: 0,
        subscription: 'basic',
        profile_photo: null,
        followers: [],
        followings: [],
      },
    })

    await getManageProfileFromApi({
      id: 1,
      username: 'listener',
      email: 'listener@example.com',
      display_name: 'Listener',
      role: ROLES.LISTENER,
      created_at: '',
    })

    expect(client.get).toHaveBeenCalledWith('/users/profile/listener/')
  })

  it('updates the listener manage profile at the listener endpoint', async () => {
    vi.mocked(client.patch).mockResolvedValue({
      data: {
        user_name: 'listener',
        display_name: 'Updated Listener',
        bearth_date: null,
        gender: null,
        num_following: 0,
        num_follower: 0,
        streamed_today: 0,
        subscription: 'basic',
        profile_photo: null,
        followers: [],
        followings: [],
      },
    })

    await updateManageProfileFromApi(
      {
        id: 1,
        username: 'listener',
        email: 'listener@example.com',
        display_name: 'Listener',
        role: ROLES.LISTENER,
        created_at: '',
      },
      { display_name: 'Updated Listener' },
    )

    expect(client.patch).toHaveBeenCalledWith('/users/profile/listener/', {
      display_name: 'Updated Listener',
      gender: undefined,
      bearth_date: null,
      profile_photo: undefined,
    })
  })

  it('loads the artist manage profile from the artist endpoint', async () => {
    vi.mocked(client.get).mockResolvedValue({
      data: {
        user_name: 'artist',
        display_name: 'Artist',
        bearth_date: null,
        gender: null,
        num_following: 0,
        num_follower: 0,
        streamed_today: 0,
        subscription: 'basic',
        profile_photo: null,
        role: ROLES.ARTIST,
        is_following: false,
        followers: [],
        followings: [],
        artist_profile: {
          stage_name: 'Artist',
          bio: 'Biography.',
          verification_status: 'approved',
          is_verified: true,
          listener_count: 10,
          total_streams: 50,
        },
        albums: [],
        singles: [],
      },
    })

    const profile = await getManageArtistProfileFromApi()

    expect(client.get).toHaveBeenCalledWith('/users/profile/artist/')
    expect(profile.artist_profile.stage_name).toBe('Artist')
  })

  it('updates the artist manage profile at the artist endpoint', async () => {
    vi.mocked(client.patch).mockResolvedValue({
      data: {
        user_name: 'artist',
        display_name: 'Updated Artist',
        bearth_date: null,
        gender: null,
        num_following: 0,
        num_follower: 0,
        streamed_today: 0,
        subscription: 'basic',
        profile_photo: null,
        role: ROLES.ARTIST,
        is_following: false,
        followers: [],
        followings: [],
        artist_profile: {
          stage_name: 'Updated Artist',
          bio: 'Updated biography.',
          verification_status: 'approved',
          is_verified: true,
          listener_count: 10,
          total_streams: 50,
        },
        albums: [],
        singles: [],
      },
    })

    const profile = await updateManageArtistProfileFromApi(
      'Updated Artist',
      'Updated biography.',
    )

    expect(client.patch).toHaveBeenCalledWith('/users/profile/artist/', {
      stage_name: 'Updated Artist',
      bio: 'Updated biography.',
    })
    expect(profile.artist_profile.bio).toBe('Updated biography.')
  })

  it('maps artist-specific profile fields', async () => {
    vi.mocked(client.get).mockResolvedValue({
      data: {
        user_name: 'demo_artist',
        display_name: 'Demo Artist',
        bearth_date: null,
        gender: null,
        num_following: 0,
        num_follower: 0,
        streamed_today: 0,
        subscription: 'basic',
        profile_photo: null,
        role: ROLES.ARTIST,
        is_following: false,
        followers: [],
        followings: [],
        artist_profile: {
          stage_name: 'Neon Artist',
          bio: 'Synth pop from Tehran.',
          verification_status: 'approved',
          is_verified: true,
          listener_count: 240,
          total_streams: 1200,
        },
        albums: [],
        singles: [],
      },
    })

    const profile = await getPublicProfileFromApi('demo_artist')

    expect('artist_profile' in profile).toBe(true)
    if ('artist_profile' in profile) {
      expect(profile.artist_profile.stage_name).toBe('Neon Artist')
      expect(profile.artist_profile.is_verified).toBe(true)
      expect(profile.listener_count).toBe(240)
      expect(profile.total_streams).toBe(1200)
    }
  })

  it('follows one username with POST', async () => {
    vi.mocked(client.post).mockResolvedValue({
      data: {
        user: {
          display_name: 'Other User',
          username: 'other_user',
          avatar: null,
        },
        is_following: true,
      },
    })

    const result = await followUsername('other_user')

    expect(client.post).toHaveBeenCalledWith('/users/follows/other_user/')
    expect(result.is_following).toBe(true)
    expect(result.user.username).toBe('other_user')
  })

  it('unfollows one username with DELETE', async () => {
    vi.mocked(client.delete).mockResolvedValue({
      data: {
        user: {
          display_name: 'Other User',
          username: 'other_user',
          avatar: null,
        },
        is_following: false,
      },
    })

    const result = await unfollowUsername('other_user')

    expect(client.delete).toHaveBeenCalledWith('/users/follows/other_user/')
    expect(result.is_following).toBe(false)
  })
})
