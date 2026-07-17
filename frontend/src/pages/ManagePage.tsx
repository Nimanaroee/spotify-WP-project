/**
 * ManagePage — view and edit the authenticated user's profile
 * Spec reference: §2.3
 *
 * Responsibilities:
 *  - [x] Load profile details, statistics, followers, and following
 *  - [x] Update editable profile fields and follow relationships
 */
import { useEffect, useState, type ChangeEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { BadgeCheck } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';

import ArtistReleaseCard from '../components/profile/ArtistReleaseCard';
import FollowListPanel from '../components/profile/FollowListPanel';
import ProfileStatsGrid from '../components/profile/ProfileStatsGrid';
import ProfileSummaryHeader from '../components/profile/ProfileSummaryHeader';
import { getAppText } from '../lib/constants/appText';
import { getManagePageText } from '../lib/constants/managePageText';
import { ROLES } from '../lib/constants/roles';
import { ROUTES, userProfilePath } from '../lib/constants/routes';
import {
  getManageArtistProfileFromApi,
  getManageProfileFromApi,
  hasProfileApiSession,
  unfollowUsername,
  updateManageArtistProfileFromApi,
  updateManageProfileFromApi,
  type PublicArtistProfileView,
} from '../lib/api/profileService';
import {
  getOwnArtistProfileView,
  type ArtistProfileView,
  updateArtistProfile,
} from '../lib/mock/artistProfileService';
import {
  getManageProfile,
  getUserProfileView,
  removeFollower,
  unfollowAccount,
  updateUserProfile,
} from '../lib/mock/userProfileService';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { useAppLanguage } from '../theme/LanguageContext';
import type {
  Album,
  Gender,
  ManageProfile,
  Track,
  UpdateUserProfilePayload,
  User,
  UserSummary,
} from '../types';

type EditableProfile = Required<
  Pick<
    UpdateUserProfilePayload,
    'display_name' | 'birth_date' | 'gender' | 'profile_picture'
  >
>;

type FollowListType = 'followers' | 'following';

type ArtistEditableProfile = {
  stage_name: string;
  bio: string;
  profile_picture: string;
};

function createEditableProfile(
  profile: ManageProfile
): EditableProfile {
  return {
    display_name: profile.user.display_name,
    birth_date: profile.user.birth_date ?? '',
    gender: profile.user.gender ?? 'male',
    profile_picture: profile.user.profile_picture ?? '',
  };
}

function ArtistManagementPage({ authUser }: { authUser: User }) {
  const setUser = useAuthStore((state) => state.setUser);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const navigate = useNavigate();
  const { language } = useAppLanguage();
  const copy = getAppText(language);
  const manageCopy = getManagePageText(language);
  const usesProfileApi = hasProfileApiSession();
  const isMobile = useMediaQuery('(max-width:767px)');
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(usesProfileApi);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [artistView, setArtistView] = useState<
    ArtistProfileView | PublicArtistProfileView | null
  >(() => {
    if (usesProfileApi) {
      return null;
    }
    const baseProfile = getUserProfileView(authUser.id, authUser.username);
    return getOwnArtistProfileView(authUser.id, baseProfile);
  });
  const [editableArtistProfile, setEditableArtistProfile] =
    useState<ArtistEditableProfile>({
      stage_name: artistView?.artist_profile.stage_name ?? '',
      bio: artistView?.artist_profile.bio ?? '',
      profile_picture: artistView?.user.profile_picture ?? '',
    });
  const [activeFollowList, setActiveFollowList] =
    useState<FollowListType>('followers');
  const isCompactMobile = isMobile;
  const statsGridColumns = isCompactMobile
    ? 'repeat(2, minmax(0, 1fr))'
    : 'repeat(2, 1fr)';
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
  const releaseListHeight = isCompactMobile ? 240 : 260;

  useEffect(() => {
    if (!usesProfileApi) {
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setErrorMessage(null);
    getManageArtistProfileFromApi()
      .then((nextView) => {
        if (!isActive) {
          return;
        }
        setArtistView(nextView);
        setEditableArtistProfile({
          stage_name: nextView.artist_profile.stage_name,
          bio: nextView.artist_profile.bio ?? '',
          profile_picture: nextView.user.profile_picture ?? '',
        });
        setUser({
          ...authUser,
          display_name: nextView.artist_profile.stage_name,
          profile_picture: nextView.user.profile_picture,
          followers_count: nextView.user.followers_count,
          following_count: nextView.user.following_count,
        });
      })
      .catch((error: unknown) => {
        if (isActive) {
          setErrorMessage(
            error instanceof Error ? error.message : manageCopy.messages.apiError
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [authUser.id, usesProfileApi]);

  async function refreshArtistView(): Promise<void> {
    if (usesProfileApi) {
      const nextView = await getManageArtistProfileFromApi();
      setArtistView(nextView);
      setEditableArtistProfile({
        stage_name: nextView.artist_profile.stage_name,
        bio: nextView.artist_profile.bio ?? '',
        profile_picture: nextView.user.profile_picture ?? '',
      });
      setUser({
        ...authUser,
        display_name: nextView.artist_profile.stage_name,
        profile_picture: nextView.user.profile_picture,
        followers_count: nextView.user.followers_count,
        following_count: nextView.user.following_count,
      });
      return;
    }

    const baseProfile = getUserProfileView(authUser.id, authUser.username);
    const nextView = getOwnArtistProfileView(authUser.id, baseProfile);
    setArtistView(nextView);
    setEditableArtistProfile({
      stage_name: nextView.artist_profile.stage_name,
      bio: nextView.artist_profile.bio ?? '',
      profile_picture: nextView.user.profile_picture ?? '',
    });
  }

  async function handleSaveArtisticName(): Promise<void> {
    setErrorMessage(null);
    try {
      if (usesProfileApi) {
        const nextView = await updateManageArtistProfileFromApi(
          editableArtistProfile.stage_name,
          editableArtistProfile.bio,
          profilePhotoFile,
        );
        setArtistView(nextView);
        setEditableArtistProfile({
          stage_name: nextView.artist_profile.stage_name,
          bio: nextView.artist_profile.bio ?? '',
          profile_picture: nextView.user.profile_picture ?? '',
        });
        setUser({
          ...authUser,
          display_name: nextView.artist_profile.stage_name,
          profile_picture: nextView.user.profile_picture,
          followers_count: nextView.user.followers_count,
          following_count: nextView.user.following_count,
        });
      } else {
        const nextProfile = updateArtistProfile(authUser.id, {
          stage_name: editableArtistProfile.stage_name,
          bio: editableArtistProfile.bio,
          profile_picture: editableArtistProfile.profile_picture || null,
        });
        setUser({ ...authUser, display_name: nextProfile.stage_name });
        await refreshArtistView();
      }
      setProfilePhotoFile(null);
      setMessage(copy.profile.artistProfileUpdated);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : manageCopy.messages.apiError
      );
    }
  }

  function handleArtistPhotoUpload(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setProfilePhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditableArtistProfile((current) => ({
          ...current,
          profile_picture: reader.result as string,
        }));
        setMessage(manageCopy.messages.photoReady);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleReleaseSelect(release: Album | Track): void {
    if (release.release_type === 'album') {
      navigate(`${ROUTES.ALBUMS}/${release.id}`);
      return;
    }

    const track = release as Track;
    if (!artistView) {
      return;
    }
    playTrack(track, artistView.singles);
    if (!usesProfileApi) {
      void refreshArtistView();
    }
  }

  async function handleRemoveFollowAccount(account: UserSummary): Promise<void> {
    setErrorMessage(null);
    try {
      if (usesProfileApi) {
        if (!account.username) {
          throw new Error(manageCopy.messages.apiError);
        }
        await unfollowUsername(account.username);
      } else if (activeFollowList === 'followers') {
        removeFollower(authUser.id, account.id);
      } else {
        unfollowAccount(authUser.id, account.id);
      }
      await refreshArtistView();
      setMessage(
        activeFollowList === 'followers'
          ? manageCopy.messages.removedFollower(account.display_name)
          : manageCopy.messages.unfollowed(account.display_name)
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : manageCopy.messages.apiError
      );
    }
  }

  if (isLoading) {
    return (
      <Box
        className="min-h-screen p-6"
        sx={{
          alignItems: 'center',
          bgcolor: 'background.default',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!artistView) {
    return (
      <Box className="min-h-screen p-6" sx={{ bgcolor: 'background.default' }}>
        <Alert severity="error">
          {errorMessage ?? manageCopy.messages.profileNotFound}
        </Alert>
      </Box>
    );
  }

  const activeAccounts =
    activeFollowList === 'followers'
      ? artistView.followers
      : artistView.following;

  return (
      <Box
        className="min-h-screen p-4 md:p-8"
        dir={language === 'fa' ? 'rtl' : 'ltr'}
        sx={{ bgcolor: 'background.default' }}
      >
        <Stack className="mx-auto max-w-5xl" spacing={3}>
          <Paper className="p-5 md:p-8">
            <Stack spacing={3}>
              <ProfileSummaryHeader
                avatarSize={88}
                gap={2.5}
                language={language}
                showSubscriptionLabel={false}
                titleSize={{ xs: '2.125rem', md: '2.125rem' }}
                user={{
                  ...artistView.user,
                  display_name: artistView.artist_profile.stage_name,
                }}
                action={
                  artistView.artist_profile.is_verified ? (
                    <Chip
                      color="success"
                      icon={<BadgeCheck size={16} />}
                      label={copy.profile.verifiedArtist}
                    />
                  ) : null
                }
              />

              {message ? <Alert severity="success">{message}</Alert> : null}
              {errorMessage ? (
                <Alert severity="error">{errorMessage}</Alert>
              ) : null}

              <Paper className="p-4" variant="outlined">
                <Stack spacing={2}>
                  <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
                    {copy.profile.artistContent}
                  </Typography>
                  <TextField
                    fullWidth
                    label={copy.profile.artisticName}
                    onChange={(event) =>
                      setEditableArtistProfile((current) => ({
                        ...current,
                        stage_name: event.target.value,
                      }))
                    }
                    value={editableArtistProfile.stage_name}
                  />
                  <Box>
                    <Button component="label" variant="outlined">
                      {manageCopy.form.changePhoto}
                      <input
                        aria-label="Profile photo upload"
                        accept="image/*"
                        hidden
                        onChange={handleArtistPhotoUpload}
                        type="file"
                      />
                    </Button>
                  </Box>
                  <Box>
                    <Button
                      onClick={() => void handleSaveArtisticName()}
                      variant="contained"
                    >
                      {copy.profile.saveArtistProfile}
                    </Button>
                  </Box>
                  <Divider />
                  <TextField
                    fullWidth
                    label={copy.profile.artistBio}
                    minRows={4}
                    multiline
                    onChange={(event) =>
                      setEditableArtistProfile((current) => ({
                        ...current,
                        bio: event.target.value,
                      }))
                    }
                    value={editableArtistProfile.bio}
                  />
                </Stack>
              </Paper>

              <ProfileStatsGrid
                columns={statsGridColumns}
                labelSize={statsLabelSize}
                padding={statsCardPadding}
                stats={[
                  {
                    label: copy.profile.totalListeners,
                    value: artistView.listener_count,
                  },
                  {
                    label: copy.profile.totalStreams,
                    value: artistView.total_streams,
                  },
                ]}
                valueSize={statsValueSize}
              />

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
                    {artistView.albums.length > 0 ? (
                      artistView.albums.map((album) => (
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
                    {artistView.singles.length > 0 ? (
                      artistView.singles.map((single) => (
                        <ArtistReleaseCard key={single.id} release={single} onSelect={handleReleaseSelect} />
                      ))
                    ) : (
                      <Typography color="text.secondary">{copy.profile.noSingles}</Typography>
                    )}
                  </Stack>
                </Paper>
              </Box>

              <Divider />

              <Box>
                <Typography component="h2" variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  {manageCopy.sections.followersAndFollowing}
                </Typography>
                <Paper variant="outlined">
                  <Tabs
                    onChange={(_event, value: FollowListType) => {
                      setActiveFollowList(value);
                      setMessage(null);
                    }}
                    value={activeFollowList}
                    variant="fullWidth"
                  >
                    <Tab
                      label={`${manageCopy.tabs.followers} (${artistView.followers.length})`}
                      value="followers"
                    />
                    <Tab
                      label={`${manageCopy.tabs.following} (${artistView.following.length})`}
                      value="following"
                    />
                  </Tabs>
                  <Divider />
                  <FollowListPanel
                    accounts={activeAccounts}
                    avatarSize={listAvatarSize}
                    emptyStateKey="accounts"
                    gap={listGap}
                    getAccountAction={(account) =>
                      activeFollowList === 'following' ? (
                        <Button
                          aria-label={`Unfollow ${account.display_name}`}
                          color="inherit"
                          onClick={() => void handleRemoveFollowAccount(account)}
                          size="small"
                          variant="text"
                        >
                          {manageCopy.actions.unfollow}
                        </Button>
                      ) : null
                    }
                    getAccountHref={(account) =>
                      userProfilePath(account.username ?? String(account.id))
                    }
                    height={listHeight}
                    isCompact={isCompactMobile}
                    language={language}
                    padding={listPadding}
                    spacing={listSpacing}
                    surface={false}
                    subtitleSize={listSubtitleSize}
                    titleSize={listTitleSize}
                  />
                </Paper>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </Box>
  );
}

export default function ManagePage() {
  const authUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { language } = useAppLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeFollowList, setActiveFollowList] =
    useState<FollowListType>('followers');
  const usesProfileApi = hasProfileApiSession();
  const [profile, setProfile] = useState<ManageProfile | null>(() =>
    authUser && !usesProfileApi ? getManageProfile(authUser.id) : null
  );
  const [isLoading, setIsLoading] = useState(
    Boolean(authUser && authUser.role === ROLES.LISTENER && usesProfileApi)
  );
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width:767px)');
  const [editableProfile, setEditableProfile] = useState<EditableProfile>(() =>
    profile
      ? createEditableProfile(profile)
      : {
          display_name: '',
          birth_date: '',
          gender: 'male',
          profile_picture: '',
        }
  );
  const copy = getManagePageText(language);

  useEffect(() => {
    if (
      !authUser ||
      authUser.role !== ROLES.LISTENER ||
      !usesProfileApi
    ) {
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setErrorMessage(null);
    getManageProfileFromApi(authUser)
      .then((nextProfile) => {
        if (!isActive) {
          return;
        }
        setProfile(nextProfile);
        setEditableProfile(createEditableProfile(nextProfile));
        setUser(nextProfile.user);
      })
      .catch((error: unknown) => {
        if (isActive) {
          setErrorMessage(
            error instanceof Error ? error.message : copy.messages.apiError
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [authUser?.id, copy.messages.apiError, setUser, usesProfileApi]);

  if (!authUser) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (authUser.role === ROLES.ARTIST) {
    return <ArtistManagementPage authUser={authUser} />;
  }

  if (authUser.role !== ROLES.LISTENER) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (isLoading) {
    return (
      <Box
        className="min-h-screen p-6"
        dir={language === 'fa' ? 'rtl' : 'ltr'}
        sx={{
          alignItems: 'center',
          bgcolor: 'background.default',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <CircularProgress />
          <Typography color="text.secondary">
            {copy.messages.loading}
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!profile) {
    return (
        <Box
          className="min-h-screen p-6"
          dir={language === 'fa' ? 'rtl' : 'ltr'}
          sx={{ bgcolor: 'background.default' }}
        >
          <Alert severity="error">
            {errorMessage ?? copy.messages.profileNotFound}
          </Alert>
        </Box>
    );
  }

  const currentProfile = profile;
  const currentAuthUser = authUser;
  const isCompactMobile = isMobile;
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

  function handleEditableChange(
    field: keyof EditableProfile,
    value: string
  ): void {
    setEditableProfile((current) => ({ ...current, [field]: value }));
  }

  async function handleRemoveFollowAccount(
    account: UserSummary
  ): Promise<void> {
    setErrorMessage(null);
    try {
      if (usesProfileApi) {
        if (!account.username) {
          throw new Error(copy.messages.apiError);
        }
        await unfollowUsername(account.username);
        const nextProfile = await getManageProfileFromApi(currentAuthUser);
        setProfile(nextProfile);
        setUser(nextProfile.user);
      } else {
        const nextProfile =
          activeFollowList === 'followers'
            ? removeFollower(currentProfile.user.id, account.id)
            : unfollowAccount(currentProfile.user.id, account.id);
        setProfile(nextProfile);
      }
      setMessage(
        activeFollowList === 'followers'
          ? copy.messages.removedFollower(account.display_name)
          : copy.messages.unfollowed(account.display_name)
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : copy.messages.apiError
      );
    }
  }

  function handleStartEdit(): void {
    setEditableProfile(createEditableProfile(currentProfile));
    setIsEditing(true);
    setMessage(null);
  }

  function handleCancelEdit(): void {
    setEditableProfile(createEditableProfile(currentProfile));
    setProfilePhotoFile(null);
    setIsEditing(false);
  }

  async function handleSaveProfile(): Promise<void> {
    const payload: UpdateUserProfilePayload = {
      display_name: editableProfile.display_name,
      birth_date: editableProfile.birth_date || undefined,
      gender: editableProfile.gender as Gender,
      profile_picture: editableProfile.profile_picture || null,
    };
    setErrorMessage(null);
    try {
      const nextProfile = usesProfileApi
        ? await updateManageProfileFromApi(
            currentAuthUser,
            payload,
            profilePhotoFile
          )
        : {
            ...getManageProfile(currentProfile.user.id),
            user: updateUserProfile(currentProfile.user.id, payload),
          };
      const refreshedProfile = usesProfileApi
        ? nextProfile
        : getManageProfile(currentProfile.user.id);
      setUser(refreshedProfile.user);
      setProfile(refreshedProfile);
      setEditableProfile(createEditableProfile(refreshedProfile));
      setProfilePhotoFile(null);
      setIsEditing(false);
      setMessage(copy.messages.profileUpdated);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : copy.messages.apiError
      );
    }
  }

  function handleProfilePhotoUpload(
    event: ChangeEvent<HTMLInputElement>
  ): void {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setProfilePhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditableProfile((current) => ({
          ...current,
          profile_picture: reader.result as string,
        }));
        setMessage(copy.messages.photoReady);
      }
    };
    reader.readAsDataURL(file);
  }

  const activeAccounts =
    activeFollowList === 'followers' ? profile.followers : profile.following;

  return (
      <Box
        className="min-h-screen p-4 md:p-8"
        dir={language === 'fa' ? 'rtl' : 'ltr'}
        sx={{ bgcolor: 'background.default' }}
      >
        <Stack className="mx-auto max-w-5xl" spacing={3}>
          <Paper className="p-5 md:p-8">
            <Stack spacing={3}>
              <ProfileSummaryHeader
                avatarSize={88}
                gap={2.5}
                language={language}
                titleSize={{ xs: '2.125rem', md: '2.125rem' }}
                user={profile.user}
                action={
                  !isMobile && !isEditing ? (
                    <Box
                      sx={{
                        display: 'flex',
                        flexShrink: 0,
                        justifyContent: 'flex-end',
                        width: { xs: '100%', md: 'auto' },
                      }}
                    >
                      <Button
                        onClick={handleStartEdit}
                        size="large"
                        variant="outlined"
                      >
                        {copy.actions.edit}
                      </Button>
                    </Box>
                  ) : null
                }
              />

              {message ? <Alert severity="success">{message}</Alert> : null}
              {errorMessage ? (
                <Alert severity="error">{errorMessage}</Alert>
              ) : null}

              <ProfileStatsGrid
                columns={statsGridColumns}
                language={language}
                labelSize={statsLabelSize}
                padding={statsCardPadding}
                stats={[
                  {
                    key: 'followers',
                    value: profile.user.followers_count ?? 0,
                  },
                  {
                    key: 'following',
                    value: profile.user.following_count ?? 0,
                  },
                  {
                    key: 'streamedToday',
                    value: profile.daily_streams_count,
                  },
                ]}
                valueSize={statsValueSize}
              />

              <Divider />

              <Box>
                <Typography
                  component="h2"
                  variant="h6"
                  sx={{ fontWeight: 700, mb: 1 }}
                >
                  {copy.sections.followersAndFollowing}
                </Typography>
                <Paper variant="outlined">
                  <Tabs
                    onChange={(_event, value: FollowListType) => {
                      setActiveFollowList(value);
                      setMessage(null);
                    }}
                    value={activeFollowList}
                    variant="fullWidth"
                  >
                    <Tab
                      label={`${copy.tabs.followers} (${profile.followers.length})`}
                      value="followers"
                    />
                    <Tab
                      label={`${copy.tabs.following} (${profile.following.length})`}
                      value="following"
                    />
                  </Tabs>
                  <Divider />
                  <FollowListPanel
                    accounts={activeAccounts}
                    avatarSize={listAvatarSize}
                    emptyStateKey="accounts"
                    gap={listGap}
                    getAccountAction={(account) =>
                      activeFollowList === 'following' ? (
                        <Button
                          aria-label={`Unfollow ${account.display_name}`}
                          color="inherit"
                          onClick={() => void handleRemoveFollowAccount(account)}
                          size="small"
                          variant="text"
                        >
                          {copy.actions.unfollow}
                        </Button>
                      ) : null
                    }
                    getAccountHref={(account) =>
                      userProfilePath(account.username ?? String(account.id))
                    }
                    height={listHeight}
                    isCompact={isCompactMobile}
                    language={language}
                    padding={listPadding}
                    spacing={listSpacing}
                    surface={false}
                    subtitleSize={listSubtitleSize}
                    titleSize={listTitleSize}
                  />
                </Paper>
              </Box>

              <Divider />

              <Box>
                <Typography
                  component="h2"
                  variant="h6"
                  sx={{ fontWeight: 700, mb: 2 }}
                >
                  {copy.sections.personalInformation}
                </Typography>
                {isMobile && !isEditing ? (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}
                  >
                    <Button onClick={handleStartEdit} variant="outlined">
                      {copy.actions.edit}
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
                      label={copy.form.displayName}
                      onChange={(event) =>
                        handleEditableChange('display_name', event.target.value)
                      }
                      value={
                        isEditing
                          ? editableProfile.display_name
                          : profile.user.display_name
                      }
                      disabled={!isEditing}
                    />
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      label={copy.form.systemUsername}
                      value={profile.user.username}
                      disabled
                    />
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      label={copy.form.birthDate}
                      onChange={(event) =>
                        handleEditableChange('birth_date', event.target.value)
                      }
                      type="date"
                      value={
                        isEditing
                          ? editableProfile.birth_date
                          : profile.user.birth_date ?? ''
                      }
                      disabled={!isEditing}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      label={copy.form.gender}
                      onChange={(event) =>
                        handleEditableChange('gender', event.target.value)
                      }
                      select
                      value={
                        isEditing
                          ? editableProfile.gender
                          : profile.user.gender ?? ''
                      }
                      disabled={!isEditing}
                    >
                      <MenuItem value="male">
                        {copy.form.genderOptions.male}
                      </MenuItem>
                      <MenuItem value="female">
                        {copy.form.genderOptions.female}
                      </MenuItem>
                    </TextField>
                  </Box>
                  {isEditing ? (
                    <Box sx={{ gridColumn: { xs: 'auto', md: '1 / -1' } }}>
                      <Button component="label" variant="outlined">
                        {copy.form.changePhoto}
                        <input
                          aria-label="Profile photo upload"
                          accept="image/*"
                          hidden
                          onChange={handleProfilePhotoUpload}
                          type="file"
                        />
                      </Button>
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
                    <Button
                      onClick={() => void handleSaveProfile()}
                      variant="contained"
                    >
                      {copy.actions.save}
                    </Button>
                    <Button onClick={handleCancelEdit} variant="outlined">
                      {copy.actions.cancel}
                    </Button>
                  </Box>
                ) : null}
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </Box>
  );
}
