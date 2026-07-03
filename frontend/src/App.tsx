import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { useEffect } from 'react'
import Router from './routes/router'
import { seedDemoData } from './lib/mock/seed'
import { getCurrentUser } from './lib/mock/authService'
import { useAuthStore } from './store/authStore'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1db954',
    },
    background: {
      default: '#0f172a',
      paper: '#111827',
    },
  },
  shape: {
    borderRadius: 12,
  },
})

export default function App() {
  const setUser = useAuthStore((state) => state.setUser)

  useEffect(() => {
    seedDemoData()
    setUser(getCurrentUser())
  }, [setUser])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Router />
      </BrowserRouter>
    </ThemeProvider>
  )
}
