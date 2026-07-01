import { storage } from './storage'

export function seedDemoData() {
  if (!storage.get('seeded')) {
    storage.set('seeded', true)
    storage.set('users', [{ id: 1, display_name: 'Demo User', role: 'listener' }])
  }
}
