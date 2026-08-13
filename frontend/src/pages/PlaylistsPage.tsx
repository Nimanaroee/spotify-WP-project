import {
  Alert,
  Box,
  Button,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Plus } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import EmptyState from '../components/common/EmptyState';
import PageHeader from '../components/common/PageHeader';
import PlaylistListCard from '../components/playlists/PlaylistListCard';
import { PlaylistEditDialog, PlaylistDeleteDialog, AddSongDialog } from '../components/playlists/PlaylistDialogs';
import { getPlaylistsPageText } from '../lib/constants/playlistsPageText';
import { SUBSCRIPTION_LIMITS } from '../lib/constants/subscriptionLimits';
import { ROUTES } from '../lib/constants/routes';
import {
  getUserPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
} from '../lib/api/playlistService';
import { useAuthStore } from '../store/authStore';
import { useAppLanguage } from '../theme/LanguageContext';
import type { Playlist } from '../types';

export default function PlaylistsPage() {
  const user = useAuthStore((state) => state.user);
  const { language } = useAppLanguage();
  const copy = getPlaylistsPageText(language);

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [feedback, setFeedback] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addSongDialogOpen, setAddSongDialogOpen] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);

  async function loadPlaylists() {
    if (!user) return;
    try {
      const data = await getUserPlaylists();
      setPlaylists(data);
    } catch (err) {
      setFeedback({ msg: err instanceof Error ? err.message : copy.messages.error, severity: 'error' });
    }
  }

  useEffect(() => {
    loadPlaylists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const { playlistCount, limit, isLimitReached, tierName } = useMemo(() => {
    if (!user) return { playlistCount: 0, limit: Infinity, isLimitReached: false, tierName: 'basic' };
    const tier = user.subscription_tier ?? 'basic';
    const limitConstraint = SUBSCRIPTION_LIMITS[tier].playlistLimit;
    return {
      playlistCount: playlists.length,
      limit: limitConstraint,
      isLimitReached: limitConstraint !== Infinity && playlists.length >= limitConstraint,
      tierName: tier === 'basic' ? 'Free' : tier.charAt(0).toUpperCase() + tier.slice(1),
    };
  }, [user, playlists.length]);

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const handleOpenCreate = () => {
    setActivePlaylist(null);
    setEditDialogOpen(true);
  };

  const handleOpenRename = (playlist: Playlist) => {
    setActivePlaylist(playlist);
    setEditDialogOpen(true);
  };

  const handleOpenDelete = (playlist: Playlist) => {
    setActivePlaylist(playlist);
    setDeleteDialogOpen(true);
  };
  
  const handleOpenAddSongs = (playlist: Playlist) => {
    setActivePlaylist(playlist);
    setAddSongDialogOpen(true);
  };

  const handleSaveEdit = async (name: string, coverArt: File | null) => {
    try {
      if (activePlaylist) {
        await updatePlaylist(activePlaylist.id, name, coverArt);
        setFeedback({ msg: copy.messages.renamed, severity: 'success' });
      } else {
        await createPlaylist(name, coverArt);
        setFeedback({ msg: copy.messages.created, severity: 'success' });
      }
      setEditDialogOpen(false);
      await loadPlaylists();
    } catch (err) {
      setFeedback({ msg: err instanceof Error ? err.message : copy.messages.error, severity: 'error' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!activePlaylist) return;
    try {
      await deletePlaylist(activePlaylist.id);
      setFeedback({ msg: copy.messages.deleted, severity: 'success' });
      setDeleteDialogOpen(false);
      await loadPlaylists();
    } catch (err) {
      setFeedback({ msg: err instanceof Error ? err.message : copy.messages.error, severity: 'error' });
    }
  };

  const handleCloseAddSongs = () => {
    setAddSongDialogOpen(false);
    loadPlaylists();
  };

  const createBtn = (
    <Button
      variant="contained"
      onClick={handleOpenCreate}
      disabled={isLimitReached}
      startIcon={language !== 'fa' ? <Plus size={18} /> : undefined}
      endIcon={language === 'fa' ? <Plus size={18} /> : undefined}
    >
      {playlists.length === 0 ? copy.actions.createFirst : copy.actions.create}
    </Button>
  );

  return (
    <MainLayout>
      <Box className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto" dir={language === 'fa' ? 'rtl' : 'ltr'}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          sx={{
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            mb: { xs: 3, md: 5 },
          }}
        >
          <PageHeader subtitle={limit !== Infinity ? copy.limits.status(playlistCount, limit) : undefined}>
            {copy.pageTitle}
          </PageHeader>
          <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {isLimitReached ? (
              <Tooltip title={copy.limits.reachedTooltip(tierName, limit)} placement="bottom-end">
                <span>{createBtn}</span>
              </Tooltip>
            ) : (
              createBtn
            )}
          </Box>
        </Stack>

        {feedback && (
          <Alert severity={feedback.severity} onClose={() => setFeedback(null)} sx={{ mb: 4 }}>
            {feedback.msg}
          </Alert>
        )}

        {playlists.length === 0 ? (
          <Box onClick={handleOpenCreate} sx={{ cursor: isLimitReached ? 'default' : 'pointer' }}>
            <EmptyState title={copy.emptyState.title} />
            <Typography textAlign="center" color="text.secondary" mb={4} mt={-1}>
              {copy.emptyState.description}
            </Typography>
          </Box>
        ) : (
          playlists.map((playlist) => (
            <PlaylistListCard
              key={playlist.id}
              playlist={playlist}
              onRename={handleOpenRename}
              onDelete={handleOpenDelete}
              onOpenAddSongs={handleOpenAddSongs}
            />
          ))
        )}

        <PlaylistEditDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSave={handleSaveEdit}
          playlist={activePlaylist}
        />

        <PlaylistDeleteDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
          playlist={activePlaylist}
        />
        
        <AddSongDialog
           open={addSongDialogOpen}
           onClose={handleCloseAddSongs}
           playlist={activePlaylist}
        />
      </Box>
    </MainLayout>
  );
}