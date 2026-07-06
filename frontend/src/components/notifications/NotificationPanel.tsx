import {
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  Popover,
  Stack,
  Typography,
} from '@mui/material'
import { Bell } from 'lucide-react'
import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { getNotificationsPageText } from '../../lib/constants/notificationsPageText'
import { ROUTES } from '../../lib/constants/routes'
import { useNotificationStore } from '../../store/notificationStore'
import { useAppLanguage } from '../../theme/LanguageContext'
import NotificationCard from './NotificationCard'

export default function NotificationPanel() {
  const { language } = useAppLanguage()
  const copy = getNotificationsPageText(language)
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const notifications = useNotificationStore((state) => state.notifications)
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const markAsRead = useNotificationStore((state) => state.markAsRead)
  const deleteNotification = useNotificationStore((state) => state.deleteNotification)
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead)
  const refresh = useNotificationStore((state) => state.refresh)

  const open = Boolean(anchorEl)

  function handleOpen(event: React.MouseEvent<HTMLElement>): void {
    refresh()
    setAnchorEl(event.currentTarget)
  }

  function handleClose(): void {
    setAnchorEl(null)
  }

  function handleNavigate(link: string): void {
    handleClose()
    navigate(link)
  }

  return (
    <>
      <IconButton
        aria-label={copy.openNotifications}
        color="inherit"
        onClick={handleOpen}
      >
        <Badge badgeContent={unreadCount} color="primary" max={99}>
          <Bell size={20} />
        </Badge>
      </IconButton>

      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={open}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClose={handleClose}
      >
        <Box sx={{ width: { xs: 320, sm: 400 }, maxWidth: '100vw' }}>
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
            }}
          >
            <Typography sx={{ fontWeight: 700 }} variant="subtitle1">
              {copy.panelTitle}
            </Typography>
            <Button
              disabled={unreadCount === 0}
              size="small"
              onClick={markAllAsRead}
            >
              {copy.readAll}
            </Button>
          </Stack>

          <Divider />

          <Box sx={{ maxHeight: 400, overflowY: 'auto', p: 1.5 }}>
            {notifications.length === 0 ? (
              <Typography
                className="py-6 text-center"
                color="text.secondary"
                variant="body2"
              >
                {copy.emptyState}
              </Typography>
            ) : (
              <Stack spacing={1}>
                {notifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    categoryLabel={copy.categoryLabels[notification.category]}
                    compact
                    deleteLabel={copy.deleteNotification}
                    markAsReadLabel={copy.markAsRead}
                    notification={notification}
                    onDelete={deleteNotification}
                    onMarkRead={markAsRead}
                    onNavigate={handleNavigate}
                  />
                ))}
              </Stack>
            )}
          </Box>

          <Divider />

          <Box sx={{ p: 1.5, textAlign: 'center' }}>
            <Button
              component={RouterLink}
              fullWidth
              size="small"
              to={ROUTES.NOTIFICATIONS}
              onClick={handleClose}
            >
              {copy.viewAll}
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  )
}
