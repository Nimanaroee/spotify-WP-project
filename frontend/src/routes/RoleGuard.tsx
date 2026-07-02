import type { ReactNode } from 'react'
import type { Role } from '../lib/constants/roles'

/**
 * RoleGuard — stub: redirects if user role not allowed
 * Spec reference: §2.x | role-based route guard
 *
 * Responsibilities (TODO):
 *  - [ ] enforce allowedRoles
 */
export default function RoleGuard({
  allowedRoles: _allowedRoles = [],
  children,
}: {
  allowedRoles?: Role[]
  children: ReactNode
}) {
  return children
}
