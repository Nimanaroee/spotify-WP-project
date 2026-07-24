import { isAxiosError } from 'axios'

import type { Notification } from '../../types/notification'
import client from './client'

interface NotificationResponse {
  id: number
  category: Notification['category']
  title: string
  message: string
  link: string
  is_read: boolean
  created_at: string
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') {
      return detail
    }
  }
  return fallback
}

function toNotification(response: NotificationResponse): Notification {
  return {
    id: response.id,
    recipient_id: 0,
    category: response.category,
    title: response.title,
    message: response.message,
    is_read: response.is_read,
    link: response.link || undefined,
    created_at: response.created_at,
    updated_at: response.created_at,
  }
}

export async function listNotifications(): Promise<Notification[]> {
  try {
    const response = await client.get<NotificationResponse[]>('/notifications/')
    return response.data.map(toNotification)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to load notifications.'))
  }
}

export async function markNotificationAsRead(id: number): Promise<Notification> {
  try {
    const response = await client.post<NotificationResponse>(`/notifications/${id}/read/`)
    return toNotification(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to mark notification as read.'))
  }
}

export async function markAllAsRead(): Promise<void> {
  try {
    await client.post('/notifications/mark-all-read/')
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to mark notifications as read.'))
  }
}

export async function deleteNotification(id: number): Promise<void> {
  try {
    await client.delete(`/notifications/${id}/`)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to delete notification.'))
  }
}
