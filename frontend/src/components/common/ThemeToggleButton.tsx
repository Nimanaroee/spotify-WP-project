import { Button } from '@mui/material'
import { Moon, Sun } from 'lucide-react'
import { useThemeMode } from '../../theme/ThemeModeContext'

export default function ThemeToggleButton() {
  const { mode, toggleThemeMode } = useThemeMode()
  const isDark = mode === 'dark'
  const Icon = isDark ? Sun : Moon

  return (
    <Button
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      onClick={toggleThemeMode}
      startIcon={<Icon size={18} aria-hidden="true" />}
      variant="contained"
    >
      {isDark ? 'Light mode' : 'Dark mode'}
    </Button>
  )
}
