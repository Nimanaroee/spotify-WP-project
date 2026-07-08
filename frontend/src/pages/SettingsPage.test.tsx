import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
  APP_LANGUAGE_STORAGE_KEY,
  LanguageContext,
} from '../theme/LanguageContext'
import { ThemeModeContext } from '../theme/ThemeModeContext'

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
        value={{ mode: 'dark', toggleThemeMode: () => undefined }}
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

    await user.click(screen.getByRole('combobox', { name: /language/i }))
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

  it('updates the local subscription tier', async () => {
    const user = userEvent.setup()
    renderSettingsPage()

    await user.click(screen.getByRole('combobox', { name: /current plan/i }))
    await user.click(screen.getByRole('option', { name: /gold/i }))

    await waitFor(() =>
      expect(useAuthStore.getState().user?.subscription_tier).toBe('gold'),
    )
    expect(
      storage
        .get<Array<{ id: number; subscription_tier: string }>>('users')
        ?.find((storedUser) => storedUser.id === 1)?.subscription_tier,
    ).toBe('gold')
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

    await user.click(screen.getByRole('button', { name: /delete account/i }))

    expect(useAuthStore.getState().user).toBeNull()
    expect(storage.get<number>('auth_user_id')).toBeNull()
    expect(storage.get<Array<{ id: number }>>('users')).toHaveLength(0)
  })
})
