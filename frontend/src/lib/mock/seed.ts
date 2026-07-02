import { ROLES } from '../constants/roles'
import { storage } from './storage'

export function seedDemoData(): void {
  if (!storage.get<boolean>('seeded')) {
    storage.set('seeded', true)
    storage.set('users', [{ id: 1, display_name: 'Demo User', role: ROLES.LISTENER }])
  }
}
