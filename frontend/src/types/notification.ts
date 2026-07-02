import type { EntityId, Timestamps } from './common'

export type ListenerNotificationCategory =
  | 'subscription_expiring'
  | 'new_release'

export type ArtistNotificationCategory =
  | 'account_approval'
  | 'account_rejection'
  | 'monthly_payout'

export type StaffNotificationCategory =
  | 'new_ticket'
  | 'artist_verification_request'

export type NotificationCategory =
  | ListenerNotificationCategory
  | ArtistNotificationCategory
  | StaffNotificationCategory

export interface Notification extends Timestamps {
  id: EntityId
  recipient_id: EntityId
  category: NotificationCategory
  title: string
  message: string
  is_read: boolean
  /** Deep link target, e.g. track, album, or ticket page. */
  link?: string
}
