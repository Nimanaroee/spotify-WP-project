import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material'
import { useMemo, useState, type ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import {
  createSubscriptionPaymentFromApi,
  getSubscriptionFeesFromApi,
  getUserSubscriptionFromApi,
  getUserPreferencesFromApi,
  updateUserSubscriptionFromApi,
  updateUserPreferencesFromApi,
} from '../lib/api/settingsService'
import { ROLES } from '../lib/constants/roles'
import { ROUTES } from '../lib/constants/routes'
import { useAuthStore } from '../store/authStore'
import {
  LanguageContext,
} from '../theme/LanguageContext'
import { ThemeModeContext } from '../theme/ThemeModeContext'
import type { AppLanguage, UserPreferences } from '../types'
import type { AppThemeMode } from '../theme/appTheme'
import SettingsPage from './SettingsPage'

vi.mock('../lib/api/settingsService', () => ({
  getUserSubscriptionFromApi: vi.fn(),
  getSubscriptionFeesFromApi: vi.fn(),
  createSubscriptionPaymentFromApi: vi.fn(),
  getUserPreferencesFromApi: vi.fn(),
  updateUserSubscriptionFromApi: vi.fn(),
  updateUserPreferencesFromApi: vi.fn(),
}))

const preferences = {
  user_id: 1,
  theme: 'dark' as const,
  notification_limit: 20,
  app_sound_enabled: true,
  language: 'en' as const,
  system_voice: 'default' as const,
  created_at: '2026-07-17T10:00:00.000Z',
  updated_at: '2026-07-17T10:00:00.000Z',
}

function TestProviders({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en')
  const [mode, setMode] = useState<AppThemeMode>('dark')
  const languageValue = useMemo(
    () => ({
      language,
      setLanguage: setLanguageState,
      toggleLanguage: () =>
        setLanguageState((current) => (current === 'en' ? 'fa' : 'en')),
    }),
    [language],
  )

  return (
    <LanguageContext.Provider value={languageValue}>
      <ThemeModeContext.Provider
        value={{
          mode,
          setThemeMode: setMode,
          toggleThemeMode: () =>
            setMode((current) => (current === 'dark' ? 'light' : 'dark')),
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
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    </TestProviders>,
  )
}

describe('SettingsPage API integration', () => {
  beforeEach(() => {
    let savedPreferences: UserPreferences = { ...preferences }
    vi.mocked(getUserPreferencesFromApi).mockReset()
    vi.mocked(getUserSubscriptionFromApi).mockReset()
    vi.mocked(getSubscriptionFeesFromApi).mockReset()
    vi.mocked(createSubscriptionPaymentFromApi).mockReset()
    vi.mocked(updateUserPreferencesFromApi).mockReset()
    vi.mocked(updateUserSubscriptionFromApi).mockReset()
    vi.mocked(getUserPreferencesFromApi).mockResolvedValue(preferences)
    vi.mocked(getUserSubscriptionFromApi).mockResolvedValue({
      subscription_tier: 'silver',
      expires_at: '2026-08-17T10:00:00.000Z',
    })
    vi.mocked(getSubscriptionFeesFromApi).mockResolvedValue([
      { subscription_tier: 'basic', price_per_month: 0 },
      { subscription_tier: 'silver', price_per_month: 9.99 },
      { subscription_tier: 'gold', price_per_month: 19.99 },
    ])
    vi.mocked(updateUserPreferencesFromApi).mockImplementation(
      async (_userId, payload) => {
        savedPreferences = {
          ...savedPreferences,
          ...payload,
          updated_at: '2026-07-17T11:00:00.000Z',
        }
        return savedPreferences
      },
    )
    vi.mocked(createSubscriptionPaymentFromApi).mockResolvedValue({
      id: 42,
      amount: 19.99,
      duration_months: 1,
      account_type: 'gold',
    })
    vi.mocked(updateUserSubscriptionFromApi).mockResolvedValue({
      subscription_tier: 'gold',
      expires_at: '2026-08-23T10:00:00.000Z',
    })
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

  it('loads preferences from the API', async () => {
    renderSettingsPage()

    expect(await screen.findByDisplayValue('20')).toBeInTheDocument()
    expect(getUserPreferencesFromApi).toHaveBeenCalledWith(1)
    expect(getUserSubscriptionFromApi).toHaveBeenCalled()
  })

  it('patches each preference immediately without a save button', async () => {
    const user = userEvent.setup()
    renderSettingsPage()

    const limitInput = await screen.findByRole('spinbutton', {
      name: /notification limit/i,
    })
    fireEvent.change(limitInput, { target: { value: '42' } })
    await user.click(screen.getByRole('switch', { name: /notification sounds/i }))
    await user.click(screen.getByRole('combobox', { name: /system voice/i }))
    await user.click(screen.getByRole('option', { name: /calm/i }))
    await user.click(screen.getByRole('button', { name: /switch to light theme/i }))
    await user.click(screen.getByRole('combobox', { name: /language/i }))
    await user.click(screen.getByRole('option', { name: /persian/i }))

    await waitFor(() => {
      expect(updateUserPreferencesFromApi).toHaveBeenCalledWith(1, {
        notification_limit: 42,
      })
      expect(updateUserPreferencesFromApi).toHaveBeenCalledWith(1, {
        app_sound_enabled: false,
      })
      expect(updateUserPreferencesFromApi).toHaveBeenCalledWith(1, {
        system_voice: 'calm',
      })
      expect(updateUserPreferencesFromApi).toHaveBeenCalledWith(1, {
        theme: 'light',
      })
      expect(updateUserPreferencesFromApi).toHaveBeenCalledWith(1, {
        language: 'fa',
      })
    })
    expect(
      screen.queryByRole('button', { name: /save preferences|ذخیره تنظیمات/i }),
    ).not.toBeInTheDocument()
  })

  it('logs payment then upgrades the selected subscription', async () => {
    const user = userEvent.setup()
    renderSettingsPage()

    const typeSelect = await screen.findByRole('combobox', {
      name: /subscription type/i,
    })
    expect(typeSelect).toHaveTextContent('Gold')

    await user.click(screen.getByRole('button', { name: /upgrade!/i }))

    expect(createSubscriptionPaymentFromApi).toHaveBeenCalledWith({
      amount: 19.99,
      duration_months: 1,
      account_type: 'gold',
    })
    expect(updateUserSubscriptionFromApi).toHaveBeenCalledWith({
      subscription_tier: 'gold',
      duration_months: 1,
      payment_log_id: 42,
    })
    expect(useAuthStore.getState().user?.subscription_tier).toBe('gold')
  })
})
