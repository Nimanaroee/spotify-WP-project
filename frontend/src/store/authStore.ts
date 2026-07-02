import { create } from 'zustand'
import type { User } from '../types/user'

interface AuthState {
  user: User | null
}

export const useAuthStore = create<AuthState>(() => ({
  user: null,
}))
