import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { getUserPlaylists, toggleTrackInPlaylist } from '../../lib/mock/playlistService';
import { getAlbumsPageText } from '../../lib/constants/albumsPageText';
import { useAuthStore } from '../../store/authStore';
import { useAppLanguage } from '../../theme/LanguageContext';
import type { Playlist, Track } from '../../types';

interface AddToPlaylistDialogProps {
  open: boolean;
  onClose: () => void;
  trackToManage: Track | null;
}

export default function AddToPlaylistDialog({ open, onClose, trackToManage }: AddToPlaylistDialogProps) {
  const { language } = useAppLanguage();
  const copy = getAlbumsPageText(language);
  const user = useAuthStore((state) => state.user);

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  // Use state to keep immediate UI snappy rather than forcing an external refetch each tick
  const [internalSelections, setInternalSelections] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (open && user && trackToManage) {
      const data = getUserPlaylists(user.id);
      setPlaylists(data);

      const selections: Record<number, boolean> = {};
      data.forEach(p => {
        const contains = p.tracks?.some(t => t.id === trackToManage.id) ?? false;
        selections[p.id] = contains;
      });
      setInternalSelections(selections);
    }
  }, [open, user, trackToManage]);

  const handleToggle = (playlistId: number, newState: boolean) => {
    if (!user || !trackToManage) return;

    // Fast-apply to state for immediate checkbox visual
    setInternalSelections((prev) => ({ ...prev, [playlistId]: newState }));

    try {
      toggleTrackInPlaylist(user.id, playlistId, trackToManage.id, newState);
    } catch (e) {
      // Revert upon generic error
      setInternalSelections((prev) => ({ ...prev, [playlistId]: !newState }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" dir={language === 'fa' ? 'rtl' : 'ltr'}>
      <DialogTitle>{copy.dialogs.addToPlaylistTitle}</DialogTitle>
      <DialogContent>
        {playlists.length === 0 ? (
          <Typography color="text.secondary" my={2} textAlign="center">
            {copy.dialogs.noPlaylists}
          </Typography>
        ) : (
          <Stack mt={1} spacing={1}>
            {playlists.map(pl => (
              <Box key={pl.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 1, borderColor: 'divider', px: 2, py: 0.5, borderRadius: 2 }}>
                <FormControlLabel
                  control={<Checkbox checked={internalSelections[pl.id] ?? false} onChange={(e) => handleToggle(pl.id, e.target.checked)} />}
                  label={pl.name}
                  sx={{ width: '100%' }}
                />
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained">{copy.dialogs.done}</Button>
      </DialogActions>
    </Dialog>
  );
}