export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  MANAGE: '/manage',
  SETTINGS: '/settings',
  USER_PROFILE: '/profile/:username',
  NOTIFICATIONS: '/notifications',
  ARTIST_STUDIO: '/artist/studio',
  PLAYLISTS: '/playlists',
  ALBUMS: '/albums',
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