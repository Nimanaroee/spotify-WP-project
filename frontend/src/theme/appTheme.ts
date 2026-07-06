import { createTheme, type PaletteMode } from '@mui/material'

export type AppThemeMode = PaletteMode

export const THEME_MODE_STORAGE_KEY = 'spotify-wp-theme-mode'

export function createAppTheme(
  mode: AppThemeMode,
  direction: 'ltr' | 'rtl' = 'ltr',
) {
  const isDark = mode === 'dark'

  return createTheme({
    direction,
    palette: {
      mode,
      primary: {
        main: isDark ? '#a855f7' : '#ec4899',
        light: isDark ? '#c084fc' : '#f9a8d4',
        dark: isDark ? '#7e22ce' : '#be185d',
        contrastText: '#ffffff',
      },
      secondary: {
        main: isDark ? '#d946ef' : '#f472b6',
      },
      background: {
        default: isDark ? '#050008' : '#fff7fb',
        paper: isDark ? '#12001f' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f7ecff' : '#1f1020',
        secondary: isDark ? '#cdb6dc' : '#6f3d59',
      },
      divider: isDark ? 'rgba(168, 85, 247, 0.28)' : 'rgba(236, 72, 153, 0.18)',
    },
    shape: {
      borderRadius: 14,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: isDark
              ? '1px solid rgba(168, 85, 247, 0.22)'
              : '1px solid rgba(236, 72, 153, 0.14)',
          },
        },
      },
    },
  })
}
