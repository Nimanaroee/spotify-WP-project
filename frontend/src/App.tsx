import { BrowserRouter } from 'react-router-dom';
import { CacheProvider } from '@emotion/react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import Router from './routes/router';
import { getCurrentUser } from './lib/api/authService';
import { useAuthStore } from './store/authStore';
import { useNotificationStore } from './store/notificationStore';
import {
  APP_LANGUAGE_STORAGE_KEY,
  LanguageContext,
} from './theme/LanguageContext';
import {
  THEME_MODE_STORAGE_KEY,
  createAppTheme,
  type AppThemeMode,
} from './theme/appTheme';
import { emotionCacheLtr, emotionCacheRtl } from './theme/emotionCache';
import { ThemeModeContext } from './theme/ThemeModeContext';
import type { AppLanguage } from './types';
import PlayerBar from './components/player/PlayerBar';

function getStoredThemeMode(): AppThemeMode {
  const storedMode = localStorage.getItem(THEME_MODE_STORAGE_KEY);
  return storedMode === 'light' || storedMode === 'dark' ? storedMode : 'dark';
}

function getStoredLanguage(): AppLanguage {
  const storedLanguage = localStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
  return storedLanguage === 'fa' || storedLanguage === 'en' ? storedLanguage : 'en';
}

export default function App() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const loadNotificationsForUser = useNotificationStore((state) => state.loadForUser);
  const clearNotifications = useNotificationStore((state) => state.clear);
  const [mode, setMode] = useState<AppThemeMode>(getStoredThemeMode);
  const [language, setLanguage] = useState<AppLanguage>(getStoredLanguage);
  
  const isRtl = language === 'fa';
  
  const theme = useMemo(() => createAppTheme(mode, isRtl ? 'rtl' : 'ltr'), [mode, isRtl]);
  const emotionCache = isRtl ? emotionCacheRtl : emotionCacheLtr;
  
  const themeModeContextValue = useMemo(
    () => ({
      mode,
      setThemeMode: (nextMode: AppThemeMode) => {
        setMode(nextMode);
        localStorage.setItem(THEME_MODE_STORAGE_KEY, nextMode);
      },
      toggleThemeMode: () => {
        setMode((currentMode) => {
          const nextMode = currentMode === 'dark' ? 'light' : 'dark';
          localStorage.setItem(THEME_MODE_STORAGE_KEY, nextMode);
          return nextMode;
        });
      },
    }),
    [mode]
  );
  
  const languageContextValue = useMemo(
    () => ({
      language,
      setLanguage: (nextLanguage: AppLanguage) => {
        setLanguage(nextLanguage);
        localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, nextLanguage);
      },
      toggleLanguage: () => {
        setLanguage((currentLanguage) => {
          const nextLanguage = currentLanguage === 'en' ? 'fa' : 'en';
          localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, nextLanguage);
          return nextLanguage;
        });
      },
    }),
    [language]
  );

  useEffect(() => {
    setUser(getCurrentUser());
  }, [setUser]);

  useEffect(() => {
    if (user) {
      void loadNotificationsForUser();
      return;
    }
    clearNotifications();
  }, [user, loadNotificationsForUser, clearNotifications]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
  }, [language]);

  return (
    <CacheProvider value={emotionCache}>
      <ThemeModeContext.Provider value={themeModeContextValue}>
        <LanguageContext.Provider value={languageContextValue}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
              <Router />
              {user ? <PlayerBar /> : null}
            </BrowserRouter>
          </ThemeProvider>
        </LanguageContext.Provider>
      </ThemeModeContext.Provider>
    </CacheProvider>
  );
}