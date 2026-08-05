import { Box, Button, Paper, Stack, Typography, CircularProgress } from '@mui/material';
import { Navigate, Link as RouterLink, useNavigate } from 'react-router-dom';
import { Disc3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import MediaCard from '../components/home/MediaCard';
import MediaRow from '../components/home/MediaRow';
import { getHomePageText } from '../lib/constants/homePageText';
import { ROUTES } from '../lib/constants/routes';
import { ROLES } from '../lib/constants/roles';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { useAppLanguage } from '../theme/LanguageContext';
import { getHomeData } from '../lib/api/homeService';

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const navigate = useNavigate();
  const { language } = useAppLanguage();
  const copy = getHomePageText(language);

  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getHomeData().then(setData).catch(console.error);
  }, []);

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const hasPremiumFeatures = user.subscription_tier === 'gold' || user.role !== ROLES.LISTENER;

  return (
    <MainLayout>
      <Box className="min-h-screen py-4 px-4 md:px-8" dir={language === 'fa' ? 'rtl' : 'ltr'}>
        {user.role === ROLES.ARTIST && (
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              p: { xs: 2, md: 3 },
              bgcolor: 'action.hover',
              borderRadius: 2,
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {copy.nav.artistStudio}
                </Typography>
                <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                  {copy.artistStudioPrompt}
                </Typography>
              </Box>
              <Button
                component={RouterLink}
                to={ROUTES.ARTIST_STUDIO}
                variant="contained"
                sx={{ alignSelf: { xs: 'stretch', sm: 'center' }, flexShrink: 0 }}
              >
                {copy.nav.artistStudio}
              </Button>
            </Stack>
          </Paper>
        )}

        {!data ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
        ) : (
          <>
            <MediaRow title={copy.showcase.recentPlaylists} show={data.recent_playlists.length > 0}>
              {data.recent_playlists.map((playlist: any) => (
                <MediaCard
                  key={`pl-${playlist.id}`}
                  title={playlist.name}
                  subtitle={playlist.track_count ? copy.showcase.tracksCount(playlist.track_count) : null}
                  imageUrl={playlist.cover_art}
                  onClick={() => navigate(ROUTES.PLAYLISTS)}
                  placeholderIcon={<Disc3 size={40} color="gray" />}
                />
              ))}
            </MediaRow>

            <MediaRow title={copy.showcase.latestReleases} show={data.latest_releases.length > 0}>
              {data.latest_releases.map((track: any) => (
                <MediaCard
                  key={`latest-${track.id}`}
                  title={track.title}
                  subtitle={track.artist_name}
                  imageUrl={track.cover_art}
                  onClick={() => playTrack(track, data.latest_releases)}
                />
              ))}
            </MediaRow>

            <MediaRow title={copy.showcase.topSongs} show={data.top_songs.length > 0}>
              {data.top_songs.map((track: any) => (
                <MediaCard
                  key={`trk-${track.id}`}
                  title={track.title}
                  subtitle={track.artist_name}
                  imageUrl={track.cover_art}
                  onClick={() => playTrack(track, data.top_songs)}
                />
              ))}
            </MediaRow>

            <MediaRow title={copy.showcase.latestAlbums} show={data.latest_albums.length > 0}>
              {data.latest_albums.map((album: any) => (
                <MediaCard
                  key={`alb-${album.id}`}
                  title={album.title}
                  subtitle={album.artist_name}
                  imageUrl={album.cover_art}
                  onClick={() => navigate(`${ROUTES.ALBUMS}/${album.id}`)}
                  placeholderIcon={<Disc3 size={40} color="gray" />}
                />
              ))}
            </MediaRow>

            <MediaRow title={copy.showcase.earlyAccess} show={hasPremiumFeatures && data.early_access.length > 0}>
              {data.early_access.map((track: any) => (
                <MediaCard
                  key={`ea-${track.id}`}
                  title={track.title}
                  subtitle={track.artist_name}
                  imageUrl={track.cover_art}
                  isEarlyAccess={true}
                  earlyAccessLabel={copy.showcase.earlyAccessBadge}
                  onClick={() => playTrack(track, data.early_access)}
                />
              ))}
            </MediaRow>
          </>
        )}
      </Box>
    </MainLayout>
  );
}