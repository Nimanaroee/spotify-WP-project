export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  ADMIN: '/admin',
  ADMIN_TICKETS: '/admin/tickets',
  ADMIN_AUDITING: '/admin/auditing',
  ADMIN_SUBSCRIPTIONS: '/admin/subscriptions',
} as const

export function adminTicketDetailPath(ticketId: number): string {
  return `/admin/tickets/${ticketId}`
}

export function adminVerificationDetailPath(requestId: number): string {
  return `/admin/verification/${requestId}`
}
