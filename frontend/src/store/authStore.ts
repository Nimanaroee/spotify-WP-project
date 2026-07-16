import { create } from 'zustand'
import type { User } from '../types/user'
import { getCurrentUser, setCurrentUser } from '../lib/api/authService'

interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getCurrentUser(),
  setUser: (user) => {
    set({ user })
    setCurrentUser(user)
  },
}))
