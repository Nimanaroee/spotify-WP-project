import type { AppLanguage } from '../../types'
import { getAdminPageText } from './adminPageText'
import { getHomePageText } from './homePageText'
import type { Role } from './roles'
import { ROLES } from './roles'
import { ROUTES, userProfilePath } from './routes'

export interface NavItem {
  label: string
  path: string
  roles: Role[]
}

export function getMainNavForRole(role: Role, username: string, language: AppLanguage): NavItem[] {
  const copy = getHomePageText(language)

  const items: NavItem[] = [
    { label: copy.nav.home, path: ROUTES.HOME, roles: [ROLES.LISTENER, ROLES.ARTIST, ROLES.SUPPORT, ROLES.ADMIN] },
    { label: copy.nav.playlists, path: ROUTES.PLAYLISTS, roles: [ROLES.LISTENER, ROLES.ARTIST, ROLES.SUPPORT, ROLES.ADMIN] },
    { label: copy.nav.albums, path: ROUTES.ALBUMS, roles: [ROLES.LISTENER, ROLES.ARTIST, ROLES.SUPPORT, ROLES.ADMIN] },
    { label: copy.nav.profile, path: userProfilePath(username), roles: [ROLES.LISTENER, ROLES.ARTIST, ROLES.SUPPORT, ROLES.ADMIN] },
    { label: copy.nav.settings, path: ROUTES.SETTINGS, roles: [ROLES.LISTENER, ROLES.ARTIST, ROLES.SUPPORT, ROLES.ADMIN] },
  ]

  return items.filter((item) => item.roles.includes(role))
}

export function getAdminNavForRole(role: Role, language: AppLanguage): NavItem[] {
  const copy = getAdminPageText(language)

  const items: NavItem[] = [
    {
      label: copy.nav.tickets,
      path: ROUTES.ADMIN_TICKETS,
      roles: [ROLES.SUPPORT, ROLES.ADMIN],
    },
    {
      label: copy.nav.auditing,
      path: ROUTES.ADMIN_AUDITING,
      roles: [ROLES.SUPPORT, ROLES.ADMIN],
    },
    {
      label: copy.nav.subscriptions,
      path: ROUTES.ADMIN_SUBSCRIPTIONS,
      roles: [ROLES.ADMIN],
    },
  ]

  return items.filter((item) => item.roles.includes(role))
}