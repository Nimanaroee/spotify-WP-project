import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Box,
  Stack,
  Divider,
} from '@mui/material';
import { Search, Plus, Minus, Disc3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppLanguage } from '../../theme/LanguageContext';
import { getPlaylistsPageText } from '../../lib/constants/playlistsPageText';
import { searchCatalog } from '../../lib/mock/musicService';
import { toggleTrackInPlaylist } from '../../lib/mock/playlistService';
import type { Playlist, Track } from '../../types';

interface PlaylistEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  playlist?: Playlist | null;
}

export function PlaylistEditDialog({ open, onClose, onSave, playlist }: PlaylistEditDialogProps) {
  const { language } = useAppLanguage();
  const copy = getPlaylistsPageText(language);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(playlist?.name ?? '');
      setError('');
    }
  }, [open, playlist]);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(copy.dialogs.nameRequired);
      return;
    }
    onSave(trimmed);
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" dir={language === 'fa' ? 'rtl' : 'ltr'}>
      <DialogTitle>{playlist ? copy.dialogs.renameTitle : copy.dialogs.createTitle}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label={copy.dialogs.nameLabel}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!error}
          helperText={error}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          {copy.actions.cancel}
        </Button>
        <Button onClick={handleSave} variant="contained">
          {copy.actions.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface PlaylistDeleteDialogProps {
  open: boolean;
  playlist: Playlist | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function PlaylistDeleteDialog({ open, playlist, onClose, onConfirm }: PlaylistDeleteDialogProps) {
  const { language } = useAppLanguage();
  const copy = getPlaylistsPageText(language);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" dir={language === 'fa' ? 'rtl' : 'ltr'}>
      <DialogTitle>{copy.dialogs.deleteTitle}</DialogTitle>
      <DialogContent>
        <Typography>{playlist ? copy.dialogs.deleteConfirm(playlist.name) : ''}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          {copy.actions.cancel}
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          {copy.actions.delete}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface AddSongDialogProps {
  open: boolean;
  playlist: Playlist | null;
  userId: number | null;
  onClose: () => void;
}

export function AddSongDialog({ open, playlist, userId, onClose }: AddSongDialogProps) {
  const { language } = useAppLanguage();
  const copy = getPlaylistsPageText(language);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [inPlaylistIds, setInPlaylistIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open && playlist) {
      setQuery('');
      setInPlaylistIds(new Set(playlist.tracks?.map(t => t.id) || []));
      fetchResults('');
    }
  }, [open, playlist]);

  function fetchResults(searchQuery: string) {
    const catalogData = searchCatalog(searchQuery, 'listener_count');
    const tracksOnly = catalogData.filter((item) => item.itemType === 'track') as Track[];
    setResults(tracksOnly);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    fetchResults(value);
  }

  function handleToggleTrack(trackId: number, isCurrentlyInList: boolean) {
    if (!playlist || !userId) return;

    const newState = !isCurrentlyInList;
    const nextSet = new Set(inPlaylistIds);
    if (newState) nextSet.add(trackId);
    else nextSet.delete(trackId);
    setInPlaylistIds(nextSet);

    try {
      toggleTrackInPlaylist(userId, playlist.id, trackId, newState);
    } catch (err) {
      if (isCurrentlyInList) nextSet.add(trackId);
      else nextSet.delete(trackId);
      setInPlaylistIds(nextSet);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" dir={language === 'fa' ? 'rtl' : 'ltr'}>
      <DialogTitle sx={{ fontWeight: 800 }}>{copy.dialogs.addSongsTitle}</DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: 3, pt: 1, pb: 2 }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder={copy.dialogs.searchPlaceholder}
            value={query}
            onChange={handleSearchChange}
            slotProps={{
              input: {
                startAdornment: <Search size={20} className="mr-2 opacity-50" />,
                sx: { borderRadius: 3 } // Rounded search bar
              },
            }}
          />
        </Box>

        <Divider />

        <Box sx={{ minHeight: 300, maxHeight: '60vh', overflowY: 'auto' }}>
          {results.length === 0 ? (
            <Typography textAlign="center" color="text.secondary" my={6} fontWeight={500}>
              {copy.dialogs.noResults}
            </Typography>
          ) : (
            <Stack divider={<Divider />}>
              {results.map((track) => {
                const inList = inPlaylistIds.has(track.id);
                return (
                  <Box key={track.id} sx={{ display: 'flex', alignItems: 'center', p: 2, px: 3, '&:hover': { bgcolor: 'action.hover' } }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: 'divider',
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: language === 'fa' ? 0 : 2,
                        ml: language === 'fa' ? 2 : 0,
                        overflow: 'hidden',
                      }}
                    >
                      {track.cover_art ? (
                        <img src={track.cover_art} alt={track.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Disc3 size={24} color="gray" />
                      )}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0, px: 1 }}>
                      <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>{track.title}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ fontWeight: 500 }}>
                        {track.artist_name}
                      </Typography>
                    </Box>
                    
                    <Button
                      variant={inList ? "text" : "outlined"}
                      size="small"
                      color={inList ? "error" : "primary"}
                      onClick={() => handleToggleTrack(track.id, inList)}
                      sx={{ 
                        borderRadius: 8, 
                        fontWeight: 700,
                        minWidth: { xs: 90, sm: 110 }, // Prevents buttons from jittering in size
                        ml: language === 'fa' ? 0 : 2,
                        mr: language === 'fa' ? 2 : 0
                      }}
                    >
                      {inList ? copy.actions.remove : copy.actions.add}
                    </Button>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      </DialogContent>
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Button onClick={onClose} variant="contained" fullWidth size="large" sx={{ borderRadius: 8, fontWeight: 700 }}>
          {copy.actions.save}
        </Button>
      </Box>
    </Dialog>
  );
}
