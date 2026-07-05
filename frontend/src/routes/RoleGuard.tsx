/**
 * RoleGuard — redirects if user role not allowed
 * Spec reference: §2.11
 */
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Role } from '../lib/constants/roles'
import { ROUTES } from '../lib/constants/routes'
import { useAuthStore } from '../store/authStore'
import type { User } from '../types'

export function hasRole(user: User | null, allowedRoles: Role[]): boolean {
  if (!user) {
    return false
  }
  return allowedRoles.includes(user.role)
}

export default function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[]
  children: ReactNode
}) {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (!user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`${ROUTES.LOGIN}?returnUrl=${returnUrl}`} replace />
  }

  if (!hasRole(user, allowedRoles)) {
    return <Navigate to={ROUTES.HOME} replace />
  }

  return children
}
