import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import Router from './routes/router'
import { seedDemoData } from './lib/mock/seed'
import { getCurrentUser } from './lib/mock/authService'
import { useAuthStore } from './store/authStore'
import {
  THEME_MODE_STORAGE_KEY,
  createAppTheme,
  type AppThemeMode,
} from './theme/appTheme'
import { ThemeModeContext } from './theme/ThemeModeContext'

function getStoredThemeMode(): AppThemeMode {
  const storedMode = localStorage.getItem(THEME_MODE_STORAGE_KEY)

  return storedMode === 'light' || storedMode === 'dark' ? storedMode : 'dark'
}

export default function App() {
  const setUser = useAuthStore((state) => state.setUser)
  const [mode, setMode] = useState<AppThemeMode>(getStoredThemeMode)
  const theme = useMemo(() => createAppTheme(mode), [mode])
  const themeModeContextValue = useMemo(
    () => ({
      mode,
      toggleThemeMode: () => {
        setMode((currentMode) => {
          const nextMode = currentMode === 'dark' ? 'light' : 'dark'
          localStorage.setItem(THEME_MODE_STORAGE_KEY, nextMode)

          return nextMode
        })
      },
    }),
    [mode],
  )

  useEffect(() => {
    seedDemoData()
    setUser(getCurrentUser())
  }, [setUser])

  return (
    <ThemeModeContext.Provider value={themeModeContextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Router />
        </BrowserRouter>
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}
