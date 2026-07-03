/**
 * LoginPage — unified login for every role
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
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { login } from '../lib/mock/authService'
import { useAuthStore } from '../store/authStore'
import { loginSchema, type LoginFormValues } from './authSchemas'

export default function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  function onSubmit(values: LoginFormValues): void {
    setFormError('')
    try {
      const result = login(values.email, values.password)
      setUser(result.user)
      navigate(result.redirectPath)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Login failed.')
    }
  }

  return (
    <Box className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md">
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
                Welcome
              </Typography>
              <Typography color="text.secondary">
                Login to enjoy our world of music.
              </Typography>
            </Box>

            {formError ? <Alert severity="error">{formError}</Alert> : null}

            <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                {...register('email')}
              />
              <TextField
                label="Password"
                type="password"
                autoComplete="current-password"
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
                {...register('password')}
              />
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                Log in
              </Button>
            </Stack>

            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Link component={RouterLink} to="/forgot-password">
                Forgot Password?
              </Link>
              <Link component={RouterLink} to="/register">
                Create account
              </Link>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
