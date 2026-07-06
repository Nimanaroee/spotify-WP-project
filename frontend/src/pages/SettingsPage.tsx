/**
 * SettingsPage — listener settings and account preferences.
 * Spec reference: §2.5
 *
 * Responsibilities:
 *  - [x] Manage local notification and system preferences.
 *  - [x] Update subscription tier and account deletion mock state.
 */
import { useState, type ChangeEvent } from 'react'
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

import ThemeToggleButton from '../components/common/ThemeToggleButton'
import { getAppText } from '../lib/constants/appText'
import { ROLES } from '../lib/constants/roles'
import { ROUTES } from '../lib/constants/routes'
import type { SubscriptionTier } from '../lib/constants/subscriptionLimits'
import {
  deleteAccount,
  getUserPreferences,
  updateSubscriptionTier,
  updateUserPreferences,
} from '../lib/mock/settingsService'
import { useAuthStore } from '../store/authStore'
import { useAppLanguage } from '../theme/LanguageContext'
import type { AppLanguage, SystemVoice, UserPreferences } from '../types'

type MessageSeverity = 'success' | 'info'

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
  const copy = getAppText(language)
  const [preferences, setPreferences] = useState<UserPreferences | null>(() =>
    user ? getUserPreferences(user.id) : null,
  )
  const [message, setMessage] = useState<PageMessage | null>(null)

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (user.role !== ROLES.LISTENER && user.role !== ROLES.ARTIST) {
    return <Navigate to={ROUTES.HOME} replace />
  }

  const currentUser = user
  const currentPreferences = preferences ?? getUserPreferences(currentUser.id)
  const subscriptionTier = currentUser.subscription_tier ?? 'basic'
  const isListener = currentUser.role === ROLES.LISTENER

  function handlePreferenceChange(
    payload: Partial<
      Pick<
        UserPreferences,
        'app_sound_enabled' | 'language' | 'notification_limit' | 'system_voice'
      >
    >,
  ): void {
    const nextPreferences = updateUserPreferences(currentUser.id, payload)
    setPreferences(nextPreferences)
    setMessage(null)

    if (payload.language) {
      setLanguage(payload.language)
    }
  }

  function handleNotificationLimitChange(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    handlePreferenceChange({
      notification_limit: normalizeNotificationLimit(Number(event.target.value)),
    })
  }

  function handleSavePreferences(): void {
    updateUserPreferences(currentUser.id, currentPreferences)
    setMessage({ severity: 'success', text: copy.settings.preferencesSaved })
  }

  function handleSubscriptionChange(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    const nextUser = updateSubscriptionTier(currentUser.id, {
      subscription_tier: event.target.value as SubscriptionTier,
    })
    setUser(nextUser)
    setMessage({ severity: 'success', text: copy.settings.subscriptionSaved })
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
        <Box>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 800 }}>
            {copy.settings.pageTitle}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {copy.settings.subtitle}
          </Typography>
        </Box>

        {message ? (
          <Alert severity={message.severity}>{message.text}</Alert>
        ) : null}

        <Paper className="p-5 md:p-8">
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
                      handlePreferenceChange({
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
                  handlePreferenceChange({
                    language: event.target.value as AppLanguage,
                  })
                }
                select
                value={language}
              >
                <MenuItem value="en">{copy.common.english}</MenuItem>
                <MenuItem value="fa">{copy.common.persian}</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label={copy.settings.systemVoice}
                onChange={(event) =>
                  handlePreferenceChange({
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
                <ThemeToggleButton />
              </Stack>
            </Box>
            <Box>
              <Button onClick={handleSavePreferences} variant="contained">
                {copy.settings.savePreferences}
              </Button>
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
                  fullWidth
                  label={copy.settings.currentPlan}
                  onChange={handleSubscriptionChange}
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
        </Paper>
      </Stack>
    </Box>
  )
}
