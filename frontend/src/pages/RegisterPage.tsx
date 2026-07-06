import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { getAppText } from '../lib/constants/appText';
import { registerArtist, registerListener } from '../lib/mock/authService';
import { useAuthStore } from '../store/authStore';
import { useAppLanguage } from '../theme/LanguageContext';
import {
  artistRegistrationSchema,
  listenerRegistrationSchema,
  parsePortfolioLinks,
  type ArtistRegistrationFormValues,
  type ListenerRegistrationFormValues,
} from './authSchemas';

type RegisterTab = 'listener' | 'artist';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [tab, setTab] = useState<RegisterTab>('listener');
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [artistMessage, setArtistMessage] = useState('');
  const { language } = useAppLanguage();
  const copy = getAppText(language);

  const listenerForm = useForm<ListenerRegistrationFormValues>({
    resolver: zodResolver(listenerRegistrationSchema),
    defaultValues: {
      display_name: '',
      email: '',
      password: '',
      password_confirmation: '',
      birth_date: '',
      gender: 'prefer_not_to_say',
      privacy_policy_accepted: false,
    },
  });

  const artistForm = useForm<ArtistRegistrationFormValues>({
    resolver: zodResolver(artistRegistrationSchema),
    defaultValues: {
      email: '',
      password: '',
      password_confirmation: '',
      stage_name: '',
      portfolio_links: '',
    },
  });

  function submitListener(values: ListenerRegistrationFormValues): void {
    setFormError('');
    try {
      const user = registerListener(values);
      setUser(user);
      navigate('/');
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Registration failed.'
      );
    }
  }

  function submitArtist(values: ArtistRegistrationFormValues): void {
    setFormError('');
    setArtistMessage('');
    try {
      const result = registerArtist({
        email: values.email,
        password: values.password,
        password_confirmation: values.password_confirmation,
        stage_name: values.stage_name,
        portfolio_links: parsePortfolioLinks(values.portfolio_links),
      });
      artistForm.reset();
      setArtistMessage(result.message);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Registration failed.'
      );
    }
  }

  return (
    <Box
      className="flex min-h-screen items-center justify-center p-4"
      sx={{ bgcolor: 'background.default' }}
    >
      <Card className="w-full max-w-2xl">
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
                {copy.auth.createAccount}
              </Typography>
              <Typography color="text.secondary">
                {language === 'fa'
                  ? 'به‌عنوان شنونده ثبت‌نام کنید یا دسترسی هنرمند را درخواست دهید.'
                  : 'Register as a listener or request artist access.'}
              </Typography>
            </Box>

            <Tabs
              value={tab}
              onChange={(_, value: RegisterTab) => setTab(value)}
            >
              <Tab label={copy.auth.regularUser} value="listener" />
              <Tab label={copy.auth.artist} value="artist" />
            </Tabs>

            {formError ? <Alert severity="error">{formError}</Alert> : null}
            {artistMessage ? (
              <Alert severity="info">{artistMessage}</Alert>
            ) : null}

            {tab === 'listener' ? (
              <Stack
                component="form"
                spacing={2}
                onSubmit={listenerForm.handleSubmit(submitListener)}
              >
                <TextField
                  label={language === 'fa' ? 'نام نمایشی' : 'Display Name'}
                  error={Boolean(listenerForm.formState.errors.display_name)}
                  helperText={
                    listenerForm.formState.errors.display_name?.message
                  }
                  {...listenerForm.register('display_name')}
                />
                <TextField
                  label={copy.auth.email}
                  type="email"
                  error={Boolean(listenerForm.formState.errors.email)}
                  helperText={listenerForm.formState.errors.email?.message}
                  {...listenerForm.register('email')}
                />
                <TextField
                  label={copy.auth.password}
                  type="password"
                  error={Boolean(listenerForm.formState.errors.password)}
                  helperText={listenerForm.formState.errors.password?.message}
                  {...listenerForm.register('password')}
                />
                <TextField
                  label={
                    language === 'fa' ? 'تکرار رمز عبور' : 'Confirm Password'
                  }
                  type="password"
                  error={Boolean(
                    listenerForm.formState.errors.password_confirmation
                  )}
                  helperText={
                    listenerForm.formState.errors.password_confirmation?.message
                  }
                  {...listenerForm.register('password_confirmation')}
                />
                <TextField
                  label={language === 'fa' ? 'تاریخ تولد' : 'Date of Birth'}
                  type="date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={Boolean(listenerForm.formState.errors.birth_date)}
                  helperText={listenerForm.formState.errors.birth_date?.message}
                  {...listenerForm.register('birth_date')}
                />
                <Controller
                  control={listenerForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormControl
                      error={Boolean(listenerForm.formState.errors.gender)}
                    >
                      <InputLabel id="gender-label">
                        {copy.auth.gender}
                      </InputLabel>
                      <Select
                        labelId="gender-label"
                        label={copy.auth.gender}
                        name={field.name}
                        value={field.value}
                        onBlur={field.onBlur}
                        inputRef={field.ref}
                        onChange={(event) => field.onChange(event.target.value)}
                      >
                        <MenuItem value="male">
                          {language === 'fa' ? 'مرد' : 'Male'}
                        </MenuItem>
                        <MenuItem value="female">
                          {language === 'fa' ? 'زن' : 'Female'}
                        </MenuItem>
                        <MenuItem value="other">
                          {language === 'fa' ? 'سایر' : 'Other'}
                        </MenuItem>
                        <MenuItem value="prefer_not_to_say">
                          {language === 'fa'
                            ? 'ترجیح می‌دهم نگویم'
                            : 'Prefer not to say'}
                        </MenuItem>
                      </Select>
                      <FormHelperText>
                        {listenerForm.formState.errors.gender?.message}
                      </FormHelperText>
                    </FormControl>
                  )}
                />
                <Controller
                  control={listenerForm.control}
                  name="privacy_policy_accepted"
                  render={({ field }) => (
                    <FormControl
                      error={Boolean(
                        listenerForm.formState.errors.privacy_policy_accepted
                      )}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={field.value}
                            onBlur={field.onBlur}
                            slotProps={{ input: { ref: field.ref } }}
                            onChange={(event) =>
                              field.onChange(event.target.checked)
                            }
                          />
                        }
                        label={
                          <span>
                            {language === 'fa'
                              ? 'من با شرایط و'
                              : 'I agree to the Terms and'}{' '}
                            <Button
                              type="button"
                              variant="text"
                              onClick={() => setPrivacyOpen(true)}
                            >
                              {language === 'fa'
                                ? 'سیاست حریم خصوصی'
                                : 'Privacy Policy'}
                            </Button>
                          </span>
                        }
                      />
                      <FormHelperText>
                        {
                          listenerForm.formState.errors.privacy_policy_accepted
                            ?.message
                        }
                      </FormHelperText>
                    </FormControl>
                  )}
                />
                <Button type="submit" variant="contained">
                  {copy.auth.register}
                </Button>
              </Stack>
            ) : (
              <Stack
                component="form"
                spacing={2}
                onSubmit={artistForm.handleSubmit(submitArtist)}
              >
                <TextField
                  label={copy.auth.email}
                  type="email"
                  error={Boolean(artistForm.formState.errors.email)}
                  helperText={artistForm.formState.errors.email?.message}
                  {...artistForm.register('email')}
                />
                <TextField
                  label={copy.auth.password}
                  type="password"
                  error={Boolean(artistForm.formState.errors.password)}
                  helperText={artistForm.formState.errors.password?.message}
                  {...artistForm.register('password')}
                />
                <TextField
                  label={
                    language === 'fa' ? 'تکرار رمز عبور' : 'Confirm Password'
                  }
                  type="password"
                  error={Boolean(
                    artistForm.formState.errors.password_confirmation
                  )}
                  helperText={
                    artistForm.formState.errors.password_confirmation?.message
                  }
                  {...artistForm.register('password_confirmation')}
                />
                <TextField
                  label={language === 'fa' ? 'نام هنری' : 'Artistic/Stage Name'}
                  error={Boolean(artistForm.formState.errors.stage_name)}
                  helperText={artistForm.formState.errors.stage_name?.message}
                  {...artistForm.register('stage_name')}
                />
                <TextField
                  label={
                    language === 'fa' ? 'لینک‌های نمونه‌کار' : 'Portfolio Links'
                  }
                  multiline
                  minRows={3}
                  helperText={
                    language === 'fa'
                      ? 'هر لینک در یک خط یا با ویرگول جدا شود.'
                      : 'Paste one link per line or separate with commas.'
                  }
                  error={Boolean(artistForm.formState.errors.portfolio_links)}
                  {...artistForm.register('portfolio_links')}
                />
                <Button type="submit" variant="contained">
                  {copy.auth.register}
                </Button>
              </Stack>
            )}

            <Link component={RouterLink} to="/login">
              {copy.auth.backToLogin}
            </Link>
          </Stack>
        </CardContent>
      </Card>

      <Dialog
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {language === 'fa' ? 'سیاست حریم خصوصی' : 'Privacy Policy'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Welcome! Your privacy is important to us. This Privacy Policy
            explains how we collect, use, and protect your data.
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
