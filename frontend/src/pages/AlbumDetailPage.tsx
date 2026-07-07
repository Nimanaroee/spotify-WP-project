import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
  Divider,
} from '@mui/material';
import { ChevronLeft, Disc3, MoreVertical, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AddToPlaylistDialog from '../components/music/AddToPlaylistDialog';
import EmptyState from '../components/common/EmptyState';
import { getAlbumsPageText } from '../lib/constants/albumsPageText';
import { ROUTES } from '../lib/constants/routes';
import { getAlbumById } from '../lib/mock/musicService';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore'; // EXPOSE ZUSTAND ROOT HOOK
import { useAppLanguage } from '../theme/LanguageContext';
import type { Album, Track } from '../types';

function formatDuration(seconds?: number): string {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function AlbumDetailPage() {
  const { albumId } = useParams();
  const user = useAuthStore((state) => state.user);
  const playTrack = usePlayerStore((state) => state.playTrack); // RETRIEVE ZUSTAND HANDLER HOOK
  
  const { language } = useAppLanguage();
  const copy = getAlbumsPageText(language);
  const isRtl = language === 'fa';

  const [albumData, setAlbumData] = useState<{ album: Album; tracks: Track[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [managingTrack, setManagingTrack] = useState<Track | null>(null);

  useEffect(() => {
    try {
      if (albumId) {
        setAlbumData(getAlbumById(Number(albumId)));
      }
    } catch (e) {
      setError(copy.messages.errorFetching);
    }
  }, [albumId, copy.messages.errorFetching]);

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  if (error) {
    return (
      <MainLayout>
        <Box p={4} dir={isRtl ? 'rtl' : 'ltr'}><Alert severity="error">{error}</Alert></Box>
      </MainLayout>
    );
  }
  if (!albumData) return <MainLayout><Box p={4} /></MainLayout>;

  const { album, tracks } = albumData;

  const handleOpenPlaylistManager = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation(); 
    setManagingTrack(track);
    setDialogOpen(true);
  };

  const handlePlayerTrigger = (track: Track) => {
     // Trigger targeted logic using actual fetched variables natively parsing inside closure memory parameters securely alongside track map context limits cleanly matching 8.2 specific criteria specs seamlessly!
     playTrack(track, tracks);
  };

  return (
    <MainLayout>
      <Box className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
        <Button
          component={RouterLink}
          to={ROUTES.ALBUMS}
          variant="outlined"
          sx={{ mb: 4 }}
          startIcon={isRtl ? undefined : <ChevronLeft size={18} />}
          endIcon={isRtl ? <ChevronLeft size={18} /> : undefined}
        >
           {copy.card.album}
        </Button>

        {/* Hero Section */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} mb={6} alignItems={{ xs: 'center', md: 'flex-end' }}>
           <Box
              sx={{
                width: { xs: 200, md: 240 },
                height: { xs: 200, md: 240 },
                bgcolor: 'background.paper',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 2,
                flexShrink: 0,
                overflow: 'hidden'
              }}
           >
              {album.cover_art ? (
                <img src={album.cover_art} alt={album.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Disc3 size={80} color="gray" />
              )}
           </Box>
           
           <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Chip label={copy.card.album} size="small" variant="outlined" sx={{ mb: 2 }} />
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>{album.title}</Typography>
              <Typography variant="h6" color="primary.main">{copy.card.by} {album.artist_name}</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {album.release_year} • {album.genre || ''} • {tracks.length} {copy.detail.trackTitle}s
              </Typography>
           </Box>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Listing Block */}
        <Paper elevation={0} sx={{ bgcolor: 'transparent' }}>
          {tracks.length === 0 ? (
             <EmptyState title={copy.detail.emptyAlbum} />
          ) : (
             <Stack spacing={1}>
                {/* Headers */}
                <Box display="flex" px={2} pb={1}>
                  <Typography variant="caption" sx={{ width: 40, color: 'text.secondary' }}>#</Typography>
                  <Typography variant="caption" sx={{ flex: 1, color: 'text.secondary' }}>{copy.detail.trackTitle}</Typography>
                  <Typography variant="caption" sx={{ width: 80, textAlign: 'center', color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>{copy.detail.duration}</Typography>
                  <Box sx={{ width: 48 }} />
                </Box>
                {tracks.map((track, idx) => (
                   <TrackRow key={track.id} track={track} index={idx} onPlay={() => handlePlayerTrigger(track)} onAdd={(e) => handleOpenPlaylistManager(e, track)} />
                ))}
             </Stack>
          )}
        </Paper>

        <AddToPlaylistDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setManagingTrack(null); }}
          trackToManage={managingTrack}
        />
      </Box>
    </MainLayout>
  );
}

function TrackRow({ track, index, onPlay, onAdd }: { track: Track; index: number; onPlay: () => void; onAdd: (e: React.MouseEvent) => void }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { language } = useAppLanguage();
  const copy = getAlbumsPageText(language);

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnchorEl(null);
  };

  return (
    <Box
      onClick={onPlay}
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 2,
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Typography color="text.secondary" sx={{ width: 40, fontWeight: 500 }}>
        {index + 1}
      </Typography>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>{track.title}</Typography>
        {track.co_artists && track.co_artists.length > 0 && (
          <Typography variant="caption" color="text.secondary">feat. {track.co_artists.join(', ')}</Typography>
        )}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ width: 80, textAlign: 'center', display: { xs: 'none', sm: 'block' } }}>
        {formatDuration(track.duration_seconds)}
      </Typography>
      
      <IconButton size="small" onClick={handleOpen} aria-label="options">
         <MoreVertical size={20} />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
         <MenuItem onClick={(e) => { handleClose(e); onAdd(e); }}>
            <Plus size={16} className="mx-2" /> {copy.menu.addToPlaylist}
         </MenuItem>
      </Menu>
    </Box>
  );
}