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
import { getUserPlaylists, toggleTrackInPlaylist } from '../../lib/api/playlistService';
import { getAlbumsPageText } from '../../lib/constants/albumsPageText';
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

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [internalSelections, setInternalSelections] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let active = true;
    if (open && trackToManage) {
      getUserPlaylists().then(data => {
        if (!active) return;
        setPlaylists(data);
        const selections: Record<number, boolean> = {};
        data.forEach(p => {
          const contains = p.tracks?.some(t => t.id === trackToManage.id) ?? false;
          selections[p.id] = contains;
        });
        setInternalSelections(selections);
      }).catch(console.error);
    }
    return () => { active = false; };
  }, [open, trackToManage]);

  const handleToggle = async (playlistId: number, newState: boolean) => {
    if (!trackToManage) return;

    // Optimistic UI update
    setInternalSelections((prev) => ({ ...prev, [playlistId]: newState }));

    try {
      await toggleTrackInPlaylist(playlistId, trackToManage.id, newState);
    } catch (e) {
      // Revert upon API error
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
                  control={<Checkbox checked={internalSelections[pl.id] ?? false} onChange={(e) => void handleToggle(pl.id, e.target.checked)} />}
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