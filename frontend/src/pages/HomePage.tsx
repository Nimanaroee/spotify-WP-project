import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ROLES } from '../lib/constants/roles';
import { ROUTES } from '../lib/constants/routes';
import { getAppText } from '../lib/constants/appText';
import { logout } from '../lib/mock/authService';
import MainLayout from '../layouts/MainLayout';
import { getArtworkManagementPageText } from '../lib/constants/artworkManagementPageText';
import { getNotificationsPageText } from '../lib/constants/notificationsPageText';
import { isVerifiedArtist } from '../lib/mock/artistProfileService';
import { useAuthStore } from '../store/authStore';
import { useAppLanguage } from '../theme/LanguageContext';

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();
  const { language } = useAppLanguage();
  const copy = getAppText(language);
  const notificationsCopy = getNotificationsPageText(language);
  const artworkCopy = getArtworkManagementPageText(language);
  const showArtistStudio =
    user?.role === ROLES.ARTIST && isVerifiedArtist(user.id);

  function handleLogout(): void {
    logout();
    setUser(null);
    navigate(ROUTES.LOGIN);
  }

  const content = (
    <Paper className="mx-auto max-w-3xl p-6">
      <Stack spacing={2}>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
          {copy.auth.welcome} {user?.display_name ?? copy.auth.guest}
        </Typography>
        {user?.role === ROLES.LISTENER ? (
          <Button variant="contained" onClick={() => navigate(ROUTES.MANAGE)}>
            {copy.home.manageProfile}
          </Button>
        ) : null}
        {showArtistStudio ? (
          <Button variant="contained" onClick={() => navigate(ROUTES.ARTIST_STUDIO)}>
            {artworkCopy.pageTitle}
          </Button>
        ) : null}
        {user ? (
          <Button variant="outlined" onClick={() => navigate(ROUTES.NOTIFICATIONS)}>
            {notificationsCopy.pageTitle}
          </Button>
        ) : null}
        <Button variant="outlined" onClick={handleLogout}>
          {copy.auth.logout}
        </Button>
      </Stack>
    </Paper>
  );

  if (user) {
    return <MainLayout>{content}</MainLayout>;
  }

  return (
    <Box className="min-h-screen p-6" sx={{ bgcolor: 'background.default' }}>
      {content}
    </Box>
  );
}
