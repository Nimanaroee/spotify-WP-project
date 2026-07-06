import type { Role } from '../constants/roles'
import { ROLES } from '../constants/roles'
import type { Notification, NotificationCategory } from '../../types/notification'
import { storage } from './storage'

const NOTIFICATIONS_KEY = 'notifications'

function nowIso(): string {
  return new Date().toISOString()
}

function getNextId(items: Array<{ id: number }>): number {
  return items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1
}

function readNotifications(): Notification[] {
  return storage.get<Notification[]>(NOTIFICATIONS_KEY) ?? []
}

function writeNotifications(notifications: Notification[]): void {
  storage.set(NOTIFICATIONS_KEY, notifications)
}

export function getCategoriesForRole(role: Role): NotificationCategory[] {
  switch (role) {
    case ROLES.LISTENER:
      return ['subscription_expiring', 'new_release']
    case ROLES.ARTIST:
      return ['account_approval', 'account_rejection', 'monthly_payout']
    case ROLES.SUPPORT:
    case ROLES.ADMIN:
      return ['new_ticket', 'artist_verification_request']
    default:
      return []
  }
}

export interface CreateNotificationInput {
  recipient_id: number
  category: NotificationCategory
  title: string
  message: string
  link?: string
}

export function listNotifications(
  recipientId: number,
  role?: Role,
): Notification[] {
  const allowedCategories = role ? new Set(getCategoriesForRole(role)) : null

  return readNotifications()
    .filter((notification) => {
      if (notification.recipient_id !== recipientId) {
        return false
      }
      if (allowedCategories && !allowedCategories.has(notification.category)) {
        return false
      }
      return true
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function getUnreadCount(recipientId: number, role?: Role): number {
  return listNotifications(recipientId, role).filter((n) => !n.is_read).length
}

export function createNotification(input: CreateNotificationInput): Notification {
  const notifications = readNotifications()
  const createdAt = nowIso()
  const notification: Notification = {
    id: getNextId(notifications),
    recipient_id: input.recipient_id,
    category: input.category,
    title: input.title,
    message: input.message,
    is_read: false,
    link: input.link,
    created_at: createdAt,
    updated_at: createdAt,
  }

  writeNotifications([...notifications, notification])
  return notification
}

export function markNotificationAsRead(
  id: number,
  recipientId: number,
): Notification | null {
  const notifications = readNotifications()
  const index = notifications.findIndex(
    (n) => n.id === id && n.recipient_id === recipientId,
  )

  if (index === -1) {
    return null
  }

  const updatedAt = nowIso()
  const updated: Notification = {
    ...notifications[index],
    is_read: true,
    updated_at: updatedAt,
  }

  const next = [...notifications]
  next[index] = updated
  writeNotifications(next)
  return updated
}

export function markAllAsRead(recipientId: number, role?: Role): void {
  const allowedCategories = role ? new Set(getCategoriesForRole(role)) : null
  const updatedAt = nowIso()

  const next = readNotifications().map((notification) => {
    if (notification.recipient_id !== recipientId || notification.is_read) {
      return notification
    }
    if (allowedCategories && !allowedCategories.has(notification.category)) {
      return notification
    }
    return { ...notification, is_read: true, updated_at: updatedAt }
  })

  writeNotifications(next)
}

export function deleteNotification(id: number, recipientId: number): boolean {
  const notifications = readNotifications()
  const next = notifications.filter(
    (n) => !(n.id === id && n.recipient_id === recipientId),
  )

  if (next.length === notifications.length) {
    return false
  }

  writeNotifications(next)
  return true
}
