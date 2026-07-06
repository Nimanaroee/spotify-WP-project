import type { AppLanguage } from '../../types'
import { getAdminPageText } from './adminPageText'
import type { Role } from './roles'
import { ROLES } from './roles'
import { ROUTES } from './routes'

export interface NavItem {
  label: string
  path: string
  roles: Role[]
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
