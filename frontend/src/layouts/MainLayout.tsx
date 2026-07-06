import type { ReactNode } from 'react'
import { AppBar, Box, Button, Stack, Toolbar, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import NotificationPanel from '../components/notifications/NotificationPanel'
import { ROUTES } from '../lib/constants/routes'
import { useAuthStore } from '../store/authStore'

export default function MainLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user)

  return (
    <Box className="min-h-screen" sx={{ bgcolor: 'background.default' }}>
      {user ? (
        <AppBar color="default" elevation={0} position="sticky">
          <Toolbar className="gap-2">
            <Typography className="flex-1" variant="h6" sx={{ fontWeight: 600 }}>
              Spotify WP
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <NotificationPanel />
              <Button
                component={RouterLink}
                size="small"
                to={ROUTES.NOTIFICATIONS}
                variant="outlined"
              >
                Notifications
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>
      ) : null}
      <Box className="p-6">{children}</Box>
    </Box>
  )
}
