import { ROLES } from '../constants/roles'
import { storage } from './storage'

export function seedDemoData(): void {
  if (!storage.get<boolean>('seeded')) {
    storage.set('seeded', true)
    storage.set('users', [
      {
        id: 1,
        username: 'demo_user',
        email: 'demo@example.com',
        display_name: 'Demo User',
        role: ROLES.LISTENER,
        created_at: new Date().toISOString(),
      },
    ])
  }
}
