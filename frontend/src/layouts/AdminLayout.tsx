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
import NotificationPanel from '../components/notifications/NotificationPanel'
import { getAdminPageText } from '../lib/constants/adminPageText'
import { getAdminNavForRole } from '../lib/constants/navItems'
import { ROUTES } from '../lib/constants/routes'
import { logout } from '../lib/mock/authService'
import { useAuthStore } from '../store/authStore'
import { useAppLanguage } from '../theme/LanguageContext'

const DRAWER_WIDTH = 260

export default function AdminLayout() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const { language, toggleLanguage } = useAppLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const copy = getAdminPageText(language)

  const navItems = user ? getAdminNavForRole(user.role, language) : []

  function handleLogout(): void {
    logout()
    setUser(null)
    navigate(ROUTES.LOGIN)
  }

  const drawerContent = (
    <Box sx={{ pt: 2 }}>
      <Typography className="px-4 pb-4" variant="h6" sx={{ fontWeight: 700 }}>
        {copy.layout.panelTitle}
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer
        ModalProps={{ keepMounted: true }}
        anchor="left"
        open={isMobile ? mobileOpen : true}
        variant={isMobile ? 'temporary' : 'permanent'}
        onClose={() => setMobileOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          minWidth: 0,
          ...(isMobile ? {} : { marginInlineStart: `${DRAWER_WIDTH}px` }),
        }}
      >
        <AppBar color="default" elevation={0} position="sticky">
          <Toolbar sx={{ gap: 1 }}>
            {isMobile ? (
              <IconButton
                aria-label={copy.layout.openNav}
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={20} />
              </IconButton>
            ) : null}
            <Typography sx={{ flex: 1, fontWeight: 600 }} variant="h6">
              {user?.display_name ?? copy.layout.panelTitle}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  toggleLanguage()
                }}
              >
                {language === 'en'
                  ? copy.layout.switchToPersian
                  : copy.layout.switchToEnglish}
              </Button>
              <NotificationPanel />
              <Button component={RouterLink} size="small" to={ROUTES.HOME} variant="outlined">
                {copy.layout.home}
              </Button>
              <Button size="small" variant="outlined" onClick={handleLogout}>
                {copy.layout.logout}
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
