import { createContext, useContext } from 'react';
import type { AppLanguage } from '../types';

export const APP_LANGUAGE_STORAGE_KEY = 'spotify-wp-app-language';

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

function getFallbackLanguage(): AppLanguage {
  const storedLanguage = localStorage.getItem(APP_LANGUAGE_STORAGE_KEY);

  return storedLanguage === 'fa' || storedLanguage === 'en'
    ? storedLanguage
    : 'en';
}

export function useAppLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    return {
      language: getFallbackLanguage(),
      setLanguage: () => undefined,
      toggleLanguage: () => undefined,
    };
  }

  return context;
}
