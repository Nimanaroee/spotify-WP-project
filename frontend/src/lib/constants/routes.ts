export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  MANAGE: '/manage',
  USER_PROFILE: '/profile/:username',
  ARTIST_STUDIO: '/artist/studio',
  ADMIN: '/admin',
  ADMIN_TICKETS: '/admin/tickets',
  ADMIN_AUDITING: '/admin/auditing',
  ADMIN_SUBSCRIPTIONS: '/admin/subscriptions',
} as const

export function userProfilePath(username: string): string {
  return `/profile/${username}`
}

export function adminTicketDetailPath(ticketId: number): string {
  return `/admin/tickets/${ticketId}`
}

export function adminVerificationDetailPath(requestId: number): string {
  return `/admin/verification/${requestId}`
}
