import type { AppLanguage } from '../../types'
import type { NotificationCategory } from '../../types/notification'

type NotificationsCopy = {
  pageTitle: string
  panelTitle: string
  readAll: string
  markAsRead: string
  deleteNotification: string
  viewAll: string
  emptyState: string
  openNotifications: string
  categoryLabels: Record<NotificationCategory, string>
}

const COPY: Record<AppLanguage, NotificationsCopy> = {
  en: {
    pageTitle: 'Notifications',
    panelTitle: 'Notifications',
    readAll: 'Read all notifications',
    markAsRead: 'Mark as read',
    deleteNotification: 'Delete notification',
    viewAll: 'View all notifications',
    emptyState: 'You have no notifications yet.',
    openNotifications: 'Open notifications',
    categoryLabels: {
      subscription_expiring: 'Subscription',
      new_release: 'New release',
      account_approval: 'Account approved',
      account_rejection: 'Account rejected',
      monthly_payout: 'Monthly payout',
      new_ticket: 'Support ticket',
      artist_verification_request: 'Verification request',
    },
  },
  fa: {
    pageTitle: 'اعلان‌ها',
    panelTitle: 'اعلان‌ها',
    readAll: 'خواندن همه اعلان‌ها',
    markAsRead: 'علامت‌گذاری به‌عنوان خوانده‌شده',
    deleteNotification: 'حذف اعلان',
    viewAll: 'مشاهده همه اعلان‌ها',
    emptyState: 'هنوز اعلانی ندارید.',
    openNotifications: 'باز کردن اعلان‌ها',
    categoryLabels: {
      subscription_expiring: 'اشتراک',
      new_release: 'انتشار جدید',
      account_approval: 'تأیید حساب',
      account_rejection: 'رد حساب',
      monthly_payout: 'پرداخت ماهانه',
      new_ticket: 'تیکت پشتیبانی',
      artist_verification_request: 'درخواست احراز هویت',
    },
  },
}

export function getNotificationsPageText(language: AppLanguage): NotificationsCopy {
  return COPY[language]
}
