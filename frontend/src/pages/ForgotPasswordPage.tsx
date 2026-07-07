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
import { Link as RouterLink } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { getAppText } from '../lib/constants/appText';
import { requestPasswordRecovery } from '../lib/mock/authService';
import { useAppLanguage } from '../theme/LanguageContext';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from './authSchemas';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const { language } = useAppLanguage();
  const copy = getAppText(language);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  function onSubmit(values: ForgotPasswordFormValues): void {
    requestPasswordRecovery(values);
    setSubmitted(true);
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
                {copy.auth.recoverPassword}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Enter your email and we will prepare a recovery request.
              </Typography>
            </Box>

            {submitted ? (
              <Alert severity="success">Password recovery request saved.</Alert>
            ) : null}

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
              <Button type="submit" variant="contained">
                {copy.auth.sendRecoveryEmail}
              </Button>
            </Stack>

            <Link component={RouterLink} to="/login">
              {copy.auth.backToLogin}
            </Link>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
