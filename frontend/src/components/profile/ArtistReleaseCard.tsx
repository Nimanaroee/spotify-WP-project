import { Box, Paper, Stack, Typography } from '@mui/material'

import type { Album, Track } from '../../types'

function formatDuration(seconds?: number): string {
  if (!seconds) {
    return ''
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

export default function ArtistReleaseCard({
  release,
  onSelect,
}: {
  release: Album | Track
  onSelect?: (release: Album | Track) => void
}) {
  const isAlbum = release.release_type === 'album'
  const isClickable = Boolean(onSelect)

  return (
    <Paper
      className="p-4"
      onClick={() => onSelect?.(release)}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      variant="outlined"
      onKeyDown={(event) => {
        if (!isClickable) {
          return
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect?.(release)
        }
      }}
      sx={{
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'background-color 0.2s, border-color 0.2s',
        ...(isClickable
          ? {
              '&:hover': {
                bgcolor: 'action.hover',
                borderColor: 'primary.main',
              },
            }
          : {}),
      }}
    >
      <Stack direction="row" spacing={2}>
        <Box
          sx={{
            alignItems: 'center',
            bgcolor: 'background.default',
            borderRadius: 2,
            display: 'flex',
            flexShrink: 0,
            height: 72,
            justifyContent: 'center',
            overflow: 'hidden',
            width: 72,
          }}
        >
          {release.cover_art ? (
            <Box
              alt={`Album cover for ${release.title}`}
              component="img"
              src={release.cover_art}
              sx={{ height: '100%', objectFit: 'cover', width: '100%' }}
            />
          ) : (
            <Typography sx={{ fontWeight: 800 }}>
              {release.title.charAt(0).toUpperCase()}
            </Typography>
          )}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700 }}>{release.title}</Typography>
          <Typography color="text.secondary" variant="body2">
            {[
              release.release_year,
              release.genre,
              isAlbum && 'track_count' in release && release.track_count
                ? `${release.track_count} tracks`
                : formatDuration((release as Track).duration_seconds),
            ]
              .filter(Boolean)
              .join(' • ')}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}
