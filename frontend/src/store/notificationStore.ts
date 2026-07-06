import { create } from 'zustand'
import type { Role } from '../lib/constants/roles'
import {
  deleteNotification as deleteNotificationService,
  getUnreadCount,
  listNotifications,
  markAllAsRead as markAllAsReadService,
  markNotificationAsRead,
} from '../lib/mock/notificationService'
import type { Notification } from '../types/notification'

interface NotificationState {
  recipientId: number | null
  role: Role | null
  notifications: Notification[]
  unreadCount: number
  loadForUser: (userId: number, role: Role) => void
  markAsRead: (id: number) => void
  deleteNotification: (id: number) => void
  markAllAsRead: () => void
  refresh: () => void
  clear: () => void
}

function syncFromStorage(
  recipientId: number,
  role: Role,
): Pick<NotificationState, 'notifications' | 'unreadCount'> {
  const notifications = listNotifications(recipientId, role)
  return {
    notifications,
    unreadCount: getUnreadCount(recipientId, role),
  }
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  recipientId: null,
  role: null,
  notifications: [],
  unreadCount: 0,

  loadForUser: (userId, role) => {
    set({
      recipientId: userId,
      role,
      ...syncFromStorage(userId, role),
    })
  },

  markAsRead: (id) => {
    const { recipientId } = get()
    if (recipientId === null) {
      return
    }
    markNotificationAsRead(id, recipientId)
    get().refresh()
  },

  deleteNotification: (id) => {
    const { recipientId } = get()
    if (recipientId === null) {
      return
    }
    deleteNotificationService(id, recipientId)
    get().refresh()
  },

  markAllAsRead: () => {
    const { recipientId, role } = get()
    if (recipientId === null || role === null) {
      return
    }
    markAllAsReadService(recipientId, role)
    get().refresh()
  },

  refresh: () => {
    const { recipientId, role } = get()
    if (recipientId === null || role === null) {
      return
    }
    set(syncFromStorage(recipientId, role))
  },

  clear: () => {
    set({
      recipientId: null,
      role: null,
      notifications: [],
      unreadCount: 0,
    })
  },
}))
