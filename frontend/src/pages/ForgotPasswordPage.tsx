/**
 * ForgotPasswordPage — password recovery request
 * Spec reference: §2.1
 */
import { zodResolver } from '@hookform/resolvers/zod'
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
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { requestPasswordRecovery } from '../lib/mock/authService'
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from './authSchemas'

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  function onSubmit(values: ForgotPasswordFormValues): void {
    requestPasswordRecovery(values)
    setSubmitted(true)
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
                Recover password
              </Typography>
              <Typography color="text.secondary">
                Enter your email and we will prepare a recovery request.
              </Typography>
            </Box>

            {submitted ? (
              <Alert severity="success">Password recovery request saved.</Alert>
            ) : null}

            <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                {...register('email')}
              />
              <Button type="submit" variant="contained">
                Send recovery email
              </Button>
            </Stack>

            <Link component={RouterLink} to="/login">
              Back to login
            </Link>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
