import { create } from 'zustand'
import {
  deleteNotification as deleteNotificationService,
  listNotifications,
  markAllAsRead as markAllAsReadService,
  markNotificationAsRead,
} from '../lib/api/notificationService'
import type { Notification } from '../types/notification'

interface NotificationState {
  loaded: boolean
  notifications: Notification[]
  unreadCount: number
  loadForUser: () => Promise<void>
  markAsRead: (id: number) => Promise<void>
  deleteNotification: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  refresh: () => Promise<void>
  clear: () => void
}

function countUnread(notifications: Notification[]): number {
  return notifications.filter((n) => !n.is_read).length
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  loaded: false,
  notifications: [],
  unreadCount: 0,

  loadForUser: async () => {
    await get().refresh()
    set({ loaded: true })
  },

  markAsRead: async (id) => {
    await markNotificationAsRead(id)
    await get().refresh()
  },

  deleteNotification: async (id) => {
    await deleteNotificationService(id)
    await get().refresh()
  },

  markAllAsRead: async () => {
    await markAllAsReadService()
    await get().refresh()
  },

  refresh: async () => {
    const notifications = await listNotifications()
    set({ notifications, unreadCount: countUnread(notifications) })
  },

  clear: () => {
    set({ loaded: false, notifications: [], unreadCount: 0 })
  },
}))
