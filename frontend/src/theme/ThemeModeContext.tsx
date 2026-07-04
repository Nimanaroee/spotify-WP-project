import { createContext, useContext } from 'react'
import type { AppThemeMode } from './appTheme'

interface ThemeModeContextValue {
  mode: AppThemeMode
  toggleThemeMode: () => void
}

export const ThemeModeContext = createContext<ThemeModeContextValue | null>(null)

export function useThemeMode() {
  const context = useContext(ThemeModeContext)

  if (!context) {
    throw new Error('useThemeMode must be used inside ThemeModeContext.Provider')
  }

  return context
}
