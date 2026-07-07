import { Box, Button, Stack } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../components/common/EmptyState'
import PageHeader from '../components/common/PageHeader'
import NotificationCard from '../components/notifications/NotificationCard'
import { getNotificationsPageText } from '../lib/constants/notificationsPageText'
import { useNotificationStore } from '../store/notificationStore'
import { useAppLanguage } from '../theme/LanguageContext'

export default function NotificationsPage() {
  const { language } = useAppLanguage()
  const copy = getNotificationsPageText(language)
  const navigate = useNavigate()

  const notifications = useNotificationStore((state) => state.notifications)
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const markAsRead = useNotificationStore((state) => state.markAsRead)
  const deleteNotification = useNotificationStore((state) => state.deleteNotification)
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead)

  return (
    <Box
      className="mx-auto max-w-3xl min-h-screen p-4 md:p-8"
      dir={language === 'fa' ? 'rtl' : 'ltr'}
    >
      <Stack
        className="mb-4"
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <PageHeader>{copy.pageTitle}</PageHeader>
        <Button
          disabled={unreadCount === 0}
          variant="contained"
          onClick={markAllAsRead}
        >
          {copy.readAll}
        </Button>
      </Stack>

      {notifications.length === 0 ? (
        <EmptyState title={copy.emptyState} />
      ) : (
        <Stack spacing={1.5}>
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              categoryLabel={copy.categoryLabels[notification.category]}
              deleteLabel={copy.deleteNotification}
              markAsReadLabel={copy.markAsRead}
              notification={notification}
              onDelete={deleteNotification}
              onMarkRead={markAsRead}
              onNavigate={(link) => navigate(link)}
            />
          ))}
        </Stack>
      )}
    </Box>
  )
}
