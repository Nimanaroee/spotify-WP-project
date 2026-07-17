import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { getAppText } from '../lib/constants/appText';
import { login } from '../lib/api/authService';
import { getUserPreferencesFromApi } from '../lib/api/settingsService';
import { useAuthStore } from '../store/authStore';
import { useAppLanguage } from '../theme/LanguageContext';
import { useThemeMode } from '../theme/ThemeModeContext';
import { loginSchema, type LoginFormValues } from './authSchemas';

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [formError, setFormError] = useState('');
  const { language, setLanguage } = useAppLanguage();
  const { setThemeMode } = useThemeMode();
  const copy = getAppText(language);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginFormValues): Promise<void> {
    setFormError('');
    try {
      const result = await login(values.email, values.password);
      setUser(result.user);
      await getUserPreferencesFromApi(result.user.id)
        .then((preferences) => {
          setLanguage(preferences.language);
          setThemeMode?.(preferences.theme);
        })
        .catch(() => undefined);
      navigate(result.redirectPath);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Login failed.');
    }
  }

  return (
    <Box
      className="flex min-h-screen items-center justify-center p-4"
      sx={{ bgcolor: 'background.default' }}
    >
      <Card className="w-full max-w-md">
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
                {copy.auth.welcome}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {copy.auth.loginSubtitle}
              </Typography>
            </Box>

            {formError ? <Alert severity="error">{formError}</Alert> : null}

            <Stack
              component="form"
              spacing={2}
              onSubmit={handleSubmit(onSubmit)}
            >
              <TextField
                label={copy.auth.email}
                type="email"
                autoComplete="email"
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                {...register('email')}
              />
              <TextField
                label={copy.auth.password}
                type="password"
                autoComplete="current-password"
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
                {...register('password')}
              />
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {copy.auth.logIn}
              </Button>
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}
            >
              <Link component={RouterLink} to="/forgot-password">
                {copy.auth.forgotPassword}
              </Link>
              <Link component={RouterLink} to="/register">
                {copy.auth.createAccount}
              </Link>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
