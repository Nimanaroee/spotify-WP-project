/**
 * HomePage — greeting + showcase placeholder
 * Spec reference: §2.2
 */
import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
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
    <Box className="min-h-screen bg-slate-950 p-6">
      <Paper className="mx-auto max-w-3xl p-6">
        <Stack spacing={2}>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
            Welcome {user?.display_name ?? 'Guest'}
          </Typography>
          <Button variant="outlined" onClick={handleLogout}>
            Logout
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
