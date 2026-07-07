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
import { searchCatalog, type CatalogItem } from '../../lib/mock/musicService';
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
  
  // Track IDs currently inside the active playlist to render the toggle visual instantly
  const [inPlaylistIds, setInPlaylistIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open && playlist) {
      setQuery('');
      setInPlaylistIds(new Set(playlist.tracks?.map(t => t.id) || []));
      fetchResults('');
    }
  }, [open, playlist]);

  function fetchResults(searchQuery: string) {
    // Only return tracks from catalog search, drop full albums
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

    // Apply fast to internal state visually
    const nextSet = new Set(inPlaylistIds);
    if (newState) nextSet.add(trackId);
    else nextSet.delete(trackId);
    setInPlaylistIds(nextSet);

    // Call service to write it local storage so closing and reloading works automatically
    try {
      toggleTrackInPlaylist(userId, playlist.id, trackId, newState);
    } catch (err) {
      // Revert upon error silently in this specific UX
      if (isCurrentlyInList) nextSet.add(trackId);
      else nextSet.delete(trackId);
      setInPlaylistIds(nextSet);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" dir={language === 'fa' ? 'rtl' : 'ltr'}>
      <DialogTitle>{copy.dialogs.addSongsTitle}</DialogTitle>
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
              },
            }}
          />
        </Box>

        <Divider />

        <Box sx={{ minHeight: 300, maxHeight: 400, overflowY: 'auto' }}>
          {results.length === 0 ? (
            <Typography textAlign="center" color="text.secondary" my={4}>
              {copy.dialogs.noResults}
            </Typography>
          ) : (
            <Stack divider={<Divider />}>
              {results.map((track) => {
                const inList = inPlaylistIds.has(track.id);
                return (
                  <Box key={track.id} sx={{ display: 'flex', alignItems: 'center', p: 2, '&:hover': { bgcolor: 'action.hover' } }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: 'divider',
                        borderRadius: 1,
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
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>{track.title}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {track.artist_name}
                      </Typography>
                    </Box>
                    
                    <Button
                      variant={inList ? "text" : "outlined"}
                      size="small"
                      color={inList ? "error" : "primary"}
                      startIcon={inList ? <Minus size={16} /> : <Plus size={16} />}
                      onClick={() => handleToggleTrack(track.id, inList)}
                      sx={{ ml: 2, borderRadius: 8 }}
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
      <DialogActions sx={{ px: 3, pb: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} variant="contained" fullWidth>
          {copy.actions.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}