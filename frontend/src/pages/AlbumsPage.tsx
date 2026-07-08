import {
  Box,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import EmptyState from '../components/common/EmptyState';
import PageHeader from '../components/common/PageHeader';
import MusicCard from '../components/music/MusicCard';
import AddToPlaylistDialog from '../components/music/AddToPlaylistDialog';
import { getAlbumsPageText } from '../lib/constants/albumsPageText';
import { ROUTES } from '../lib/constants/routes';
import { searchCatalog, type CatalogItem } from '../lib/mock/musicService';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore'; // PLAYER CONTEXT API HOOK IMPORT
import { useAppLanguage } from '../theme/LanguageContext';
import type { Track } from '../types';

type SortOption = 'release_date' | 'listener_count';

export default function AlbumsPage() {
  const user = useAuthStore((state) => state.user);
  const playTrack = usePlayerStore((state) => state.playTrack); // PULL ACTION 
  const { language } = useAppLanguage();
  const copy = getAlbumsPageText(language);

  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('release_date');
  const [results, setResults] = useState<CatalogItem[]>([]);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [managingTrack, setManagingTrack] = useState<Track | null>(null);

  useEffect(() => {
    try {
      const fetchResults = searchCatalog(query, sortBy);
      setResults(fetchResults);
    } catch {
       setResults([]);
    }
  }, [query, sortBy]);

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const handleOpenPlaylistManager = (track: Track) => {
    setManagingTrack(track);
    setDialogOpen(true);
  };

  const handlePlayerTrigger = (track: Track) => {
     // Plays exactly this specific standalone track target correctly handling the global play action overlay trigger behavior immediately on contact.
     playTrack(track, results.filter(t => t.itemType === 'track') as Track[]);
  };

  return (
    <MainLayout>
      <Box className="min-h-screen p-4 md:p-8" dir={language === 'fa' ? 'rtl' : 'ltr'}>
        <Box sx={{ mb: { xs: 2.5, md: 4 } }}>
          <PageHeader>{copy.pageTitle}</PageHeader>
        </Box>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          sx={{
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'flex-end',
            mb: { xs: 3, md: 5 },
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flex: 1, maxWidth: { md: 500 }}}>
            <TextField
              size="small"
              fullWidth
              placeholder={copy.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              slotProps={{ input: { startAdornment: <Search size={20} className="mr-2 opacity-50" /> } }}
            />
            <TextField
              select
              size="small"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="release_date">{copy.sortLabels.releaseDate}</MenuItem>
              <MenuItem value="listener_count">{copy.sortLabels.listenerCount}</MenuItem>
            </TextField>
          </Stack>
        </Stack>

        {results.length === 0 ? (
          <EmptyState title="No music found matching your criteria." />
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(4, 1fr)',
                lg: 'repeat(5, 1fr)',
              },
              gap: { xs: 2, md: 3 },
            }}
          >
            {results.map((item) => (
              <MusicCard
                key={`${item.itemType}-${item.id}`}
                item={item}
                onTriggerPlayer={handlePlayerTrigger}
                onManagePlaylists={handleOpenPlaylistManager}
              />
            ))}
          </Box>
        )}
      </Box>

      <AddToPlaylistDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setManagingTrack(null); }}
        trackToManage={managingTrack}
      />
    </MainLayout>
  );
}
