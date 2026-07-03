export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  MANAGE: '/manage',
  USER_PROFILE: '/profile/:username',
  ARTIST_STUDIO: '/artist/studio',
  ADMIN: '/admin',
} as const

export function userProfilePath(username: string): string {
  return `/profile/${username}`
}
