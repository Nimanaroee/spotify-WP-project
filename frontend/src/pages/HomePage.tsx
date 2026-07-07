import { Box } from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';
import { Disc3 } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import MediaCard from '../components/home/MediaCard';
import MediaRow from '../components/home/MediaRow';
import { getHomePageText } from '../lib/constants/homePageText';
import { ROUTES } from '../lib/constants/routes';
import { ROLES } from '../lib/constants/roles';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore'; // CONNECT PLAYER STORE!
import { useAppLanguage } from '../theme/LanguageContext';
import {
  getEarlyAccessReleases,
  getLatestAlbums,
  getRecentPlaylists,
  getTopSongs,
} from '../lib/mock/homeService';

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const playTrack = usePlayerStore((state) => state.playTrack); // GRAB THE ACTION HOOK
  const navigate = useNavigate();
  const { language } = useAppLanguage();
  const copy = getHomePageText(language);

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const hasPremiumFeatures = user.subscription_tier === 'gold' || user.role !== ROLES.LISTENER;

  const playlists = getRecentPlaylists();
  const latestAlbums = getLatestAlbums();
  const topSongs = getTopSongs();
  const earlyAccessReleases = getEarlyAccessReleases();

  return (
    <MainLayout>
      <Box className="min-h-screen py-4" dir={language === 'fa' ? 'rtl' : 'ltr'}>
        <MediaRow title={copy.showcase.recentPlaylists}>
          {playlists.map((playlist) => (
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

        <MediaRow title={copy.showcase.topSongs}>
          {topSongs.map((track) => (
            <MediaCard
              key={`trk-${track.id}`}
              title={track.title}
              subtitle={track.artist_name}
              imageUrl={track.cover_art}
              onClick={() => playTrack(track, topSongs)} // BOOM: Plays current track, queues remainder automatically!
            />
          ))}
        </MediaRow>

        <MediaRow title={copy.showcase.latestAlbums}>
          {latestAlbums.map((album) => (
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

        <MediaRow title={copy.showcase.earlyAccess} show={hasPremiumFeatures && earlyAccessReleases.length > 0}>
          {earlyAccessReleases.map((track) => (
            <MediaCard
              key={`ea-${track.id}`}
              title={track.title}
              subtitle={track.artist_name}
              imageUrl={track.cover_art}
              isEarlyAccess={true}
              earlyAccessLabel={copy.showcase.earlyAccessBadge}
              onClick={() => playTrack(track, earlyAccessReleases)}
            />
          ))}
        </MediaRow>
      </Box>
    </MainLayout>
  );
}