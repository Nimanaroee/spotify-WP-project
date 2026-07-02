import type { Role } from '../lib/constants/roles'

export interface User {
  id: number
  display_name: string
  role: Role
}
