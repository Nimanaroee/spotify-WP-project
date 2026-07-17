import { Button } from '@mui/material'
import { Moon, Sun } from 'lucide-react'
import { useThemeMode } from '../../theme/ThemeModeContext'

interface Props {
  onToggle?: (mode: 'light' | 'dark') => void
}

export default function ThemeToggleButton({ onToggle }: Props) {
  const { mode, setThemeMode, toggleThemeMode } = useThemeMode()
  const isDark = mode === 'dark'
  const nextMode = isDark ? 'light' : 'dark'
  const Icon = isDark ? Sun : Moon

  return (
    <Button
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      onClick={() => {
        if (setThemeMode) {
          setThemeMode(nextMode)
        } else {
          toggleThemeMode()
        }
        onToggle?.(nextMode)
      }}
      startIcon={<Icon size={18} aria-hidden="true" />}
      variant="contained"
    >
      {isDark ? 'Light mode' : 'Dark mode'}
    </Button>
  )
}
