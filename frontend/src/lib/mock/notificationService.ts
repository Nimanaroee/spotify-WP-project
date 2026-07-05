import type { Notification, NotificationCategory } from '../../types/notification'
import { storage } from './storage'

const NOTIFICATIONS_KEY = 'notifications'

function nowIso(): string {
  return new Date().toISOString()
}

function getNextId(items: Array<{ id: number }>): number {
  return items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1
}

export interface CreateNotificationInput {
  recipient_id: number
  category: NotificationCategory
  title: string
  message: string
  link?: string
}

export function listNotifications(recipientId: number): Notification[] {
  const notifications = storage.get<Notification[]>(NOTIFICATIONS_KEY) ?? []
  return notifications.filter((n) => n.recipient_id === recipientId)
}

export function createNotification(input: CreateNotificationInput): Notification {
  const notifications = storage.get<Notification[]>(NOTIFICATIONS_KEY) ?? []
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

  storage.set(NOTIFICATIONS_KEY, [...notifications, notification])
  return notification
}
