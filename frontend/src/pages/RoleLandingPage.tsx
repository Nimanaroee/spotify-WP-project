/**
 * RoleLandingPage — temporary role destination placeholder
 * Spec reference: §2.1
 */
import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface RoleLandingPageProps {
  title: string
}

export default function RoleLandingPage({ title }: RoleLandingPageProps) {
  const user = useAuthStore((state) => state.user)

  return (
    <Box className="min-h-screen p-6" sx={{ bgcolor: 'background.default' }}>
      <Paper className="mx-auto max-w-3xl p-6">
        <Stack spacing={2}>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography color="text.secondary">
            {user
              ? `Welcome, ${user.display_name}. This is your role-based destination.`
              : 'This role-based page is ready for future protected content.'}
          </Typography>
          <Button component={RouterLink} to="/" variant="outlined">
            Go to home
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
