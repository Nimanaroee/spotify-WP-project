import { ROLES } from '../constants/roles'
import { storage } from './storage'

export function seedDemoData(): void {
  if (!storage.get<boolean>('seeded')) {
    const createdAt = new Date().toISOString()
    storage.set('seeded', true)
    storage.set('users', [
      {
        id: 1,
        username: 'demo_user',
        email: 'demo@example.com',
        password: 'password123',
        display_name: 'Demo User',
        role: ROLES.LISTENER,
        subscription_tier: 'basic',
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: 2,
        username: 'demo_artist',
        email: 'artist@example.com',
        password: 'password123',
        display_name: 'Demo Artist',
        role: ROLES.ARTIST,
        subscription_tier: 'basic',
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: 3,
        username: 'support_agent',
        email: 'support@example.com',
        password: 'password123',
        display_name: 'Support Agent',
        role: ROLES.SUPPORT,
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: 4,
        username: 'manager',
        email: 'manager@example.com',
        password: 'password123',
        display_name: 'Manager',
        role: ROLES.ADMIN,
        created_at: createdAt,
        updated_at: createdAt,
      },
    ])
  }
}
