import { format } from 'date-fns'
import { enUS, faIR } from 'date-fns/locale'
import type { AppLanguage } from '../../types'
import type { PaymentStatus } from '../../types/admin'
import type { TicketStatus } from '../../types/support'
import type { SubscriptionTier } from './subscriptionLimits'

type AdminPageCopy = {
  layout: {
    panelTitle: string
    home: string
    logout: string
    openNav: string
    switchToEnglish: string
    switchToPersian: string
  }
  nav: {
    tickets: string
    auditing: string
    subscriptions: string
  }
  tickets: {
    title: string
    ticketsTab: string
    verificationTab: string
    noTickets: string
    noRequests: string
    ticketId: string
    userName: string
    subject: string
    dateSubmitted: string
    status: string
    stageName: string
    email: string
    actions: string
    viewPortfolio: string
    statusLabels: Record<TicketStatus, string>
  }
  ticketDetail: {
    notFound: string
    backToTickets: string
    back: string
    ticketHeading: (id: number, subject: string) => string
    submittedBy: (userName: string, date: string) => string
    yourReply: string
    sendReply: string
    closeTicket: string
    ticketClosed: string
    failedSendReply: string
    failedCloseTicket: string
  }
  verification: {
    notFound: string
    backToRequests: string
    back: string
    title: string
    stageName: (name: string) => string
    email: (email: string) => string
    status: (status: string) => string
    rejectionReason: (reason: string) => string
    portfolio: string
    approve: string
    reject: string
    alreadyProcessed: string
    confirmTitle: string
    confirmBody: (stageName: string) => string
    cancel: string
    rejectTitle: string
    rejectReasonLabel: string
    rejectReasonRequired: string
    approvedSuccess: string
    rejectedSuccess: string
    failedApprove: string
    failedReject: string
    statusLabels: {
      pending: string
      approved: string
      rejected: string
    }
  }
  auditing: {
    title: string
    year: string
    month: string
    noRecords: string
    artist: string
    uniqueListeners: string
    registeredStreams: string
    calculatedReward: string
    paymentStatus: string
    actions: string
    confirmSettlement: string
    failedSettlement: string
    paymentStatusLabels: Record<PaymentStatus, string>
  }
  subscriptions: {
    title: string
    pricePanel: string
    silverPrice: string
    goldPrice: string
    lastUpdated: (date: string) => string
    updatePrices: string
    updateSuccess: string
    failedUpdate: string
    silverPriceError: string
    goldPriceError: string
    monthlyRevenue: string
    userDistribution: string
    tierLabels: Record<SubscriptionTier, string>
  }
}

export const ADMIN_PAGE_TEXT: Record<AppLanguage, AdminPageCopy> = {
  en: {
    layout: {
      panelTitle: 'Admin Panel',
      home: 'Home',
      logout: 'Logout',
      openNav: 'Open navigation menu',
      switchToEnglish: 'English',
      switchToPersian: 'فارسی',
    },
    nav: {
      tickets: 'Tickets',
      auditing: 'Auditing',
      subscriptions: 'Subscriptions',
    },
    tickets: {
      title: 'Tickets & Authentication',
      ticketsTab: 'Support Tickets',
      verificationTab: 'Artist Approval Requests',
      noTickets: 'No support tickets yet.',
      noRequests: 'No pending artist approval requests.',
      ticketId: 'Ticket ID',
      userName: 'User Name',
      subject: 'Subject',
      dateSubmitted: 'Date Submitted',
      status: 'Status',
      stageName: 'Stage Name',
      email: 'Email',
      actions: 'Actions',
      viewPortfolio: 'View portfolio/samples',
      statusLabels: {
        open: 'Open',
        answered: 'Answered',
        closed: 'Closed',
      },
    },
    ticketDetail: {
      notFound: 'Ticket not found.',
      backToTickets: 'Back to tickets',
      back: 'Back',
      ticketHeading: (id, subject) => `Ticket #${id}: ${subject}`,
      submittedBy: (userName, date) => `From ${userName} · Submitted ${date}`,
      yourReply: 'Your reply',
      sendReply: 'Send reply',
      closeTicket: 'Close ticket',
      ticketClosed: 'This ticket is closed.',
      failedSendReply: 'Failed to send reply.',
      failedCloseTicket: 'Failed to close ticket.',
    },
    verification: {
      notFound: 'Verification request not found.',
      backToRequests: 'Back to requests',
      back: 'Back',
      title: 'Artist Approval Request',
      stageName: (name) => `Stage name: ${name}`,
      email: (email) => `Email: ${email}`,
      status: (status) => `Status: ${status}`,
      rejectionReason: (reason) => `Rejection reason: ${reason}`,
      portfolio: 'Portfolio / samples',
      approve: 'Approve',
      reject: 'Reject',
      alreadyProcessed: 'This request has already been processed.',
      confirmTitle: 'Approve artist?',
      confirmBody: (stageName) =>
        `Approve ${stageName}? They will be able to log in and access Artist Studio.`,
      cancel: 'Cancel',
      rejectTitle: 'Reject artist request',
      rejectReasonLabel: 'Rejection reason',
      rejectReasonRequired: 'Rejection reason is required.',
      approvedSuccess: 'Artist approved successfully. A notification has been sent.',
      rejectedSuccess: 'Artist request rejected. A notification has been sent.',
      failedApprove: 'Failed to approve request.',
      failedReject: 'Failed to reject request.',
      statusLabels: {
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
      },
    },
    auditing: {
      title: 'Auditing / Accounting',
      year: 'Year',
      month: 'Month',
      noRecords: 'No audit records for this period.',
      artist: 'Artist',
      uniqueListeners: 'Unique Listeners',
      registeredStreams: 'Registered Streams',
      calculatedReward: 'Calculated Reward',
      paymentStatus: 'Payment Status',
      actions: 'Actions',
      confirmSettlement: 'Confirm Settlement',
      failedSettlement: 'Failed to confirm settlement.',
      paymentStatusLabels: {
        pending: 'Pending Payment',
        settled: 'Settled',
      },
    },
    subscriptions: {
      title: 'Subscription Management',
      pricePanel: 'Price Control Panel',
      silverPrice: 'Silver Subscription Price ($)',
      goldPrice: 'Gold Subscription Price ($)',
      lastUpdated: (date) => `Last updated: ${date}`,
      updatePrices: 'Update Prices',
      updateSuccess: 'Subscription prices updated successfully.',
      failedUpdate: 'Failed to update prices.',
      silverPriceError: 'Silver price must be greater than zero.',
      goldPriceError: 'Gold price must be greater than zero.',
      monthlyRevenue: 'Monthly Subscription Revenue',
      userDistribution: 'User Distribution by Tier',
      tierLabels: {
        basic: 'Basic',
        silver: 'Silver',
        gold: 'Gold',
      },
    },
  },
  fa: {
    layout: {
      panelTitle: 'پنل مدیریت',
      home: 'صفحه اصلی',
      logout: 'خروج',
      openNav: 'باز کردن منوی ناوبری',
      switchToEnglish: 'English',
      switchToPersian: 'فارسی',
    },
    nav: {
      tickets: 'تیکت‌ها',
      auditing: 'حسابرسی',
      subscriptions: 'اشتراک‌ها',
    },
    tickets: {
      title: 'تیکت‌ها و احراز هویت',
      ticketsTab: 'تیکت‌های پشتیبانی',
      verificationTab: 'درخواست‌های تایید هنرمند',
      noTickets: 'هنوز تیکت پشتیبانی‌ای وجود ندارد.',
      noRequests: 'درخواست تایید هنرمندی در انتظار نیست.',
      ticketId: 'شناسه تیکت',
      userName: 'نام کاربر',
      subject: 'موضوع',
      dateSubmitted: 'تاریخ ارسال',
      status: 'وضعیت',
      stageName: 'نام هنری',
      email: 'ایمیل',
      actions: 'عملیات',
      viewPortfolio: 'مشاهده نمونه کارها',
      statusLabels: {
        open: 'باز',
        answered: 'پاسخ داده شده',
        closed: 'بسته',
      },
    },
    ticketDetail: {
      notFound: 'تیکت پیدا نشد.',
      backToTickets: 'بازگشت به تیکت‌ها',
      back: 'بازگشت',
      ticketHeading: (id, subject) => `تیکت #${id}: ${subject}`,
      submittedBy: (userName, date) => `از ${userName} · ارسال شده ${date}`,
      yourReply: 'پاسخ شما',
      sendReply: 'ارسال پاسخ',
      closeTicket: 'بستن تیکت',
      ticketClosed: 'این تیکت بسته شده است.',
      failedSendReply: 'ارسال پاسخ ناموفق بود.',
      failedCloseTicket: 'بستن تیکت ناموفق بود.',
    },
    verification: {
      notFound: 'درخواست تایید پیدا نشد.',
      backToRequests: 'بازگشت به درخواست‌ها',
      back: 'بازگشت',
      title: 'درخواست تایید هنرمند',
      stageName: (name) => `نام هنری: ${name}`,
      email: (email) => `ایمیل: ${email}`,
      status: (status) => `وضعیت: ${status}`,
      rejectionReason: (reason) => `دلیل رد: ${reason}`,
      portfolio: 'نمونه کارها',
      approve: 'تایید',
      reject: 'رد',
      alreadyProcessed: 'این درخواست قبلاً بررسی شده است.',
      confirmTitle: 'تایید هنرمند؟',
      confirmBody: (stageName) =>
        `${stageName} تایید شود؟ پس از تایید می‌تواند وارد شود و به استودیوی هنرمند دسترسی داشته باشد.`,
      cancel: 'لغو',
      rejectTitle: 'رد درخواست هنرمند',
      rejectReasonLabel: 'دلیل رد',
      rejectReasonRequired: 'وارد کردن دلیل رد الزامی است.',
      approvedSuccess: 'هنرمند با موفقیت تایید شد. اعلان ارسال شد.',
      rejectedSuccess: 'درخواست هنرمند رد شد. اعلان ارسال شد.',
      failedApprove: 'تایید درخواست ناموفق بود.',
      failedReject: 'رد درخواست ناموفق بود.',
      statusLabels: {
        pending: 'در انتظار',
        approved: 'تایید شده',
        rejected: 'رد شده',
      },
    },
    auditing: {
      title: 'حسابرسی / مالی',
      year: 'سال',
      month: 'ماه',
      noRecords: 'برای این بازه زمانی رکورد حسابرسی وجود ندارد.',
      artist: 'هنرمند',
      uniqueListeners: 'شنوندگان یکتا',
      registeredStreams: 'پخش‌های ثبت‌شده',
      calculatedReward: 'پاداش محاسبه‌شده',
      paymentStatus: 'وضعیت پرداخت',
      actions: 'عملیات',
      confirmSettlement: 'تایید تسویه',
      failedSettlement: 'تایید تسویه ناموفق بود.',
      paymentStatusLabels: {
        pending: 'در انتظار پرداخت',
        settled: 'تسویه شده',
      },
    },
    subscriptions: {
      title: 'مدیریت اشتراک',
      pricePanel: 'پنل کنترل قیمت',
      silverPrice: 'قیمت اشتراک نقره‌ای ($)',
      goldPrice: 'قیمت اشتراک طلایی ($)',
      lastUpdated: (date) => `آخرین به‌روزرسانی: ${date}`,
      updatePrices: 'به‌روزرسانی قیمت‌ها',
      updateSuccess: 'قیمت‌های اشتراک با موفقیت به‌روزرسانی شد.',
      failedUpdate: 'به‌روزرسانی قیمت‌ها ناموفق بود.',
      silverPriceError: 'قیمت نقره‌ای باید بیشتر از صفر باشد.',
      goldPriceError: 'قیمت طلایی باید بیشتر از صفر باشد.',
      monthlyRevenue: 'درآمد ماهانه اشتراک',
      userDistribution: 'توزیع کاربران بر اساس سطح',
      tierLabels: {
        basic: 'پایه',
        silver: 'نقره‌ای',
        gold: 'طلایی',
      },
    },
  },
}

export function getAdminPageText(language: AppLanguage): AdminPageCopy {
  return ADMIN_PAGE_TEXT[language]
}

export function formatAdminDate(iso: string, language: AppLanguage): string {
  try {
    return format(new Date(iso), 'd MMM yyyy', {
      locale: language === 'fa' ? faIR : enUS,
    })
  } catch {
    return iso
  }
}

export function formatAdminDateTime(iso: string, language: AppLanguage): string {
  try {
    return format(new Date(iso), 'd MMM yyyy HH:mm', {
      locale: language === 'fa' ? faIR : enUS,
    })
  } catch {
    return iso
  }
}

export function formatAdminMonthYear(
  year: number,
  month: number,
  language: AppLanguage,
): string {
  try {
    return format(new Date(year, month - 1), 'MMMM yyyy', {
      locale: language === 'fa' ? faIR : enUS,
    })
  } catch {
    return `${month}/${year}`
  }
}

export function formatAdminMonthName(month: number, language: AppLanguage): string {
  return new Date(2000, month - 1).toLocaleString(language === 'fa' ? 'fa-IR' : 'en-US', {
    month: 'long',
  })
}
