/**
 * HomePage — greeting + showcase placeholder
 * Spec reference: §2.2
 */
import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import ThemeToggleButton from '../components/common/ThemeToggleButton'
import { logout } from '../lib/mock/authService'
import { useAuthStore } from '../store/authStore'

export default function HomePage() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const navigate = useNavigate()

  function handleLogout(): void {
    logout()
    setUser(null)
    navigate('/login')
  }

  return (
    <Box className="min-h-screen p-6" sx={{ bgcolor: 'background.default' }}>
      <Paper className="mx-auto max-w-3xl p-6">
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
            }}
          >
            <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
              Welcome {user?.display_name ?? 'Guest'}
            </Typography>
            <ThemeToggleButton />
          </Stack>
          <Button variant="outlined" onClick={handleLogout}>
            Logout
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
