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
import { usePlayerStore } from '../../store/playerStore'; 
import type { Playlist } from '../../types';

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
  
  const playTrack = usePlayerStore((state) => state.playTrack);

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', mb: 3, borderRadius: 3, overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          bgcolor: 'background.paper',
          p: { xs: 2.5, sm: 3 },
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {playlist.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mt: 0.5, display: 'block' }}>
            {playlist.track_count || playlist.tracks?.length || 0} {language === 'fa' ? 'قطعه' : 'tracks'}
          </Typography>
        </Box>

        <Stack 
          direction="row" 
          spacing={1.5} 
          alignItems="center" 
          sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}
        >
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={language !== 'fa' ? <Plus size={16} /> : undefined}
            endIcon={language === 'fa' ? <Plus size={16} /> : undefined}
            onClick={() => onOpenAddSongs(playlist)}
            sx={{ borderRadius: 8, px: 2, fontWeight: 700, boxShadow: 'none' }}
          >
            {copy.actions.addSongs}
          </Button>
          <IconButton
            size="small"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            aria-label="Options"
            sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'divider' } }}
          >
            <MoreVertical size={18} />
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

      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 }, bgcolor: 'action.hover' }}>
        {(!playlist.tracks || playlist.tracks.length === 0) ? (
          <Box py={5} px={3} textAlign="center">
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
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
                  pl: { xs: 2.5, sm: 3 },
                  pr: { xs: 2.5, sm: 3 },
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  '&:hover': { bgcolor: 'background.paper' },
                }}
              >
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
                  <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>
                    {track.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ fontWeight: 500 }}>
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