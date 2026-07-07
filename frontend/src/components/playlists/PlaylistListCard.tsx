import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import { Disc3, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { getPlaylistsPageText } from '../../lib/constants/playlistsPageText';
import { useAppLanguage } from '../../theme/LanguageContext';
import { usePlayerStore } from '../../store/playerStore'; // GET PLAYER FUNCTION OVERRIDE 
import type { Playlist, Track } from '../../types';

interface PlaylistListCardProps {
  playlist: Playlist;
  onRename: (playlist: Playlist) => void;
  onDelete: (playlist: Playlist) => void;
  onOpenAddSongs: (playlist: Playlist) => void;
}

export default function PlaylistListCard({
  playlist,
  onRename,
  onDelete,
  onOpenAddSongs,
}: PlaylistListCardProps) {
  const { language } = useAppLanguage();
  const copy = getPlaylistsPageText(language);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Use Zustand target hooks externally 
  const playTrack = usePlayerStore((state) => state.playTrack);

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'action.hover',
          p: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {playlist.name}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            startIcon={<Plus size={16} />}
            onClick={() => onOpenAddSongs(playlist)}
          >
            {copy.actions.addSongs}
          </Button>
          <IconButton
            size="small"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            aria-label="Options"
          >
            <MoreVertical size={20} />
          </IconButton>
        </Stack>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onRename(playlist);
            }}
          >
            <Pencil size={16} className="mx-2" /> {copy.actions.rename}
          </MenuItem>
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onDelete(playlist);
            }}
            sx={{ color: 'error.main' }}
          >
            <Trash2 size={16} className="mx-2" /> {copy.actions.delete}
          </MenuItem>
        </Menu>
      </Box>

      <Divider />

      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        {(!playlist.tracks || playlist.tracks.length === 0) ? (
          <Box p={3} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              {copy.list.emptyPlaylist}
            </Typography>
          </Box>
        ) : (
          <Stack divider={<Divider />} sx={{ maxHeight: 350, overflowY: 'auto' }}>
            {playlist.tracks.map((track) => (
              <Box
                key={track.id}
                onClick={() => playTrack(track, playlist.tracks)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
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
                    <img
                      src={track.cover_art}
                      alt={track.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Disc3 size={24} color="gray" />
                  )}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
                    {track.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {track.artist_name} {track.album_name && `• ${track.album_name}`}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}