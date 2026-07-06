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

export default function ArtistReleaseCard({ release }: { release: Album | Track }) {
  const isAlbum = release.release_type === 'album'

  return (
    <Paper className="p-4" variant="outlined">
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
