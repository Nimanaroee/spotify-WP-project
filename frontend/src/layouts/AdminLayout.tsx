import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import { Menu as MenuIcon, MoreVertical } from 'lucide-react'
import { useState } from 'react'
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import NotificationPanel from '../components/notifications/NotificationPanel'
import { getProfileInitials } from '../components/profile/profileUtils'
import { useIsMobile } from '../hooks/useIsMobile'
import { getAdminPageText } from '../lib/constants/adminPageText'
import { getAdminAccountNav, getAdminNavForRole } from '../lib/constants/navItems'
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
  const isMobile = useIsMobile()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null)
  const copy = getAdminPageText(language)

  const navItems = user ? getAdminNavForRole(user.role, language) : []
  const accountNavItems = getAdminAccountNav(language)
  const languageLabel =
    language === 'en' ? copy.layout.switchToPersian : copy.layout.switchToEnglish
  const languageShort = language === 'en' ? 'FA' : 'EN'

  function handleLogout(): void {
    logout()
    setUser(null)
    navigate(ROUTES.LOGIN)
  }

  function isNavItemActive(path: string): boolean {
    if (path === ROUTES.ADMIN_TICKETS) {
      return (
        location.pathname.startsWith('/admin/tickets') ||
        location.pathname.startsWith('/admin/verification')
      )
    }

    return location.pathname === path
  }

  const drawerContent = (
    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography className="px-4 pb-4" variant="h6" sx={{ fontWeight: 700 }}>
        {copy.layout.panelTitle}
      </Typography>
      <List sx={{ flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={RouterLink}
            selected={isNavItemActive(item.path)}
            to={item.path}
            onClick={() => setMobileOpen(false)}
          >
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
        <Divider sx={{ my: 1.5 }} />
        {accountNavItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={RouterLink}
            selected={location.pathname === item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
          >
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
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
          <Toolbar sx={{ gap: { xs: 0.5, md: 1 }, minWidth: 0 }}>
            {isMobile ? (
              <IconButton
                aria-label={copy.layout.openNav}
                onClick={() => setMobileOpen(true)}
                sx={{ flexShrink: 0 }}
              >
                <MenuIcon size={20} />
              </IconButton>
            ) : null}
            <Typography
              noWrap
              sx={{
                flex: 1,
                fontWeight: 600,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              variant="h6"
            >
              {user?.display_name ?? copy.layout.panelTitle}
            </Typography>
            <Stack
              direction="row"
              spacing={{ xs: 0.5, md: 1 }}
              sx={{ alignItems: 'center', flexShrink: 0 }}
            >
              <Button
                aria-label={languageLabel}
                size="small"
                variant="text"
                onClick={() => {
                  toggleLanguage()
                }}
                sx={{ minWidth: { xs: 36, md: 'auto' }, px: { xs: 1, md: 1.5 } }}
              >
                {isMobile ? languageShort : languageLabel}
              </Button>
              <NotificationPanel />
              {!isMobile && user ? (
                <>
                  <Button component={RouterLink} size="small" to={ROUTES.MANAGE} variant="text">
                    {accountNavItems[0]?.label}
                  </Button>
                  <Button component={RouterLink} size="small" to={ROUTES.SETTINGS} variant="text">
                    {accountNavItems[1]?.label}
                  </Button>
                </>
              ) : null}
              {user ? (
                <Stack
                  component={RouterLink}
                  to={ROUTES.MANAGE}
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: 'center',
                    textDecoration: 'none',
                    color: 'inherit',
                    px: 1,
                    py: 0.5,
                    borderRadius: 8,
                    transition: 'background-color 0.2s',
                    '&:hover': { bgcolor: 'action.hover' },
                    flexShrink: 0,
                  }}
                >
                  <Avatar
                    alt={`Profile of ${user.display_name}`}
                    src={user.profile_picture ?? undefined}
                    sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}
                  >
                    {getProfileInitials(user.display_name)}
                  </Avatar>
                </Stack>
              ) : null}
              {isMobile ? (
                <>
                  <IconButton
                    aria-label={copy.layout.home}
                    size="small"
                    onClick={(event) => setMoreAnchor(event.currentTarget)}
                  >
                    <MoreVertical size={18} />
                  </IconButton>
                  <Menu
                    anchorEl={moreAnchor}
                    open={Boolean(moreAnchor)}
                    onClose={() => setMoreAnchor(null)}
                  >
                    <MenuItem
                      component={RouterLink}
                      to={ROUTES.SETTINGS}
                      onClick={() => setMoreAnchor(null)}
                    >
                      {accountNavItems[1]?.label}
                    </MenuItem>
                    <MenuItem
                      component={RouterLink}
                      to={ROUTES.HOME}
                      onClick={() => setMoreAnchor(null)}
                    >
                      {copy.layout.home}
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setMoreAnchor(null)
                        handleLogout()
                      }}
                    >
                      {copy.layout.logout}
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button component={RouterLink} size="small" to={ROUTES.HOME} variant="outlined">
                    {copy.layout.home}
                  </Button>
                  <Button size="small" variant="outlined" onClick={handleLogout}>
                    {copy.layout.logout}
                  </Button>
                </>
              )}
            </Stack>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
