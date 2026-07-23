import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material'
import { useMemo, useState, type ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import SettingsPage from './SettingsPage'
import LoginPage from './LoginPage'
import { ROLES } from '../lib/constants/roles'
import { ROUTES } from '../lib/constants/routes'
import { storage } from '../lib/mock/storage'
import { useAuthStore } from '../store/authStore'
import {
  getSubscriptionFeesFromApi,
  getUserPreferencesFromApi,
  getUserSubscriptionFromApi,
  updateUserPreferencesFromApi,
} from '../lib/api/settingsService'
import {
  APP_LANGUAGE_STORAGE_KEY,
  LanguageContext,
} from '../theme/LanguageContext'
import { ThemeModeContext } from '../theme/ThemeModeContext'

vi.mock('../lib/api/settingsService', () => ({
  createSubscriptionPaymentFromApi: vi.fn(),
  getSubscriptionFeesFromApi: vi.fn(),
  getUserPreferencesFromApi: vi.fn(),
  getUserSubscriptionFromApi: vi.fn(),
  updateUserPreferencesFromApi: vi.fn(),
  updateUserSubscriptionFromApi: vi.fn(),
}))

function TestProviders({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<'en' | 'fa'>(
    localStorage.getItem(APP_LANGUAGE_STORAGE_KEY) === 'fa' ? 'fa' : 'en',
  )

  const languageValue = useMemo(
    () => ({
      language,
      setLanguage: (nextLanguage: 'en' | 'fa') => {
        localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, nextLanguage)
        setLanguage(nextLanguage)
      },
      toggleLanguage: () => {
        const nextLanguage = language === 'en' ? 'fa' : 'en'
        localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, nextLanguage)
        setLanguage(nextLanguage)
      },
    }),
    [language],
  )

  return (
    <LanguageContext.Provider value={languageValue}>
      <ThemeModeContext.Provider
        value={{
          mode: 'dark',
          setThemeMode: () => undefined,
          toggleThemeMode: () => undefined,
        }}
      >
        <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
      </ThemeModeContext.Provider>
    </LanguageContext.Provider>
  )
}

function renderSettingsPage() {
  return render(
    <TestProviders>
      <MemoryRouter initialEntries={[ROUTES.SETTINGS]}>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    </TestProviders>,
  )
}

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(getUserPreferencesFromApi).mockResolvedValue({
      user_id: 1,
      theme: 'dark',
      notification_limit: 20,
      app_sound_enabled: true,
      language: 'en',
      system_voice: 'default',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    })
    vi.mocked(getUserSubscriptionFromApi).mockResolvedValue({
      subscription_tier: 'basic',
      expires_at: null,
    })
    vi.mocked(getSubscriptionFeesFromApi).mockResolvedValue([
      { subscription_tier: 'basic', price_per_month: 0 },
      { subscription_tier: 'silver', price_per_month: 9.99 },
      { subscription_tier: 'gold', price_per_month: 19.99 },
    ])
    vi.mocked(updateUserPreferencesFromApi).mockImplementation(
      async (userId, payload) => ({
        user_id: userId,
        theme: payload.theme ?? 'dark',
        notification_limit: payload.notification_limit ?? 20,
        app_sound_enabled: payload.app_sound_enabled ?? true,
        language: payload.language ?? 'en',
        system_voice: payload.system_voice ?? 'default',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      }),
    )
    storage.set('users', [
      {
        id: 1,
        username: 'listener',
        email: 'listener@example.com',
        password: 'password123',
        display_name: 'Listener',
        role: ROLES.LISTENER,
        subscription_tier: 'basic',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ])
    useAuthStore.setState({
      user: {
        id: 1,
        username: 'listener',
        email: 'listener@example.com',
        display_name: 'Listener',
        role: ROLES.LISTENER,
        subscription_tier: 'basic',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    })
  })

  it('switches settings labels to Persian from the language preference', async () => {
    const user = userEvent.setup()
    renderSettingsPage()

    await user.click(await screen.findByRole('combobox', { name: /language/i }))
    await user.click(screen.getByRole('option', { name: /persian/i }))

    expect(await screen.findByText('تنظیمات اعلان')).toBeInTheDocument()
    expect(screen.getByText('ترجیحات سیستم')).toBeInTheDocument()
    expect(localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)).toBe('fa')
  })

  it('does not show the settings subtitle under the page title', () => {
    renderSettingsPage()

    expect(
      screen.queryByText(
        'Control notifications, system preferences, account access, and subscription status.',
      ),
    ).not.toBeInTheDocument()
  })

  it('does not require a save button for preference changes', () => {
    renderSettingsPage()

    expect(
      screen.queryByRole('button', { name: /save preferences|ذخیره تنظیمات/i }),
    ).not.toBeInTheDocument()
  })

  it('shows subscription upgrade fields instead of a plan-changing bar', async () => {
    renderSettingsPage()

    expect(
      await screen.findByRole('combobox', { name: /subscription type/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', { name: /duration/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upgrade!/i })).toBeInTheDocument()
  })

  it('allows support staff to open settings', () => {
    useAuthStore.setState({
      user: {
        id: 3,
        username: 'support_agent',
        email: 'support@example.com',
        display_name: 'Support Agent',
        role: ROLES.SUPPORT,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    })

    renderSettingsPage()

    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: /current plan/i })).not.toBeInTheDocument()
  })

  it('hides subscription controls for artists', () => {
    useAuthStore.setState({
      user: {
        id: 2,
        username: 'artist',
        email: 'artist@example.com',
        display_name: 'Artist',
        role: ROLES.ARTIST,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    })

    renderSettingsPage()

    expect(screen.queryByText('Subscription status')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: /current plan/i })).not.toBeInTheDocument()
  })

  it('deletes the local listener account after confirmation', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderSettingsPage()

    await user.click(
      await screen.findByRole('button', { name: /delete account/i }),
    )

    expect(useAuthStore.getState().user).toBeNull()
    expect(storage.get<number>('auth_user_id')).toBeNull()
    expect(storage.get<Array<{ id: number }>>('users')).toHaveLength(1)
  })
})
