/**
 * SettingsPage — listener settings and account preferences.
 * Spec reference: §2.5
 *
 * Responsibilities:
 *  - [x] Manage local notification and system preferences.
 *  - [x] Update subscription tier and account deletion mock state.
 */
import { useEffect, useState, type ChangeEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { Navigate, useNavigate } from 'react-router-dom'

import PageHeader from '../components/common/PageHeader'
import ThemeToggleButton from '../components/common/ThemeToggleButton'
import { getAppText } from '../lib/constants/appText'
import { ROLES } from '../lib/constants/roles'
import { ROUTES } from '../lib/constants/routes'
import type { SubscriptionTier } from '../lib/constants/subscriptionLimits'
import {
  getUserSubscriptionFromApi,
  getUserPreferencesFromApi,
  hasSettingsApiSession,
  updateUserSubscriptionFromApi,
  updateUserPreferencesFromApi,
} from '../lib/api/settingsService'
import {
  deleteAccount,
  getUserPreferences,
  updateSubscriptionTier,
  updateUserPreferences,
} from '../lib/mock/settingsService'
import { useAuthStore } from '../store/authStore'
import { useAppLanguage } from '../theme/LanguageContext'
import { useThemeMode } from '../theme/ThemeModeContext'
import type { AppLanguage, SystemVoice, UserPreferences } from '../types'

type MessageSeverity = 'success' | 'info' | 'error'

interface PageMessage {
  severity: MessageSeverity
  text: string
}

function normalizeNotificationLimit(value: number): number {
  return Math.min(Math.max(value, 1), 99)
}

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const navigate = useNavigate()
  const { language, setLanguage } = useAppLanguage()
  const { setThemeMode } = useThemeMode()
  const usesSettingsApi = hasSettingsApiSession()
  const copy = getAppText(language)
  const [preferences, setPreferences] = useState<UserPreferences | null>(() =>
    user && !usesSettingsApi ? getUserPreferences(user.id) : null,
  )
  const [isLoading, setIsLoading] = useState(usesSettingsApi)
  const [isSubscriptionSaving, setIsSubscriptionSaving] = useState(false)
  const [message, setMessage] = useState<PageMessage | null>(null)

  useEffect(() => {
    if (!user || !usesSettingsApi) {
      return
    }

    let isActive = true
    setIsLoading(true)
    getUserPreferencesFromApi(user.id)
      .then((nextPreferences) => {
        if (!isActive) {
          return
        }
        setPreferences(nextPreferences)
        setLanguage(nextPreferences.language)
        setThemeMode?.(nextPreferences.theme)
      })
      .catch((error: unknown) => {
        if (isActive) {
          setMessage({
            severity: 'error',
            text: error instanceof Error ? error.message : 'Unable to load preferences.',
          })
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [user?.id, usesSettingsApi])

  useEffect(() => {
    if (!user || user.role !== ROLES.LISTENER || !usesSettingsApi) {
      return
    }

    let isActive = true
    getUserSubscriptionFromApi()
      .then((subscriptionTier) => {
        if (isActive) {
          setUser({
            ...user,
            subscription_tier: subscriptionTier,
          })
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setMessage({
            severity: 'error',
            text:
              error instanceof Error
                ? error.message
                : 'Unable to load subscription.',
          })
        }
      })

    return () => {
      isActive = false
    }
  }, [user?.id, user?.role, usesSettingsApi])

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (user.role !== ROLES.LISTENER && user.role !== ROLES.ARTIST && user.role !== ROLES.SUPPORT && user.role !== ROLES.ADMIN) {
    return <Navigate to={ROUTES.HOME} replace />
  }

  const currentUser = user
  const currentPreferences =
    preferences ??
    (usesSettingsApi ? null : getUserPreferences(currentUser.id))
  const subscriptionTier = currentUser.subscription_tier ?? 'basic'
  const isListener = currentUser.role === ROLES.LISTENER

  async function handlePreferenceChange(
    payload: Partial<
      Pick<
        UserPreferences,
        | 'app_sound_enabled'
        | 'language'
        | 'notification_limit'
        | 'system_voice'
        | 'theme'
      >
    >,
  ): Promise<void> {
    const previousPreferences =
      currentPreferences ?? getUserPreferences(currentUser.id)
    const nextPreferences = {
      ...previousPreferences,
      ...payload,
    }
    setPreferences(nextPreferences)
    setMessage(null)

    if (payload.language) {
      setLanguage(payload.language)
    }
    if (payload.theme) {
      setThemeMode?.(payload.theme)
    }

    if (!usesSettingsApi) {
      setPreferences(updateUserPreferences(currentUser.id, payload))
      return
    }

    try {
      const savedPreferences = await updateUserPreferencesFromApi(
        currentUser.id,
        payload,
      )
      setPreferences((latestPreferences) => ({
        ...savedPreferences,
        ...latestPreferences,
        ...payload,
        created_at: savedPreferences.created_at,
        updated_at: savedPreferences.updated_at,
      }))
    } catch (error) {
      setPreferences((latestPreferences) => {
        if (!latestPreferences) {
          return previousPreferences
        }

        const restoredPreferences = { ...latestPreferences }
        for (const key of Object.keys(payload) as Array<keyof typeof payload>) {
          if (latestPreferences[key] === payload[key]) {
            Object.assign(restoredPreferences, {
              [key]: previousPreferences[key],
            })
          }
        }
        return restoredPreferences
      })
      if (
        payload.language &&
        nextPreferences.language === payload.language
      ) {
        setLanguage(previousPreferences.language)
      }
      if (payload.theme && nextPreferences.theme === payload.theme) {
        setThemeMode?.(previousPreferences.theme)
      }
      setMessage({
        severity: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Unable to update preferences.',
      })
    }
  }

  function handleNotificationLimitChange(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    void handlePreferenceChange({
      notification_limit: normalizeNotificationLimit(Number(event.target.value)),
    })
  }

  async function handleSubscriptionChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): Promise<void> {
    const nextTier = event.target.value as SubscriptionTier

    if (!usesSettingsApi) {
      const nextUser = updateSubscriptionTier(currentUser.id, {
        subscription_tier: nextTier,
      })
      setUser(nextUser)
      setMessage({ severity: 'success', text: copy.settings.subscriptionSaved })
      return
    }

    setIsSubscriptionSaving(true)
    setMessage(null)
    try {
      const subscriptionTier = await updateUserSubscriptionFromApi({
        subscription_tier: nextTier,
      })
      setUser({
        ...currentUser,
        subscription_tier: subscriptionTier,
      })
      setMessage({ severity: 'success', text: copy.settings.subscriptionSaved })
    } catch (error) {
      setMessage({
        severity: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Unable to update subscription.',
      })
    } finally {
      setIsSubscriptionSaving(false)
    }
  }

  function handleDeleteAccount(): void {
    if (!window.confirm(copy.settings.deleteConfirmation)) {
      return
    }

    deleteAccount(currentUser.id)
    setUser(null)
    setMessage({ severity: 'info', text: copy.settings.accountDeleted })
    navigate(ROUTES.LOGIN)
  }

  return (
    <Box
      className="min-h-screen p-4 md:p-8"
      dir={language === 'fa' ? 'rtl' : 'ltr'}
      sx={{ bgcolor: 'background.default' }}
    >
      <Stack className="mx-auto max-w-5xl" spacing={3}>
        <PageHeader>{copy.settings.pageTitle}</PageHeader>

        {message ? (
          <Alert severity={message.severity}>{message.text}</Alert>
        ) : null}

        <Paper className="p-5 md:p-8">
          {isLoading || !currentPreferences ? (
            <Typography color="text.secondary">Loading preferences...</Typography>
          ) : (
            <Stack spacing={3}>
            <Box>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
                {copy.settings.notificationsTitle}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {copy.settings.notificationsDescription}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              }}
            >
              <TextField
                fullWidth
                label={copy.settings.notificationLimit}
                onChange={handleNotificationLimitChange}
                slotProps={{ htmlInput: { min: 1, max: 99 } }}
                type="number"
                value={currentPreferences.notification_limit}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={currentPreferences.app_sound_enabled}
                    onChange={(event) =>
                      void handlePreferenceChange({
                        app_sound_enabled: event.target.checked,
                      })
                    }
                  />
                }
                label={copy.settings.appSoundEnabled}
              />
            </Box>

            <Divider />

            <Box>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
                {copy.settings.systemTitle}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {copy.settings.systemDescription}
              </Typography>
            </Box>
            <Box
              sx={{
                alignItems: 'center',
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              }}
            >
              <TextField
                fullWidth
                label={copy.settings.languageLabel}
                onChange={(event) =>
                  void handlePreferenceChange({
                    language: event.target.value as AppLanguage,
                  })
                }
                select
                value={currentPreferences.language}
              >
                <MenuItem value="en">{copy.common.english}</MenuItem>
                <MenuItem value="fa">{copy.common.persian}</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label={copy.settings.systemVoice}
                onChange={(event) =>
                  void handlePreferenceChange({
                    system_voice: event.target.value as SystemVoice,
                  })
                }
                select
                value={currentPreferences.system_voice}
              >
                <MenuItem value="default">
                  {copy.settings.voiceOptions.default}
                </MenuItem>
                <MenuItem value="calm">{copy.settings.voiceOptions.calm}</MenuItem>
                <MenuItem value="bright">
                  {copy.settings.voiceOptions.bright}
                </MenuItem>
              </TextField>
              <Stack spacing={1}>
                <Typography color="text.secondary" variant="body2">
                  {copy.settings.theme}
                </Typography>
                <ThemeToggleButton
                  onToggle={(theme) => void handlePreferenceChange({ theme })}
                />
              </Stack>
            </Box>

            {isListener ? (
              <>
                <Divider />

                <Box>
                  <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
                    {copy.settings.subscriptionTitle}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    {copy.settings.subscriptionDescription}
                  </Typography>
                </Box>
                <TextField
                  disabled={isSubscriptionSaving}
                  fullWidth
                  label={copy.settings.currentPlan}
                  onChange={(event) => void handleSubscriptionChange(event)}
                  select
                  value={subscriptionTier}
                >
                  <MenuItem value="basic">{copy.settings.tierOptions.basic}</MenuItem>
                  <MenuItem value="silver">{copy.settings.tierOptions.silver}</MenuItem>
                  <MenuItem value="gold">{copy.settings.tierOptions.gold}</MenuItem>
                </TextField>
              </>
            ) : null}

            <Divider />

            <Box>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
                {copy.settings.accountTitle}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                {copy.settings.accountDescription}
              </Typography>
              <Button color="error" onClick={handleDeleteAccount} variant="outlined">
                {copy.settings.deleteAccount}
              </Button>
            </Box>
            </Stack>
          )}
        </Paper>
      </Stack>
    </Box>
  )
}
