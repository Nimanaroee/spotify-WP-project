import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material'
import { MemoryRouter } from 'react-router-dom'
import NotificationsPage from './NotificationsPage'
import { ROLES } from '../lib/constants/roles'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { ThemeModeContext } from '../theme/ThemeModeContext'
import type { Notification } from '../types/notification'

const createdAt = '2026-01-01T00:00:00.000Z'

const notifications: Notification[] = [
  {
    id: 1,
    recipient_id: 1,
    category: 'subscription_expiring',
    title: 'Expiring soon',
    message: 'Renew your plan',
    is_read: false,
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: 2,
    recipient_id: 1,
    category: 'new_release',
    title: 'New release',
    message: 'Listen now',
    is_read: false,
    created_at: createdAt,
    updated_at: createdAt,
  },
]

function renderNotificationsPage() {
  return render(
    <ThemeModeContext.Provider value={{ mode: 'dark', toggleThemeMode: () => undefined }}>
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter>
          <NotificationsPage />
        </MemoryRouter>
      </ThemeProvider>
    </ThemeModeContext.Provider>,
  )
}

describe('NotificationsPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 1,
        username: 'listener',
        email: 'listener@example.com',
        display_name: 'Listener',
        role: ROLES.LISTENER,
        subscription_tier: 'basic',
        created_at: createdAt,
        updated_at: createdAt,
      },
    })
    useNotificationStore.setState({
      recipientId: 1,
      role: ROLES.LISTENER,
      notifications,
      unreadCount: 2,
      loadForUser: useNotificationStore.getState().loadForUser,
      markAsRead: useNotificationStore.getState().markAsRead,
      deleteNotification: useNotificationStore.getState().deleteNotification,
      markAllAsRead: () => {
        useNotificationStore.setState({
          notifications: notifications.map((n) => ({ ...n, is_read: true })),
          unreadCount: 0,
        })
      },
      refresh: useNotificationStore.getState().refresh,
      clear: useNotificationStore.getState().clear,
    })
  })

  it('shows empty state when there are no notifications', () => {
    useNotificationStore.setState({ notifications: [], unreadCount: 0 })
    renderNotificationsPage()

    expect(screen.getByText('You have no notifications yet.')).toBeInTheDocument()
  })

  it('marks all notifications as read from the page action', async () => {
    const user = userEvent.setup()
    renderNotificationsPage()

    await user.click(screen.getByRole('button', { name: /read all notifications/i }))

    expect(useNotificationStore.getState().unreadCount).toBe(0)
    expect(useNotificationStore.getState().notifications.every((n) => n.is_read)).toBe(true)
  })
})
