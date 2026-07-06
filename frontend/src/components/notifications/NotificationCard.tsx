import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import { format } from 'date-fns'
import type { Notification } from '../../types/notification'

interface NotificationCardProps {
  notification: Notification
  categoryLabel: string
  markAsReadLabel: string
  deleteLabel: string
  compact?: boolean
  onMarkRead: (id: number) => void
  onDelete: (id: number) => void
  onNavigate?: (link: string) => void
}

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), 'MMM d, yyyy HH:mm')
  } catch {
    return iso
  }
}

export default function NotificationCard({
  notification,
  categoryLabel,
  markAsReadLabel,
  deleteLabel,
  compact = false,
  onMarkRead,
  onDelete,
  onNavigate,
}: NotificationCardProps) {
  const theme = useTheme()
  const isUnread = !notification.is_read
  const hasLink = Boolean(notification.link && onNavigate)

  function handleContentClick(): void {
    if (notification.link && onNavigate) {
      onNavigate(notification.link)
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: compact ? 1.5 : 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: isUnread
          ? alpha(theme.palette.primary.main, 0.08)
          : 'background.paper',
        cursor: hasLink ? 'pointer' : 'default',
      }}
      onClick={hasLink ? handleContentClick : undefined}
    >
      <Stack direction="row" spacing={1.5}>
        {isUnread ? (
          <Box
            aria-hidden
            sx={{
              mt: 0.75,
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              flexShrink: 0,
            }}
          />
        ) : (
          <Box sx={{ width: 8, flexShrink: 0 }} />
        )}

        <Stack className="min-w-0 flex-1" spacing={0.75}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={0.5}
            sx={{
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <Stack spacing={0.25}>
              <Typography sx={{ fontWeight: isUnread ? 700 : 600 }} variant="subtitle2">
                {notification.title}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                {formatDate(notification.created_at)}
              </Typography>
            </Stack>
            <Chip label={categoryLabel} size="small" variant="outlined" />
          </Stack>

          <Typography color="text.secondary" variant="body2">
            {notification.message}
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              aria-label={markAsReadLabel}
              disabled={notification.is_read}
              size="small"
              variant="outlined"
              onClick={() => onMarkRead(notification.id)}
            >
              {markAsReadLabel}
            </Button>
            <Button
              aria-label={deleteLabel}
              color="error"
              size="small"
              variant="outlined"
              onClick={() => onDelete(notification.id)}
            >
              {deleteLabel}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  )
}
