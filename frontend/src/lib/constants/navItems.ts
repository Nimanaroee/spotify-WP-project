import type { Role } from './roles'
import { ROLES } from './roles'
import { ROUTES } from './routes'

export interface NavItem {
  label: string
  path: string
  roles: Role[]
}

export const ADMIN_NAV: NavItem[] = [
  {
    label: 'Tickets',
    path: ROUTES.ADMIN_TICKETS,
    roles: [ROLES.SUPPORT, ROLES.ADMIN],
  },
  {
    label: 'Auditing',
    path: ROUTES.ADMIN_AUDITING,
    roles: [ROLES.SUPPORT, ROLES.ADMIN],
  },
  {
    label: 'Subscriptions',
    path: ROUTES.ADMIN_SUBSCRIPTIONS,
    roles: [ROLES.ADMIN],
  },
]

export function getAdminNavForRole(role: Role): NavItem[] {
  return ADMIN_NAV.filter((item) => item.roles.includes(role))
}
