export const ROLES = {
  LISTENER: 'listener',
  ARTIST: 'artist',
  SUPPORT: 'support',
  ADMIN: 'admin',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]
