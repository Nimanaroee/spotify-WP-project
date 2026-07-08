import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { BadgeCheck } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import ArtistReleaseCard from '../components/profile/ArtistReleaseCard'
import FollowListPanel from '../components/profile/FollowListPanel'
import ProfileStatsGrid from '../components/profile/ProfileStatsGrid'
import ProfileSummaryHeader from '../components/profile/ProfileSummaryHeader'
import { getAppText } from '../lib/constants/appText'
import { ROLES } from '../lib/constants/roles'
import { ROUTES, userProfilePath } from '../lib/constants/routes'
import {
  getArtistProfileView,
  type ArtistProfileView,
} from '../lib/mock/artistProfileService'
import {
  followAccount,
  getUserProfileView,
  unfollowAccount,
} from '../lib/mock/userProfileService'
import { useAuthStore } from '../store/authStore'
import { usePlayerStore } from '../store/playerStore'
import { useAppLanguage } from '../theme/LanguageContext'
import type { Album, Track, UserProfileView } from '../types'

type ProfileView = UserProfileView | ArtistProfileView

function isArtistProfile(profile: ProfileView): profile is ArtistProfileView {
  return profile.user.role === ROLES.ARTIST && 'artist_profile' in profile
}

export default function UserProfilePage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const authUser = useAuthStore((state) => state.user)
  const playTrack = usePlayerStore((state) => state.playTrack)
  const isCompactMobile = useMediaQuery('(max-width:767px)')
  const { language } = useAppLanguage()
  const copy = getAppText(language)
  const [profile, setProfile] = useState<ProfileView | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authUser || !username) {
      return
    }

    if (
      authUser.username === username &&
      (authUser.role === ROLES.LISTENER || authUser.role === ROLES.ARTIST)
    ) {
      navigate(ROUTES.MANAGE, { replace: true })
      return
    }

    try {
      const baseProfile = getUserProfileView(authUser.id, username)
      setProfile(
        baseProfile.user.role === ROLES.ARTIST
          ? getArtistProfileView(authUser.id, username, baseProfile)
          : baseProfile,
      )
      setError('')
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : copy.common.notFound)
    }
  }, [authUser, copy.common.notFound, navigate, username])

  if (!authUser) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (error) {
    return (
      <Box
        className="min-h-screen p-4 md:p-8"
        dir={language === 'fa' ? 'rtl' : 'ltr'}
        sx={{ bgcolor: 'background.default' }}
      >
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!profile) {
    return null
  }

  const currentAuthUser = authUser
  const currentProfile = profile
  const artistProfile = isArtistProfile(profile) ? profile : null
  const canViewPremiumAnalytics = currentAuthUser.subscription_tier === 'gold'
  const statsGridColumns = isCompactMobile
    ? 'repeat(3, minmax(0, 1fr))'
    : 'repeat(3, 1fr)'
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
  const releaseListHeight = isCompactMobile ? 240 : 260

  function refreshProfile(): void {
    const baseProfile = getUserProfileView(
      currentAuthUser.id,
      currentProfile.user.username,
    )
    setProfile(
      baseProfile.user.role === ROLES.ARTIST
        ? getArtistProfileView(currentAuthUser.id, baseProfile.user.username, baseProfile)
        : baseProfile,
    )
  }

  function handleToggleFollow(): void {
    if (currentProfile.is_following) {
      unfollowAccount(currentAuthUser.id, currentProfile.user.id)
    } else {
      followAccount(currentAuthUser.id, currentProfile.user.id)
    }

    refreshProfile()
  }

  function handleReleaseSelect(release: Album | Track): void {
    if (release.release_type === 'album') {
      navigate(`${ROUTES.ALBUMS}/${release.id}`)
      return
    }

    const track = release as Track
    playTrack(track, artistProfile?.singles ?? [track])
    refreshProfile()
  }

  const followLists = (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
      }}
    >
      <FollowListPanel
        accounts={profile.followers}
        avatarSize={listAvatarSize}
        emptyMessage={
          language === 'fa'
            ? 'دنبال‌کننده‌ای وجود ندارد.'
            : 'No followers to show.'
        }
        gap={listGap}
        getAccountHref={(account) =>
          account.id === currentAuthUser.id
            ? ROUTES.MANAGE
            : userProfilePath(account.username ?? String(account.id))
        }
        height={listHeight}
        isCompact={isCompactMobile}
        padding={listPadding}
        spacing={listSpacing}
        subtitleSize={listSubtitleSize}
        title={`${copy.profile.followers} (${profile.followers.length})`}
        titleSize={listTitleSize}
      />
      <FollowListPanel
        accounts={profile.following}
        avatarSize={listAvatarSize}
        emptyMessage={
          language === 'fa'
            ? 'حساب دنبال‌شده‌ای وجود ندارد.'
            : 'No following accounts to show.'
        }
        gap={listGap}
        getAccountHref={(account) =>
          account.id === currentAuthUser.id
            ? ROUTES.MANAGE
            : userProfilePath(account.username ?? String(account.id))
        }
        height={listHeight}
        isCompact={isCompactMobile}
        padding={listPadding}
        spacing={listSpacing}
        subtitleSize={listSubtitleSize}
        title={`${copy.profile.following} (${profile.following.length})`}
        titleSize={listTitleSize}
      />
    </Box>
  )

  return (
    <Box
      className="min-h-screen p-4 md:p-8"
      dir={language === 'fa' ? 'rtl' : 'ltr'}
      sx={{ bgcolor: 'background.default' }}
    >
      <Paper className="mx-auto max-w-5xl p-5 md:p-8">
        <Stack spacing={3}>
          <ProfileSummaryHeader
            language={language}
            showSubscriptionLabel={!artistProfile}
            user={
              artistProfile
                ? {
                    ...profile.user,
                    display_name: artistProfile.artist_profile.stage_name,
                  }
                : profile.user
            }
            action={
              <Stack
                spacing={1}
                sx={{
                  alignItems: { xs: 'stretch', md: 'flex-end' },
                  width: { xs: '100%', md: 'auto' },
                }}
              >
                {artistProfile?.artist_profile.is_verified ? (
                  <Chip
                    color="success"
                    icon={<BadgeCheck size={16} />}
                    label={copy.profile.verifiedArtist}
                  />
                ) : null}
                <Button
                  color={profile.is_following ? 'inherit' : 'primary'}
                  onClick={handleToggleFollow}
                  size="small"
                  variant={profile.is_following ? 'outlined' : 'contained'}
                >
                  {profile.is_following ? copy.profile.unfollow : copy.profile.follow}
                </Button>
              </Stack>
            }
          />

          {artistProfile ? (
            <>
              <Paper className="p-4" variant="outlined">
                <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
                  {copy.profile.artistBio}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {artistProfile.artist_profile.bio || copy.profile.notSet}
                </Typography>
              </Paper>

              {canViewPremiumAnalytics ? (
                <ProfileStatsGrid
                  columns="repeat(2, minmax(0, 1fr))"
                  labelSize={statsLabelSize}
                  padding={statsCardPadding}
                  stats={[
                    {
                      label: copy.profile.totalListeners,
                      value: artistProfile.listener_count,
                    },
                    {
                      label: copy.profile.totalStreams,
                      value: artistProfile.total_streams,
                    },
                  ]}
                  valueSize={statsValueSize}
                />
              ) : (
                <Alert severity="info">{copy.profile.goldOnlyAnalytics}</Alert>
              )}

              {followLists}

              <Divider />

              <Box>
                <Typography component="h2" variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                  {copy.profile.albums}
                </Typography>
                <Paper
                  aria-label={copy.profile.albums}
                  variant="outlined"
                  sx={{ height: releaseListHeight, maxHeight: releaseListHeight, overflowY: 'auto', p: 2 }}
                >
                  <Stack spacing={1.5}>
                    {artistProfile.albums.length > 0 ? (
                      artistProfile.albums.map((album) => (
                        <ArtistReleaseCard key={album.id} release={album} onSelect={handleReleaseSelect} />
                      ))
                    ) : (
                      <Typography color="text.secondary">{copy.profile.noAlbums}</Typography>
                    )}
                  </Stack>
                </Paper>
              </Box>

              <Box>
                <Typography component="h2" variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                  {copy.profile.singles}
                </Typography>
                <Paper
                  aria-label={copy.profile.singles}
                  variant="outlined"
                  sx={{ height: releaseListHeight, maxHeight: releaseListHeight, overflowY: 'auto', p: 2 }}
                >
                  <Stack spacing={1.5}>
                    {artistProfile.singles.length > 0 ? (
                      artistProfile.singles.map((single) => (
                        <ArtistReleaseCard key={single.id} release={single} onSelect={handleReleaseSelect} />
                      ))
                    ) : (
                      <Typography color="text.secondary">{copy.profile.noSingles}</Typography>
                    )}
                  </Stack>
                </Paper>
              </Box>
            </>
          ) : (
            <>
              <ProfileStatsGrid
                columns={statsGridColumns}
                labelSize={statsLabelSize}
                padding={statsCardPadding}
                stats={[
                  {
                    label: copy.profile.followers,
                    value: profile.user.followers_count ?? 0,
                  },
                  {
                    label: copy.profile.following,
                    value: profile.user.following_count ?? 0,
                  },
                  {
                    label: copy.profile.streamedToday,
                    value: profile.daily_streams_count,
                  },
                ]}
                valueSize={statsValueSize}
              />

              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                }}
              >
                <Paper variant="outlined" className="p-4">
                  <Typography color="text.secondary" variant="body2">
                    {copy.profile.birthDate}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {profile.user.birth_date ?? copy.profile.notSet}
                  </Typography>
                </Paper>
                <Paper variant="outlined" className="p-4">
                  <Typography color="text.secondary" variant="body2">
                    {copy.profile.gender}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {profile.user.gender
                      ? profile.user.gender === 'prefer_not_to_say'
                        ? copy.profile.genderValue.preferNotToSay
                        : copy.profile.genderValue[profile.user.gender]
                      : copy.profile.notSet}
                  </Typography>
                </Paper>
              </Box>

              {followLists}
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  )
}
