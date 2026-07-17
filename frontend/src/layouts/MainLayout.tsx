import {
  AppBar,
  Avatar,
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
  useTheme,
} from '@mui/material';
import { Menu } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import NotificationPanel from '../components/notifications/NotificationPanel';
import { getProfileInitials } from '../components/profile/profileUtils';
import { useIsMobile } from '../hooks/useIsMobile';
import { getAppText } from '../lib/constants/appText';
import { getHomePageText } from '../lib/constants/homePageText';
import { getMainNavForRole } from '../lib/constants/navItems';
import { ROUTES } from '../lib/constants/routes';
import { logout } from '../lib/api/authService';
import {
  hasSettingsApiSession,
  updateUserPreferencesFromApi,
} from '../lib/api/settingsService';
import { updateUserPreferences } from '../lib/mock/settingsService';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { useLayoutStore } from '../store/layoutStore'; // <--- NEW IMPORT
import { useAppLanguage } from '../theme/LanguageContext';

const DRAWER_WIDTH = 260;

export default function MainLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  
  // Use Global State so navigation keeps menu opened/closed exactly as left
  const { sidebarOpen, setSidebarOpen, initialize } = useLayoutStore();

  const { language, setLanguage } = useAppLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useIsMobile();
  const prevIsMobileRef = useRef(isMobile);

  useEffect(() => {
    // Determine default opened/closed state on first load based on screen size
    initialize(isMobile);
    
    // Automatically hide the sidebar if the user shrinks their browser down to mobile size dynamically
    if (isMobile && !prevIsMobileRef.current) {
      setSidebarOpen(false);
    }
    prevIsMobileRef.current = isMobile;
  }, [isMobile, initialize, setSidebarOpen]);

  const appCopy = getAppText(language);
  const homeCopy = getHomePageText(language);
  const navItems = user ? getMainNavForRole(user.role, user.username || '', language) : [];

  const languageLabel = language === 'en' ? appCopy.common.persian : appCopy.common.english;
  const languageShort = language === 'en' ? 'FA' : 'EN';

  async function handleLogout(): Promise<void> {
    await logout();
    setUser(null);
    navigate(ROUTES.LOGIN);
  }

  async function handleLanguageToggle(): Promise<void> {
    const nextLanguage = language === 'en' ? 'fa' : 'en';
    setLanguage(nextLanguage);

    if (!user) {
      return;
    }

    if (!hasSettingsApiSession()) {
      updateUserPreferences(user.id, { language: nextLanguage });
      return;
    }

    try {
      await updateUserPreferencesFromApi(user.id, { language: nextLanguage });
    } catch {
      setLanguage(language);
    }
  }

  const drawerContent = (
    <Box sx={{ pt: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography className="px-4 pb-4" variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
        Spotify WP
      </Typography>
      <List sx={{ flexGrow: 1, px: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              selected={isActive}
              to={item.path}
              onClick={() => {
                // If on mobile, closing upon clicking a link saves screen space
                if (isMobile) setSidebarOpen(false);
              }}
              sx={{ borderRadius: 1.5, mb: 0.5 }}
            >
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: isActive ? 700 : 500 }} />
            </ListItemButton>
          );
        })}
      </List>
      {user && (
         <Box sx={{ p: 2, pb: 4 }}>
           <Button fullWidth variant="outlined" color="inherit" onClick={() => void handleLogout()} sx={{ mb: 1.5 }}>
             {appCopy.auth.logout}
           </Button>
           <Button fullWidth variant="text" color="inherit" onClick={() => setSidebarOpen(false)}>
             {homeCopy.nav.closeSidebar}
           </Button>
         </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex' }}>
      {user && (
        <Drawer
          ModalProps={{ keepMounted: true }}
          anchor="left" 
          open={sidebarOpen}
          variant={isMobile ? 'temporary' : 'persistent'}
          onClose={() => setSidebarOpen(false)}
          sx={{
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              pb: currentTrack && !isMobile ? '90px' : 0, 
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          minHeight: '100vh',
          minWidth: 0,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(user && !isMobile && sidebarOpen
            ? {
                transition: theme.transitions.create(['margin', 'width'], {
                  easing: theme.transitions.easing.easeOut,
                  duration: theme.transitions.duration.enteringScreen,
                }),
                marginInlineStart: `${DRAWER_WIDTH}px`,
              }
            : {}),
        }}
      >
        {user ? (
          <AppBar color="transparent" elevation={0} position="sticky" sx={{ bgcolor: 'background.default' }}>
            <Toolbar sx={{ gap: { xs: 0.5, md: 2 }, minWidth: 0 }}>
              {!sidebarOpen && (
                <IconButton
                  aria-label={homeCopy.nav.openSidebar}
                  onClick={() => setSidebarOpen(true)}
                  edge="start"
                  sx={{ flexShrink: 0 }}
                >
                  <Menu size={24} />
                </IconButton>
              )}
              
              <Box sx={{ flex: 1, minWidth: 0 }} />

              <Stack
                direction="row"
                spacing={{ xs: 0.5, md: 1.5 }}
                sx={{ alignItems: 'center', flexShrink: 0 }}
              >
                <Button
                  aria-label={languageLabel}
                  size="small"
                  variant="text"
                  onClick={() => void handleLanguageToggle()}
                  color="inherit"
                  sx={{ minWidth: { xs: 36, md: 'auto' }, px: { xs: 1, md: 1.5 } }}
                >
                  {isMobile ? languageShort : languageLabel}
                </Button>
                <NotificationPanel />
                
                <Stack
                  component={RouterLink}
                  to={`/profile/${user.username}`}
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: 'center',
                    ml: { xs: 0, md: 1 },
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
                   {!isMobile && (
                     <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {user.display_name}
                     </Typography>
                   )}
                </Stack>
              </Stack>
            </Toolbar>
          </AppBar>
        ) : null}

        <Box component="main" sx={{ flexGrow: 1, minWidth: 0, pb: currentTrack ? { xs: '120px', md: '140px' } : 8 }}>
          {children}
        </Box>
      </Box>

    </Box>
  );
}
