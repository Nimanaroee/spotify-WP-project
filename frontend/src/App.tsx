import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import Router from './routes/router';
import { seedDemoData } from './lib/mock/seed';
import { getCurrentUser } from './lib/mock/authService';
import { useAuthStore } from './store/authStore';
import {
  APP_LANGUAGE_STORAGE_KEY,
  LanguageContext,
} from './theme/LanguageContext';
import {
  THEME_MODE_STORAGE_KEY,
  createAppTheme,
  type AppThemeMode,
} from './theme/appTheme';
import { ThemeModeContext } from './theme/ThemeModeContext';
import type { AppLanguage } from './types';

function getStoredThemeMode(): AppThemeMode {
  const storedMode = localStorage.getItem(THEME_MODE_STORAGE_KEY);

  return storedMode === 'light' || storedMode === 'dark' ? storedMode : 'dark';
}

function getStoredLanguage(): AppLanguage {
  const storedLanguage = localStorage.getItem(APP_LANGUAGE_STORAGE_KEY);

  return storedLanguage === 'fa' || storedLanguage === 'en'
    ? storedLanguage
    : 'en';
}

export default function App() {
  const setUser = useAuthStore((state) => state.setUser);
  const [mode, setMode] = useState<AppThemeMode>(getStoredThemeMode);
  const [language, setLanguage] = useState<AppLanguage>(getStoredLanguage);
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const themeModeContextValue = useMemo(
    () => ({
      mode,
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
    seedDemoData();
    setUser(getCurrentUser());
  }, [setUser]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
  }, [language]);

  return (
    <ThemeModeContext.Provider value={themeModeContextValue}>
      <LanguageContext.Provider value={languageContextValue}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <Router />
          </BrowserRouter>
        </ThemeProvider>
      </LanguageContext.Provider>
    </ThemeModeContext.Provider>
  );
}
