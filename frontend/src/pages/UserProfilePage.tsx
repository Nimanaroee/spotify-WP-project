/**
 * UserProfilePage — read-only user profile view
 * Spec reference: §2.3
 *
 * Responsibilities:
 *  - [x] show another user's profile details
 *  - [x] allow follow/unfollow for the viewed user
 *  - [x] redirect self-viewing users to their management page
 */
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import FollowListPanel from '../components/profile/FollowListPanel';
import ProfileStatsGrid from '../components/profile/ProfileStatsGrid';
import ProfileSummaryHeader from '../components/profile/ProfileSummaryHeader';
import { ROLES } from '../lib/constants/roles';
import { ROUTES } from '../lib/constants/routes';
import {
  followAccount,
  getUserProfileView,
  unfollowAccount,
} from '../lib/mock/userProfileService';
import { useAuthStore } from '../store/authStore';
import type { UserProfileView } from '../types';

export default function UserProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const isCompactMobile = useMediaQuery('(max-width:767px)');
  const [profile, setProfile] = useState<UserProfileView | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authUser || !username) {
      return;
    }

    if (authUser.username === username) {
      navigate(ROUTES.MANAGE, { replace: true });
      return;
    }

    try {
      setProfile(getUserProfileView(authUser.id, username));
      setError('');
    } catch (exception) {
      setError(
        exception instanceof Error ? exception.message : 'Profile not found.'
      );
    }
  }, [authUser, navigate, username]);

  if (!authUser) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (authUser.role !== ROLES.LISTENER) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (error) {
    return (
      <Box className="min-h-screen p-6" sx={{ bgcolor: 'background.default' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!profile) {
    return null;
  }

  const currentAuthUser = authUser;
  const currentProfile = profile;
  const statsGridColumns = isCompactMobile
    ? 'repeat(3, minmax(0, 1fr))'
    : 'repeat(3, 1fr)';
  const statsCardPadding = isCompactMobile ? 1.25 : 2;
  const statsLabelSize = isCompactMobile ? '0.68rem' : '0.875rem';
  const statsValueSize = isCompactMobile ? '1rem' : '1.5rem';
  const listHeight = isCompactMobile ? 260 : 320;
  const listPadding = isCompactMobile ? 1 : 2;
  const listSpacing = isCompactMobile ? 0.75 : 1;
  const listGap = isCompactMobile ? 1 : 1.5;
  const listAvatarSize = isCompactMobile ? 30 : 40;
  const listTitleSize = isCompactMobile ? '0.82rem' : '1rem';
  const listSubtitleSize = isCompactMobile ? '0.68rem' : '0.875rem';

  function handleToggleFollow(): void {
    if (!currentAuthUser || !currentProfile) {
      return;
    }

    if (currentProfile.is_following) {
      unfollowAccount(currentAuthUser.id, currentProfile.user.id);
    } else {
      followAccount(currentAuthUser.id, currentProfile.user.id);
    }

    setProfile(
      getUserProfileView(currentAuthUser.id, currentProfile.user.username)
    );
  }

  return (
    <Box
      className="min-h-screen p-4 md:p-8"
      sx={{ bgcolor: 'background.default' }}
    >
      <Paper className="mx-auto max-w-4xl p-5 md:p-8">
        <Stack spacing={3}>
          <ProfileSummaryHeader
            user={profile.user}
            action={
              <Box
                sx={{
                  width: { xs: '100%', md: 'auto' },
                  display: 'flex',
                  justifyContent: { xs: 'flex-start', md: 'flex-end' },
                }}
              >
                <Button
                  color={profile.is_following ? 'inherit' : 'primary'}
                  onClick={handleToggleFollow}
                  size="small"
                  variant={profile.is_following ? 'outlined' : 'contained'}
                >
                  {profile.is_following ? 'Unfollow' : 'Follow'}
                </Button>
              </Box>
            }
          />

          <ProfileStatsGrid
            columns={statsGridColumns}
            labelSize={statsLabelSize}
            padding={statsCardPadding}
            stats={[
              { label: 'Followers', value: profile.user.followers_count ?? 0 },
              { label: 'Following', value: profile.user.following_count ?? 0 },
              { label: 'Streamed today', value: profile.daily_streams_count },
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
            <FollowListPanel
              accounts={profile.followers}
              avatarSize={listAvatarSize}
              emptyMessage="No followers to show."
              gap={listGap}
              height={listHeight}
              isCompact={isCompactMobile}
              padding={listPadding}
              spacing={listSpacing}
              subtitleSize={listSubtitleSize}
              title="Followers"
              titleSize={listTitleSize}
            />
            <FollowListPanel
              accounts={profile.following}
              avatarSize={listAvatarSize}
              emptyMessage="No following accounts to show."
              gap={listGap}
              height={listHeight}
              isCompact={isCompactMobile}
              padding={listPadding}
              spacing={listSpacing}
              subtitleSize={listSubtitleSize}
              title="Following"
              titleSize={listTitleSize}
            />
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
