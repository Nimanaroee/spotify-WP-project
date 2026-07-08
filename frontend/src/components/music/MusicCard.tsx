import {
  Box,
  Card,
  CardActionArea,
  CardMedia,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import { Disc3, MoreVertical, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlbumsPageText } from '../../lib/constants/albumsPageText';
import { ROUTES, userProfilePath } from '../../lib/constants/routes';
import { getUserById } from '../../lib/mock/userProfileService';
import { useAuthStore } from '../../store/authStore';
import { useAppLanguage } from '../../theme/LanguageContext';
import type { CatalogItem } from '../../lib/mock/musicService';
import type { Track } from '../../types';

interface MusicCardProps {
  item: CatalogItem;
  onTriggerPlayer: (track: Track) => void;
  onManagePlaylists: (track: Track) => void;
}

export default function MusicCard({ item, onTriggerPlayer, onManagePlaylists }: MusicCardProps) {
  const { language } = useAppLanguage();
  const copy = getAlbumsPageText(language);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const isAlbum = item.itemType === 'album';
  const showGoldStats = !isAlbum && user?.subscription_tier === 'gold';

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleCardClick = () => {
    if (isAlbum) {
      navigate(`${ROUTES.ALBUMS}/${item.id}`);
    } else {
      onTriggerPlayer(item as Track);
    }
  };

  const handleContextOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };

  const handleAddToPlaylistClick = () => {
    setMenuAnchor(null);
    if (!isAlbum) onManagePlaylists(item as Track);
  };

  const goToArtist = (e: React.MouseEvent) => {
    e.stopPropagation();
    const artist = getUserById(item.artist_id);
    navigate(userProfilePath(artist?.username ?? String(item.artist_id)));
  };

  const goToAlbum = (e: React.MouseEvent, targetAlbumId: number) => {
    e.stopPropagation();
    navigate(`${ROUTES.ALBUMS}/${targetAlbumId}`);
  };

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ position: 'relative' }}>
        <CardActionArea onClick={handleCardClick}>
          <Box
            sx={{
              width: '100%',
              aspectRatio: '1/1',
              bgcolor: 'background.default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {item.cover_art ? (
              <CardMedia
                component="img"
                image={item.cover_art}
                alt={item.title}
                sx={{ height: '100%', width: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Disc3 size={60} color="gray" />
            )}
          </Box>
        </CardActionArea>
        
        {/* Hover-independent Context Action - Keep pinned top right on visual */}
        {!isAlbum && (
           <IconButton
             size="small"
             onClick={handleContextOpen}
             sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'action.hover' } }}
           >
             <MoreVertical size={16} />
           </IconButton>
        )}
      </Box>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={handleAddToPlaylistClick}>
          <Plus size={16} className="mx-2" /> {copy.menu.addToPlaylist}
        </MenuItem>
      </Menu>

      <Box sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, flex: 1, cursor: 'pointer' }} onClick={handleCardClick}>
            {item.title}
          </Typography>
        </Stack>

        <Typography variant="body2" color="primary.main" noWrap onClick={goToArtist} sx={{ cursor: 'pointer', mb: 0.5, '&:hover': { textDecoration: 'underline' } }}>
          {item.artist_name}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Chip label={isAlbum ? copy.card.album : copy.card.single} size="small" variant="outlined" />
        </Stack>

        {(!isAlbum && 'album_id' in item && item.album_id) ? (
          <Typography variant="caption" display="block" mt={1} color="text.secondary" onClick={(e) => goToAlbum(e, item.album_id as number)} sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' }}}>
            {item.album_name}
          </Typography>
        ) : null}

        {showGoldStats && (
          <Box mt={1} pt={1} sx={{ borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" display="block" color="text.secondary">
               {copy.card.streams(item.stream_count ?? 0)}
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
               {copy.card.listeners(item.listener_count ?? 0)}
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
}
