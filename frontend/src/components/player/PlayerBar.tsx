import { CacheProvider } from '@emotion/react';
import {
  Badge,
  Box,
  Dialog,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Slider,
  Stack,
  ThemeProvider,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ChevronDown,
  Disc3,
  ListMusic,
  Mic2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlayerText } from '../../lib/constants/playerText';
import { userProfilePath } from '../../lib/constants/routes';
import { getTrackStats } from '../../lib/mock/musicService';
import { getUserById } from '../../lib/mock/userProfileService';
import { useAuthStore } from '../../store/authStore';
import { usePlayerStore } from '../../store/playerStore';
import { useAppLanguage } from '../../theme/LanguageContext';
import { emotionCacheLtr } from '../../theme/emotionCache';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlayerBar() {
  const globalTheme = useTheme();
  const isMobile = useMediaQuery(globalTheme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { language } = useAppLanguage();
  const copy = getPlayerText(language);
  const user = useAuthStore((state) => state.user);
  const isRtlTheme = language === 'fa';

  const audioRef = useRef<HTMLAudioElement>(null);

  const ltrTheme = useMemo(
    () => ({
      ...globalTheme,
      direction: 'ltr' as const,
    }),
    [globalTheme]
  );

  const {
    currentTrack,
    isPlaying,
    progressSeconds,
    durationSeconds,
    volume,
    shuffle,
    repeatMode,
    isExpanded,
    queue,
    isQueueOpen,
    isLyricsOpen,
    toggleExpanded,
    pause,
    resume,
    next,
    prev,
    seek,
    setDuration,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    toggleQueue,
    toggleLyrics,
    removeFromQueue,
    tick,
  } = usePlayerStore();

  const [goldStats, setGoldStats] = useState<{ streams: number; listeners: number } | null>(null);

  const hasRealAudio = Boolean(currentTrack?.audio_url && currentTrack.audio_url.length > 5);

  // Sync internal progress resetting the audio component natively when Zustand commands 0
  useEffect(() => {
     if (progressSeconds === 0 && hasRealAudio && audioRef.current) {
         audioRef.current.currentTime = 0;
         if (isPlaying) {
             audioRef.current.play().catch(e => console.error(e));
         }
     }
  }, [progressSeconds, isPlaying, hasRealAudio]);

  useEffect(() => {
    if (audioRef.current && hasRealAudio) {
      if (isPlaying) {
        audioRef.current.play().catch((e) => console.log('Autoplay prevented: ', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, hasRealAudio, currentTrack?.id]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleSeek = (val: number) => {
    seek(val);
    if (hasRealAudio && audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    prev();
    if (audioRef.current && hasRealAudio) {
      audioRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !hasRealAudio) {
      interval = setInterval(() => tick(), 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, tick, hasRealAudio]);

  useEffect(() => {
    if (user?.subscription_tier === 'gold' && currentTrack) {
      try {
        const stats = getTrackStats(currentTrack.id, currentTrack.artist_id);
        setGoldStats({ streams: stats.stream_count, listeners: stats.listener_count });
      } catch (e) {
        setGoldStats(null);
      }
    } else {
      setGoldStats(null);
    }
  }, [currentTrack, user]);

  if (!currentTrack) return null;

  const handleCloseSubPanel = () => {
    if (isQueueOpen) toggleQueue();
    else toggleLyrics();
  };

  const trackInfoContent = (
    <Stack direction="row" spacing={2} alignItems="center" dir="ltr" sx={{ direction: 'ltr' }}>
      <Box
        sx={{
          width: { xs: 48, md: 56 },
          height: { xs: 48, md: 56 },
          bgcolor: 'background.default',
          borderRadius: 1,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {currentTrack.cover_art ? (
          <img src={currentTrack.cover_art} alt={currentTrack.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Disc3 size={32} color="gray" />
        )}
      </Box>
      <Box sx={{ minWidth: 0, textAlign: 'left' }}>
        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>
          {currentTrack.title}
        </Typography>
        <Typography
          variant="caption"
          noWrap
          sx={{
            display: 'block',
            cursor: 'pointer',
            color: 'text.secondary',
            '&:hover': { color: 'primary.main', textDecoration: 'underline' }
          }}
          onClick={(e) => {
            e.stopPropagation();
            const artist = getUserById(currentTrack.artist_id);
            navigate(userProfilePath(artist?.username ?? String(currentTrack.artist_id)));
            if (isExpanded) toggleExpanded();
          }}
        >
          {currentTrack.artist_name} {currentTrack.album_name && ` • ${currentTrack.album_name}`}
        </Typography>

        {user?.subscription_tier === 'gold' && goldStats && (
          <Typography variant="caption" display="block" color="warning.main" noWrap mt={0.5}>
            {copy.stats.streams(goldStats.streams)} • {copy.stats.listeners(goldStats.listeners)}
          </Typography>
        )}
      </Box>
    </Stack>
  );

  const mainControls = (
    <Stack alignItems="center" spacing={1} sx={{ width: '100%', direction: 'ltr' }} dir="ltr">
      <Stack direction="row" spacing={1.5} alignItems="center">
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleShuffle(); }} color={shuffle ? "primary" : "default"}>
          <Shuffle size={18} />
        </IconButton>
        <IconButton size="small" onClick={handlePrev}>
          <SkipBack size={20} />
        </IconButton>
        
        <IconButton
          onClick={(e) => { e.stopPropagation(); isPlaying ? pause() : resume(); }}
          sx={{ bgcolor: 'text.primary', color: 'background.paper', '&:hover': { bgcolor: 'text.secondary' } }}
        >
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
        </IconButton>
        
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); next(true); }}>
          <SkipForward size={20} />
        </IconButton>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleRepeat(); }} color={repeatMode !== 'none' ? "primary" : "default"}>
          <Badge badgeContent={repeatMode === 'one' ? 1 : 0} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: 8, height: 14, minWidth: 14, p: 0 } }}>
             {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
          </Badge>
        </IconButton>
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', px: 2 }}>
        <Typography variant="caption" sx={{ minWidth: 35, textAlign: 'right' }}>
          {formatTime(progressSeconds)}
        </Typography>
        <Slider
          size="small"
          value={progressSeconds}
          min={0}
          max={durationSeconds}
          onChange={(e, val) => handleSeek(val as number)}
          onClick={(e) => e.stopPropagation()} 
          sx={{ transform: 'none' }}
        />
        <Typography variant="caption" sx={{ minWidth: 35, textAlign: 'left' }}>
          {formatTime(durationSeconds)}
        </Typography>
      </Stack>
    </Stack>
  );

  const subPanelDisplay = (
    <Drawer
      anchor={isMobile ? "bottom" : "right"} // Slide up from bottom on mobile
      open={isQueueOpen || isLyricsOpen}
      onClose={handleCloseSubPanel}
      variant={isMobile ? "temporary" : "persistent"}
      sx={{
        zIndex: 1400, // CRITICAL FIX: Forces it to render above both the Dialog (1300) and Paper (1200)
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 320 },
          height: isMobile ? '85vh' : '100%', // Makes it 85% of screen height on mobile like a native app sheet
          mt: isMobile ? 0 : 8,
          pb: isMobile ? 4 : 12,
          borderTopLeftRadius: isMobile ? 24 : 0, // Rounded top corners on mobile
          borderTopRightRadius: isMobile ? 24 : 0,
        }
      }}
    >
      <Box p={3} sx={{ height: '100%', overflowY: 'auto', direction: 'ltr', textAlign: 'left' }} dir="ltr">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} sx={{ width: '100%' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, m: 0 }}>
             {isQueueOpen ? copy.queue : copy.lyrics}
          </Typography>
          <IconButton onClick={handleCloseSubPanel} aria-label={copy.actions.collapse}>
            <X size={24} />
          </IconButton>
        </Stack>

        {isQueueOpen && (
          <Box>
            {queue.length === 0 ? (
              <Typography color="text.secondary" variant="body2">{copy.emptyQueue}</Typography>
            ) : (
              <List sx={{ p: 0 }}>
                {queue.map(t => (
                  <ListItem
                    key={t.id}
                    sx={{ px: 0, '&:hover .del-btn': { opacity: 1 } }}
                    secondaryAction={
                      <IconButton edge="end" className="del-btn" sx={{ opacity: { xs: 1, md: 0 } }} onClick={() => removeFromQueue(t.id)}>
                        <Trash2 size={16} />
                      </IconButton>
                    }
                  >
                    <ListItemText 
                      primary={t.title} 
                      secondary={t.artist_name}
                      primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 600 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}

        {isLyricsOpen && (
           <Typography sx={{ whiteSpace: 'pre-line', lineHeight: 2, fontSize: '0.9rem' }}>
              {currentTrack.lyrics || copy.noLyrics}
           </Typography>
        )}
      </Box>
    </Drawer>
  );

  const innerUI = isMobile ? (
    <>
      <Dialog fullScreen open={isExpanded} onClose={toggleExpanded} TransitionProps={{ unmountOnExit: true }}>
        <Box dir="ltr" sx={{ direction: 'ltr', height: '100%', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <IconButton onClick={toggleExpanded}><ChevronDown /></IconButton>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Spotify WP</Typography>
          </Box>

          <Box flex={1} display="flex" flexDirection="column" alignItems="center" justifyContent="center" mb={4}>
              <Box sx={{ width: '85vw', height: '85vw', maxWidth: 300, maxHeight: 300, bgcolor: 'background.default', borderRadius: 4, mb: 4, overflow: 'hidden', boxShadow: 3 }}>
                {currentTrack.cover_art ? <img src={currentTrack.cover_art} alt={currentTrack.title} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : <Disc3 size={100} color="gray"/>}
              </Box>
              
              <Box textAlign="center" width="100%">
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>{currentTrack.title}</Typography>
                <Typography color="text.secondary">{currentTrack.artist_name}</Typography>
                {user?.subscription_tier === 'gold' && goldStats && (
                  <Typography variant="caption" color="warning.main" mt={1} display="block">
                    {copy.stats.streams(goldStats.streams)} • {copy.stats.listeners(goldStats.listeners)}
                  </Typography>
                )}
              </Box>
          </Box>

          {/* Main Controls adapted for Mobile Expanded View */}
          <Stack alignItems="center" spacing={1} sx={{ width: '100%', direction: 'ltr', px: 2, mb: 4 }}> 
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleShuffle(); }} color={shuffle ? "primary" : "default"}>
                <Shuffle size={18} />
              </IconButton>
              <IconButton size="small" onClick={handlePrev}>
                <SkipBack size={20} />
              </IconButton>
              
              <IconButton
                onClick={(e) => { e.stopPropagation(); isPlaying ? pause() : resume(); }}
                sx={{ bgcolor: 'text.primary', color: 'background.paper', '&:hover': { bgcolor: 'text.secondary' }, width: 48, height: 48 }} 
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
              </IconButton>
              
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); next(true); }}>
                <SkipForward size={20} />
              </IconButton>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleRepeat(); }} color={repeatMode !== 'none' ? "primary" : "default"}>
                <Badge badgeContent={repeatMode === 'one' ? 1 : 0} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: 8, height: 14, minWidth: 14, p: 0 } }}>
                   {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
                </Badge>
              </IconButton>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
              <Typography variant="caption" sx={{ minWidth: 35, textAlign: 'right' }}>
                {formatTime(progressSeconds)}
              </Typography>
              <Slider
                size="small"
                value={progressSeconds}
                min={0}
                max={durationSeconds}
                onChange={(e, val) => handleSeek(val as number)}
                onClick={(e) => e.stopPropagation()}
                sx={{ transform:'none', flexGrow: 1 }} 
              />
              <Typography variant="caption" sx={{ minWidth: 35, textAlign: 'left' }}>
                {formatTime(durationSeconds)}
              </Typography>
            </Stack>
          </Stack>

          <Stack direction="row" justifyContent="center" spacing={3} mt={4}>
              <IconButton onClick={toggleLyrics} color={isLyricsOpen ? 'primary' : 'default'}><Mic2 size={24} /></IconButton>
              <IconButton onClick={toggleQueue}><ListMusic size={20}/></IconButton>
          </Stack>
        </Box>
      </Dialog>

      {/* MOVED: subPanelDisplay is now outside the Dialog so it works natively regardless of expanded state */}
      {subPanelDisplay}

      <Paper
        elevation={8}
        dir="ltr"
        sx={{
          direction: 'ltr',
          position: 'fixed',
          bottom: 60, 
          left: 8,
          right: 8,
          height: 72, 
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: 1, borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          zIndex: 1200,
          cursor: 'pointer',
        }}
        onClick={toggleExpanded}
      >
        {/* Track Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, maxWidth: '40%' }}> 
          {trackInfoContent}
        </Box>

        {/* Playback Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, justifyContent: 'center', ml: 1, mr: 1 }}> 
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handlePrev(); }}>
            <SkipBack size={20} />
          </IconButton>
          <IconButton
            onClick={(e) => { e.stopPropagation(); isPlaying ? pause() : resume(); }}
            sx={{ bgcolor: 'text.primary', color: 'background.paper', '&:hover': { bgcolor: 'text.secondary' }, width: 40, height: 40, mx: 1 }} 
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-[2px]" />}
          </IconButton>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); next(true); }}>
            <SkipForward size={20} />
          </IconButton>
        </Box>

        {/* Sub Menu & Progress */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {/* ADDED stopPropagation and Mic icon to mini-player */}
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleLyrics(); }} color={isLyricsOpen ? 'primary' : 'default'}>
            <Mic2 size={18} />
          </IconButton>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleQueue(); }} color={isQueueOpen ? 'primary' : 'default'}>
            <ListMusic size={18} />
          </IconButton>
        </Box>
        
        {/* Visual Progress Bar */}
        <Box sx={{ position: 'absolute', bottom: 0, left: 16, right: 16, height: 2, bgcolor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            <Box sx={{ width: `${(durationSeconds > 0 ? (progressSeconds / durationSeconds) * 100 : 0)}%`, height: '100%', bgcolor: 'primary.main' }} />
        </Box>
      </Paper>
    </>
  ) : (
    // Desktop Layout (No changes here, preserving existing structure)
    <>
      <Paper
        elevation={8}
        dir="ltr"
        sx={{
          direction: 'ltr',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 90,
          bgcolor: 'background.paper',
          borderTop: 1, borderColor: 'divider',
          display: 'grid',
          gridTemplateColumns: '1fr 2fr 1fr',
          alignItems: 'center',
          px: 2,
          zIndex: 1300,
        }}
      >
        <Box>{trackInfoContent}</Box>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ maxWidth: 600, width: '100%' }}>{mainControls}</Box>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="flex-end" sx={{ direction: 'ltr' }} dir="ltr">
          <IconButton size="small" color={isLyricsOpen ? 'primary' : 'default'} onClick={toggleLyrics}>
            <Mic2 size={18} />
          </IconButton>
          <IconButton size="small" color={isQueueOpen ? 'primary' : 'default'} onClick={toggleQueue}>
            <ListMusic size={18} />
          </IconButton>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ width: 100 }}>
             <Volume2 size={18} />
             <Slider
               size="small"
               value={volume}
               min={0} max={100}
               onChange={(e, val) => setVolume(val as number)}
               sx={{ transform: 'none' }}
             />
          </Stack>
        </Stack>
      </Paper>

      {subPanelDisplay}
    </>
  );

  return (
    <CacheProvider value={emotionCacheLtr}>
      <ThemeProvider theme={ltrTheme}>
        <audio
          ref={audioRef}
          src={hasRealAudio ? currentTrack.audio_url : undefined}
          autoPlay={isPlaying && hasRealAudio}
          onLoadedMetadata={(e) => {
            if (hasRealAudio && isFinite(e.currentTarget.duration)) {
              setDuration(Math.round(e.currentTarget.duration));
            }
          }}
          onTimeUpdate={(e) => {
            if (hasRealAudio) seek(e.currentTarget.currentTime);
          }}
          onEnded={() => {
            if (hasRealAudio) {
              if (repeatMode === 'one' && audioRef.current) {
                 audioRef.current.currentTime = 0;
                 audioRef.current.play().catch(e => console.error(e));
              } else {
                 next();
              }
            }
          }}
          hidden
        />
        {innerUI}
      </ThemeProvider>
    </CacheProvider>
  );
}
