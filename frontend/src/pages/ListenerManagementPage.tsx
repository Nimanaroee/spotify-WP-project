/**
 * ListenerManagementPage — listener profile management and stats
 * Spec reference: §2.3
 *
 * Responsibilities:
 *  - [x] show listener personal and subscription details
 *  - [x] support local profile edits through the mock service
 *  - [x] disable profile picture changes for Basic subscribers
 */
import { useState, type ChangeEvent } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { Link as RouterLink, Navigate } from 'react-router-dom'

import { ROLES } from '../lib/constants/roles'
import { ROUTES, userProfilePath } from '../lib/constants/routes'
import { SUBSCRIPTION_LIMITS } from '../lib/constants/subscriptionLimits'
import {
  getListenerManagementProfile,
  removeFollower,
  unfollowAccount,
  updateListenerProfile,
} from '../lib/mock/userProfileService'
import { useAuthStore } from '../store/authStore'
import type {
  Gender,
  ListenerManagementProfile,
  UpdateUserProfilePayload,
  UserSummary,
} from '../types'

type EditableProfile = Required<
  Pick<UpdateUserProfilePayload, 'display_name' | 'birth_date' | 'gender' | 'profile_picture'>
>

type FollowListType = 'followers' | 'following'

function createEditableProfile(profile: ListenerManagementProfile): EditableProfile {
  return {
    display_name: profile.user.display_name,
    birth_date: profile.user.birth_date ?? '',
    gender: profile.user.gender ?? 'prefer_not_to_say',
    profile_picture: profile.user.profile_picture ?? '',
  }
}

function getProfileInitials(displayName: string): string {
  return displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function ListenerManagementPage() {
  const authUser = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [activeFollowList, setActiveFollowList] = useState<FollowListType>('followers')
  const [profile, setProfile] = useState<ListenerManagementProfile | null>(() =>
    authUser ? getListenerManagementProfile(authUser.id) : null,
  )
  const isMobile = useMediaQuery('(max-width:767px)')
  const [editableProfile, setEditableProfile] = useState<EditableProfile>(() =>
    profile
      ? createEditableProfile(profile)
      : {
          display_name: '',
          birth_date: '',
          gender: 'prefer_not_to_say',
          profile_picture: '',
        },
  )

  if (!authUser) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (authUser.role !== ROLES.LISTENER) {
    return <Navigate to={ROUTES.HOME} replace />
  }

  if (!profile) {
    return (
      <Box className="min-h-screen bg-slate-950 p-6">
        <Alert severity="error">Profile not found.</Alert>
      </Box>
    )
  }

  const subscriptionTier = profile.user.subscription_tier ?? 'basic'
  const canEditProfilePicture = SUBSCRIPTION_LIMITS[subscriptionTier].profilePicture
  const currentProfile = profile
  const isCompactMobile = isMobile
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

  function handleEditableChange(field: keyof EditableProfile, value: string): void {
    setEditableProfile((current) => ({ ...current, [field]: value }))
  }

  function handleRemoveFollowAccount(account: UserSummary): void {
    const nextProfile =
      activeFollowList === 'followers'
        ? removeFollower(currentProfile.user.id, account.id)
        : unfollowAccount(currentProfile.user.id, account.id)
    setProfile(nextProfile)
    setMessage(
      activeFollowList === 'followers'
        ? `${account.display_name} was removed from followers.`
        : `You unfollowed ${account.display_name}.`,
    )
  }

  function handleStartEdit(): void {
    setEditableProfile(createEditableProfile(currentProfile))
    setIsEditing(true)
    setMessage(null)
  }

  function handleCancelEdit(): void {
    setEditableProfile(createEditableProfile(currentProfile))
    setIsEditing(false)
  }

  function handleSaveProfile(): void {
    const payload: UpdateUserProfilePayload = {
      display_name: editableProfile.display_name,
      birth_date: editableProfile.birth_date || undefined,
      gender: editableProfile.gender as Gender,
      profile_picture: editableProfile.profile_picture || null,
    }
    const updatedUser = updateListenerProfile(currentProfile.user.id, payload)
    const nextProfile = getListenerManagementProfile(currentProfile.user.id)
    setUser(updatedUser)
    setProfile(nextProfile)
    setEditableProfile(createEditableProfile(nextProfile))
    setIsEditing(false)
    setMessage('Profile updated.')
  }

  function handleProfilePhotoUpload(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditableProfile((current) => ({
          ...current,
          profile_picture: reader.result as string,
        }))
        setMessage('Profile photo ready to save.')
      }
    }
    reader.readAsDataURL(file)
  }

  const activeAccounts =
    activeFollowList === 'followers' ? profile.followers : profile.following

  return (
    <Box className="min-h-screen bg-slate-950 p-4 md:p-8">
      <Stack className="mx-auto max-w-5xl" spacing={3}>
        <Paper className="p-5 md:p-8">
          <Stack spacing={3}>
            <Stack
              spacing={3}
              sx={{
                alignItems: { xs: 'flex-start', md: 'center' },
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
              }}
            >
              <Box
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 2.5,
                }}
              >
                <Avatar
                  alt={`Profile picture for ${profile.user.display_name}`}
                  src={profile.user.profile_picture ?? undefined}
                  sx={{ height: 88, width: 88, bgcolor: 'primary.main', fontSize: 28 }}
                >
                  {getProfileInitials(profile.user.display_name)}
                </Avatar>
                <Box>
                  <Typography component="h1" variant="h4" sx={{ fontWeight: 800 }}>
                    {profile.user.display_name}
                  </Typography>
                  <Typography color="text.secondary">@{profile.user.username}</Typography>
                  <Chip
                    className="mt-2"
                    color={subscriptionTier === 'gold' ? 'warning' : 'primary'}
                    label={`${subscriptionTier.toUpperCase()} subscription`}
                    variant={subscriptionTier === 'basic' ? 'outlined' : 'filled'}
                  />
                </Box>
              </Box>
              {!isMobile && !isEditing ? (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                  <Button onClick={handleStartEdit} size="large" variant="outlined">
                    Edit
                  </Button>
                </Box>
              ) : (
                <Box sx={{ width: '100%' }} />
              )}
            </Stack>

            {message ? <Alert severity="success">{message}</Alert> : null}

            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: statsGridColumns,
              }}
            >
              <Box>
                <Paper variant="outlined" sx={{ p: statsCardPadding }}>
                  <Typography color="text.secondary" variant="body2" sx={{ fontSize: statsLabelSize }}>
                    Followers
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, fontSize: statsValueSize }}>
                    {profile.user.followers_count ?? 0}
                  </Typography>
                </Paper>
              </Box>
              <Box>
                <Paper variant="outlined" sx={{ p: statsCardPadding }}>
                  <Typography color="text.secondary" variant="body2" sx={{ fontSize: statsLabelSize }}>
                    Following
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, fontSize: statsValueSize }}>
                    {profile.user.following_count ?? 0}
                  </Typography>
                </Paper>
              </Box>
              <Box>
                <Paper variant="outlined" sx={{ p: statsCardPadding }}>
                  <Typography color="text.secondary" variant="body2" sx={{ fontSize: statsLabelSize }}>
                    Streamed today
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, fontSize: statsValueSize }}>
                    {profile.daily_streams_count}
                  </Typography>
                </Paper>
              </Box>
            </Box>

            <Divider />

            <Box>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Followers and following
              </Typography>
              <Paper variant="outlined">
                <Tabs
                  onChange={(_event, value: FollowListType) => {
                    setActiveFollowList(value)
                    setMessage(null)
                  }}
                  value={activeFollowList}
                  variant="fullWidth"
                >
                  <Tab
                    label={`Followers (${profile.followers.length})`}
                    value="followers"
                  />
                  <Tab
                    label={`Following (${profile.following.length})`}
                    value="following"
                  />
                </Tabs>
                <Divider />
                <Stack
                  role="list"
                  spacing={1}
                  sx={{
                    height: listHeight,
                    maxHeight: listHeight,
                    overflowY: 'auto',
                    p: listPadding,
                  }}
                >
                  {activeAccounts.length > 0 ? (
                    activeAccounts.map((account) => (
                      <Stack
                        key={account.id}
                        role="listitem"
                        spacing={listSpacing}
                        sx={{
                          alignItems: 'center',
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 2,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          p: isCompactMobile ? 1 : 1.5,
                        }}
                      >
                        <Box
                          component={RouterLink}
                          to={userProfilePath(account.username ?? String(account.id))}
                          sx={{
                            alignItems: 'center',
                            color: 'inherit',
                            display: 'flex',
                            gap: listGap,
                            minWidth: 0,
                            textDecoration: 'none',
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
                        {activeFollowList === 'following' ? (
                          <Button
                            aria-label={`Unfollow ${account.display_name}`}
                            color="inherit"
                            onClick={() => handleRemoveFollowAccount(account)}
                            size="small"
                            variant="text"
                          >
                            Unfollow
                          </Button>
                        ) : null}
                      </Stack>
                    ))
                  ) : (
                    <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                      No accounts to show.
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Box>

            <Divider />

            <Box>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Personal information
              </Typography>
              {isMobile && !isEditing ? (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button onClick={handleStartEdit} variant="outlined">
                    Edit
                  </Button>
                </Box>
              ) : null}
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                }}
              >
                <Box>
                  <TextField
                    fullWidth
                    label="Display name"
                    onChange={(event) =>
                      handleEditableChange('display_name', event.target.value)
                    }
                    value={isEditing ? editableProfile.display_name : profile.user.display_name}
                    disabled={!isEditing}
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="System username"
                    value={profile.user.username}
                    disabled
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Birth date"
                    onChange={(event) => handleEditableChange('birth_date', event.target.value)}
                    type="date"
                    value={isEditing ? editableProfile.birth_date : profile.user.birth_date ?? ''}
                    disabled={!isEditing}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Gender"
                    onChange={(event) => handleEditableChange('gender', event.target.value)}
                    select
                    value={isEditing ? editableProfile.gender : profile.user.gender ?? ''}
                    disabled={!isEditing}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                    <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
                  </TextField>
                </Box>
                {isEditing && canEditProfilePicture ? (
                  <Box sx={{ gridColumn: { xs: 'auto', md: '1 / -1' } }}>
                    <Button component="label" variant="outlined">
                      Change profile photo
                      <input
                        aria-label="Profile photo upload"
                        accept="image/*"
                        hidden
                        onChange={handleProfilePhotoUpload}
                        type="file"
                      />
                    </Button>
                    <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                      Uploaded photos are stored locally for the Phase 1 demo.
                    </Typography>
                  </Box>
                ) : null}
              </Box>

              {isEditing ? (
                <Box
                  sx={{
                    alignItems: 'center',
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 1.5,
                    justifyContent: 'flex-start',
                    mt: 3,
                  }}
                >
                  <Button onClick={handleSaveProfile} variant="contained">
                    Save changes
                  </Button>
                  <Button onClick={handleCancelEdit} variant="outlined">
                    Cancel
                  </Button>
                </Box>
              ) : null}
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  )
}
