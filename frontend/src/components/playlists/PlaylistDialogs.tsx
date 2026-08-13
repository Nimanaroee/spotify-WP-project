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
import { Search, Disc3, ImagePlus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAppLanguage } from '../../theme/LanguageContext';
import { getPlaylistsPageText } from '../../lib/constants/playlistsPageText';
import { searchCatalog } from '../../lib/api/catalogService';
import { toggleTrackInPlaylist } from '../../lib/api/playlistService';
import type { Playlist, Track } from '../../types';

interface PlaylistEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, coverArt: File | null) => void;
  playlist?: Playlist | null;
}

export function PlaylistEditDialog({ open, onClose, onSave, playlist }: PlaylistEditDialogProps) {
  const { language } = useAppLanguage();
  const copy = getPlaylistsPageText(language);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(playlist?.name ?? '');
      setError('');
      setCoverFile(null);
      setCoverPreview(playlist?.cover_art ?? null);
    }
  }, [open, playlist]);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(copy.dialogs.nameRequired);
      return;
    }
    onSave(trimmed, coverFile);
  }

  function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(copy.dialogs.imageTooLarge);
      return;
    }

    setCoverFile(file);
    if (coverPreview && coverPreview.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreview);
    }
    setCoverPreview(URL.createObjectURL(file));
    setError('');
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" dir={language === 'fa' ? 'rtl' : 'ltr'}>
      <DialogTitle>{playlist ? copy.dialogs.renameTitle : copy.dialogs.createTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} mt={1}>
          {/* Task 1: Centered Upload Box */}
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                width: 160,
                height: 160,
                bgcolor: 'action.hover',
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
                mx: 'auto', // Center horizontally
                '&:hover .overlay': { opacity: 1 },
              }}
            >
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="Cover Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <Box
                    className="overlay"
                    sx={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <ImagePlus color="white" size={32} />
                  </Box>
                </>
              ) : (
                <Stack alignItems="center" spacing={1} color="text.secondary">
                  <ImagePlus size={32} />
                  <Typography variant="caption">{copy.dialogs.uploadCover}</Typography>
                </Stack>
              )}
            </Box>
            <input
              type="file"
              accept="image/jpeg, image/png, image/webp"
              hidden
              ref={fileInputRef}
              onChange={handleCoverUpload}
            />
          </Box>

          <TextField
            autoFocus
            fullWidth
            label={copy.dialogs.nameLabel}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!error}
            helperText={error}
          />
        </Stack>
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
  onClose: () => void;
}

export function AddSongDialog({ open, playlist, onClose }: AddSongDialogProps) {
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

  async function fetchResults(searchQuery: string) {
    try {
      const catalogData = await searchCatalog(searchQuery, 'listener_count');
      const tracksOnly = catalogData.filter((item: any) => item.itemType === 'track');
      setResults(tracksOnly);
    } catch (err) {
      console.error(err);
    }
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    fetchResults(value);
  }

  async function handleToggleTrack(trackId: number, isCurrentlyInList: boolean) {
    if (!playlist) return;

    const newState = !isCurrentlyInList;
    const nextSet = new Set(inPlaylistIds);
    if (newState) nextSet.add(trackId);
    else nextSet.delete(trackId);
    
    setInPlaylistIds(nextSet);

    try {
      await toggleTrackInPlaylist(playlist.id, trackId, newState);
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
                sx: { borderRadius: 3 }
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
                      onClick={() => void handleToggleTrack(track.id, inList)}
                      sx={{ 
                        borderRadius: 8, 
                        fontWeight: 700,
                        minWidth: { xs: 90, sm: 110 },
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