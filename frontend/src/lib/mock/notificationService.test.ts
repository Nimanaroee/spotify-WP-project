import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deleteNotification,
  getUnreadCount,
  listNotifications,
  markAllAsRead,
  markNotificationAsRead,
} from './notificationService'
import { ROLES } from '../constants/roles'
import type { Notification } from '../../types/notification'

const storageState = new Map<string, unknown>()

vi.mock('./storage', () => ({
  storage: {
    get: vi.fn((key: string) => storageState.get(key) ?? null),
    set: vi.fn((key: string, value: unknown) => {
      storageState.set(key, value)
    }),
    remove: vi.fn((key: string) => {
      storageState.delete(key)
    }),
  },
}))

const createdAt = '2026-01-01T00:00:00.000Z'

const seedNotifications: Notification[] = [
  {
    id: 1,
    recipient_id: 1,
    category: 'subscription_expiring',
    title: 'Expiring',
    message: 'Soon',
    is_read: false,
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: 2,
    recipient_id: 1,
    category: 'new_release',
    title: 'Release',
    message: 'New track',
    is_read: false,
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: 3,
    recipient_id: 2,
    category: 'new_ticket',
    title: 'Ticket',
    message: 'Help',
    is_read: false,
    created_at: createdAt,
    updated_at: createdAt,
  },
]

describe('notificationService', () => {
  beforeEach(() => {
    storageState.clear()
    storageState.set('notifications', [...seedNotifications])
  })

  it('lists notifications for a recipient sorted newest first', () => {
    const notifications = listNotifications(1, ROLES.LISTENER)
    expect(notifications).toHaveLength(2)
    expect(notifications.every((n) => n.recipient_id === 1)).toBe(true)
  })

  it('filters categories by role', () => {
    const notifications = listNotifications(1, ROLES.ARTIST)
    expect(notifications).toHaveLength(0)
  })

  it('marks a single notification as read for the recipient', () => {
    const updated = markNotificationAsRead(1, 1)
    expect(updated?.is_read).toBe(true)
    expect(getUnreadCount(1, ROLES.LISTENER)).toBe(1)
  })

  it('does not mark another recipient notification as read', () => {
    const updated = markNotificationAsRead(3, 1)
    expect(updated).toBeNull()
    expect(getUnreadCount(2, ROLES.SUPPORT)).toBe(1)
  })

  it('marks all notifications as read for a recipient', () => {
    markAllAsRead(1, ROLES.LISTENER)
    expect(getUnreadCount(1, ROLES.LISTENER)).toBe(0)
  })

  it('deletes a notification scoped to recipient', () => {
    const deleted = deleteNotification(1, 1)
    expect(deleted).toBe(true)
    expect(listNotifications(1, ROLES.LISTENER)).toHaveLength(1)
    expect(listNotifications(2, ROLES.SUPPORT)).toHaveLength(1)
  })
})
