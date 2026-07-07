import {
  Chip,
  IconButton,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material'
import { Pencil, Trash2 } from 'lucide-react'
import ScrollableTableContainer from '../common/ScrollableTableContainer'
import { getArtworkManagementPageText } from '../../lib/constants/artworkManagementPageText'
import { getTrackStats } from '../../lib/mock/musicService'
import { useAppLanguage } from '../../theme/LanguageContext'
import type { Track } from '../../types/music'

interface ReleaseListProps {
  artistId: number
  releases: Track[]
  onEdit: (track: Track) => void
  onDelete: (track: Track) => void
}

function formatRevenue(value: number): string {
  return `$${value.toFixed(2)}`
}

export default function ReleaseList({
  artistId,
  releases,
  onEdit,
  onDelete,
}: ReleaseListProps) {
  const { language } = useAppLanguage()
  const copy = getArtworkManagementPageText(language)

  return (
    <ScrollableTableContainer minWidth={{ xs: 640, md: 'auto' }}>
      <TableHead>
        <TableRow>
          <TableCell>{copy.list.title}</TableCell>
          <TableCell>{copy.list.type}</TableCell>
          <TableCell align="right">{copy.list.listeners}</TableCell>
          <TableCell align="right">{copy.list.streams}</TableCell>
          <TableCell align="right">{copy.list.revenue}</TableCell>
          <TableCell align="right">{copy.list.actions}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {releases.map((track) => {
          const stats = getTrackStats(track.id, artistId)
          const typeLabel =
            track.release_type === 'album' ? copy.list.album : copy.list.single

          return (
            <TableRow key={track.id} hover>
              <TableCell>
                {track.title}
                {track.album_name ? ` (${track.album_name})` : ''}
              </TableCell>
              <TableCell>
                <Chip label={typeLabel} size="small" variant="outlined" />
              </TableCell>
              <TableCell align="right">{stats.listener_count}</TableCell>
              <TableCell align="right">{stats.stream_count}</TableCell>
              <TableCell align="right">{formatRevenue(stats.revenue)}</TableCell>
              <TableCell align="right">
                <Tooltip title={copy.list.edit}>
                  <IconButton aria-label={copy.list.edit} onClick={() => onEdit(track)}>
                    <Pencil size={18} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={copy.list.delete}>
                  <IconButton
                    aria-label={copy.list.delete}
                    color="error"
                    onClick={() => onDelete(track)}
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </ScrollableTableContainer>
  )
}
