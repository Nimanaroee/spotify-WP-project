/**
 * UserProfilePage — read-only user profile view
 * Spec reference: §2.3
 *
 * Responsibilities:
 *  - [x] show another user's profile details
 *  - [x] allow follow/unfollow for the viewed user
 *  - [x] redirect self-viewing users to their management page
 */
import { useEffect, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { ROLES } from '../lib/constants/roles'
import { ROUTES } from '../lib/constants/routes'
import {
  followAccount,
  getUserProfileView,
  unfollowAccount,
} from '../lib/mock/userProfileService'
import { useAuthStore } from '../store/authStore'
import type { UserProfileView } from '../types'

function getProfileInitials(displayName: string): string {
  return displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function UserProfilePage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const authUser = useAuthStore((state) => state.user)
  const isCompactMobile = useMediaQuery('(max-width:767px)')
  const [profile, setProfile] = useState<UserProfileView | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authUser || !username) {
      return
    }

    if (authUser.username === username) {
      navigate(ROUTES.MANAGE, { replace: true })
      return
    }

    try {
      setProfile(getUserProfileView(authUser.id, username))
      setError('')
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Profile not found.')
    }
  }, [authUser, navigate, username])

  if (!authUser) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (authUser.role !== ROLES.LISTENER) {
    return <Navigate to={ROUTES.HOME} replace />
  }

  if (error) {
    return (
      <Box className="min-h-screen p-6" sx={{ bgcolor: 'background.default' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!profile) {
    return null
  }

  const currentAuthUser = authUser
  const currentProfile = profile
  const statsGridColumns = isCompactMobile ? 'repeat(3, minmax(0, 1fr))' : 'repeat(3, 1fr)'
  const statsCardPadding = isCompactMobile ? 1.25 : 2
  const statsLabelSize = isCompactMobile ? '0.68rem' : '0.875rem'
  const statsValueSize = isCompactMobile ? '1rem' : '1.5rem'
  const listHeight = isCompactMobile ? 260 : 320
  const listPadding = isCompactMobile ? 1 : 2
  const listSpacing = isCompactMobile ? 0.75 : 1
  const listGap = isCompactMobile ? 1 : 1.5
  const listAvatarSize = isCompactMobile ? 30 : 40
  const listTitleSize = isCompactMobile ? '0.82rem' : '1rem'
  const listSubtitleSize = isCompactMobile ? '0.68rem' : '0.875rem'

  function handleToggleFollow(): void {
    if (!currentAuthUser || !currentProfile) {
      return
    }

    if (currentProfile.is_following) {
      unfollowAccount(currentAuthUser.id, currentProfile.user.id)
    } else {
      followAccount(currentAuthUser.id, currentProfile.user.id)
    }

    setProfile(getUserProfileView(currentAuthUser.id, currentProfile.user.username))
  }

  const subscriptionTier = profile.user.subscription_tier ?? 'basic'

  return (
    <Box className="min-h-screen p-4 md:p-8" sx={{ bgcolor: 'background.default' }}>
      <Paper className="mx-auto max-w-4xl p-5 md:p-8">
        <Stack spacing={3}>
          <Stack
            spacing={3}
            sx={{
              alignItems: { xs: 'flex-start', md: 'center' },
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ alignItems: 'center', display: 'flex', gap: { xs: 1.5, md: 2.5 } }}>
              <Avatar
                alt={`Profile picture for ${profile.user.display_name}`}
                src={profile.user.profile_picture ?? undefined}
                sx={{ height: { xs: 72, md: 88 }, width: { xs: 72, md: 88 }, bgcolor: 'primary.main', fontSize: { xs: 24, md: 28 } }}
              >
                {getProfileInitials(profile.user.display_name)}
              </Avatar>
              <Box>
                <Typography component="h1" variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                  {profile.user.display_name}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: { xs: '0.85rem', md: '1rem' } }}>
                  @{profile.user.username}
                </Typography>
                <Chip
                  sx={{ mt: 1 }}
                  color={subscriptionTier === 'gold' ? 'warning' : 'primary'}
                  label={`${subscriptionTier.toUpperCase()} subscription`}
                  variant={subscriptionTier === 'basic' ? 'outlined' : 'filled'}
                />
              </Box>
            </Box>
            <Box sx={{ width: { xs: '100%', md: 'auto' }, display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Button
                color={profile.is_following ? 'inherit' : 'primary'}
                onClick={handleToggleFollow}
                size="small"
                variant={profile.is_following ? 'outlined' : 'contained'}
              >
                {profile.is_following ? 'Unfollow' : 'Follow'}
              </Button>
            </Box>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: statsGridColumns,
            }}
          >
            <Paper variant="outlined" sx={{ p: statsCardPadding }}>
              <Typography color="text.secondary" variant="body2" sx={{ fontSize: statsLabelSize }}>
                Followers
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: statsValueSize }}>
                {profile.user.followers_count ?? 0}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: statsCardPadding }}>
              <Typography color="text.secondary" variant="body2" sx={{ fontSize: statsLabelSize }}>
                Following
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: statsValueSize }}>
                {profile.user.following_count ?? 0}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: statsCardPadding }}>
              <Typography color="text.secondary" variant="body2" sx={{ fontSize: statsLabelSize }}>
                Streamed today
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: statsValueSize }}>
                {profile.daily_streams_count}
              </Typography>
            </Paper>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            }}
          >
              <Paper variant="outlined" className="p-4">
                <Typography color="text.secondary" variant="body2">
                  Birth date
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {profile.user.birth_date ?? 'Not set'}
                </Typography>
              </Paper>
              <Paper variant="outlined" className="p-4">
                <Typography color="text.secondary" variant="body2">
                  Gender
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {profile.user.gender ?? 'Not set'}
                </Typography>
              </Paper>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              }}
            >
              <Box>
                <Typography component="h2" variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Followers
                </Typography>
                <Paper variant="outlined">
                  <Box
                    role="list"
                    sx={{
                      height: listHeight,
                      maxHeight: listHeight,
                      overflowY: 'auto',
                      p: listPadding,
                    }}
                  >
                    {profile.followers.length > 0 ? (
                      <Stack spacing={listSpacing}>
                        {profile.followers.map((account) => (
                          <Box
                            key={account.id}
                            role="listitem"
                            sx={{
                              alignItems: 'center',
                              border: 1,
                              borderColor: 'divider',
                              borderRadius: 2,
                              display: 'flex',
                              gap: listGap,
                              p: isCompactMobile ? 1 : 1.5,
                            }}
                          >
                            <Avatar
                              alt={`Profile picture for ${account.display_name}`}
                              src={account.profile_picture ?? undefined}
                              sx={{ bgcolor: 'primary.main', height: listAvatarSize, width: listAvatarSize }}
                            >
                              {getProfileInitials(account.display_name)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: listTitleSize }}>
                                {account.display_name}
                              </Typography>
                              <Typography color="text.secondary" variant="body2" sx={{ fontSize: listSubtitleSize }}>
                                @{account.username}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                        No followers to show.
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Box>
              <Box>
                <Typography component="h2" variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Following
                </Typography>
                <Paper variant="outlined">
                  <Box
                    role="list"
                    sx={{
                      height: listHeight,
                      maxHeight: listHeight,
                      overflowY: 'auto',
                      p: listPadding,
                    }}
                  >
                    {profile.following.length > 0 ? (
                      <Stack spacing={listSpacing}>
                        {profile.following.map((account) => (
                          <Box
                            key={account.id}
                            role="listitem"
                            sx={{
                              alignItems: 'center',
                              border: 1,
                              borderColor: 'divider',
                              borderRadius: 2,
                              display: 'flex',
                              gap: listGap,
                              p: isCompactMobile ? 1 : 1.5,
                            }}
                          >
                            <Avatar
                              alt={`Profile picture for ${account.display_name}`}
                              src={account.profile_picture ?? undefined}
                              sx={{ bgcolor: 'primary.main', height: listAvatarSize, width: listAvatarSize }}
                            >
                              {getProfileInitials(account.display_name)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: listTitleSize }}>
                                {account.display_name}
                              </Typography>
                              <Typography color="text.secondary" variant="body2" sx={{ fontSize: listSubtitleSize }}>
                                @{account.username}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                        No following accounts to show.
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Box>
            </Box>
          </Stack>
        </Paper>
      </Box>
  )
}
