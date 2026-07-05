/**
 * AdminLayout — Support/Admin dashboard shell with sidebar
 * Spec reference: §2.11
 */
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getAdminNavForRole } from '../lib/constants/navItems'
import { ROUTES } from '../lib/constants/routes'
import { logout } from '../lib/mock/authService'
import { useAuthStore } from '../store/authStore'

const DRAWER_WIDTH = 260

export default function AdminLayout() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = user ? getAdminNavForRole(user.role) : []

  function handleLogout(): void {
    logout()
    setUser(null)
    navigate(ROUTES.LOGIN)
  }

  const drawerContent = (
    <Box sx={{ pt: 2 }}>
      <Typography className="px-4 pb-4" variant="h6" sx={{ fontWeight: 700 }}>
        Admin Panel
      </Typography>
      <List>
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === ROUTES.ADMIN_TICKETS &&
              (location.pathname.startsWith('/admin/tickets') ||
                location.pathname.startsWith('/admin/verification')))

          return (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              selected={isActive}
              to={item.path}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          )
        })}
      </List>
    </Box>
  )

  return (
    <Box className="flex min-h-screen" sx={{ bgcolor: 'background.default' }}>
      {isMobile ? (
        <Drawer
          ModalProps={{ keepMounted: true }}
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
        >
          <Box sx={{ width: DRAWER_WIDTH }}>{drawerContent}</Box>
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box className="flex flex-1 flex-col">
        <AppBar color="default" elevation={0} position="sticky">
          <Toolbar className="gap-2">
            {isMobile ? (
              <IconButton aria-label="Open navigation menu" onClick={() => setMobileOpen(true)}>
                <Menu size={20} />
              </IconButton>
            ) : null}
            <Typography className="flex-1" variant="h6" sx={{ fontWeight: 600 }}>
              {user?.display_name ?? 'Admin'}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button component={RouterLink} size="small" to={ROUTES.HOME} variant="outlined">
                Home
              </Button>
              <Button size="small" variant="outlined" onClick={handleLogout}>
                Logout
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box className="flex-1 p-4 md:p-6" component="main">
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
