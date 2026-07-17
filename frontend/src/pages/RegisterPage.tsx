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
import { registerArtist, registerListener } from '../lib/api/authService';
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

const listenerPolicySections = [
  {
    sections: [
      {
        heading: '1. Acceptance of Terms',
        body: 'By registering, accessing, or using [App Name] as a listener, you agree to abide by these Terms of Service. If you do not agree to these terms, you may not use the service.',
      },
      {
        heading: '2. Permitted Use and Restrictions',
        bullets: [
          {
            label: 'Personal Use Only',
            text: 'The music, podcasts, and other content provided on [App Name] are for your personal, non-commercial use only. You may not broadcast or play the content in a public commercial setting without a separate commercial license.',
          },
          {
            label: 'No Unauthorized Distribution',
            text: 'You may not copy, rip, download (other than through the official offline listening feature for Premium users), share, or distribute the audio files outside of the application.',
          },
          {
            label: 'Platform Integrity',
            text: 'You agree not to use automated scripts, bots, or scrapers to access the service, artificially inflate play counts, or extract metadata.',
          },
        ],
      },
      {
        heading: '3. Subscriptions and Payments (If Applicable)',
        bullets: [
          {
            label: 'Free vs. Premium',
            text: '[App Name] may offer a free, ad-supported tier and a premium, ad-free subscription.',
          },
          {
            label: 'Billing',
            text: 'If you subscribe to a Premium tier, you authorize us to charge your selected payment method on a recurring billing cycle. You may cancel your subscription at any time, and the cancellation will take effect at the end of your current billing cycle. No refunds are provided for partial subscription periods.',
          },
        ],
      },
      {
        heading: '4. User-Generated Content',
        body: 'If you create public playlists, upload profile pictures, or leave comments, you agree not to post content that is offensive, defamatory, or infringes on the intellectual property of others. We reserve the right to remove such content and suspend your account.',
      },
      {
        heading: '5. Account Termination',
        body: '[App Name] reserves the right to suspend or terminate your account at any time if you violate these Terms of Service or engage in fraudulent activity.',
      },
    ],
  },
  {
    title: 'Listener Privacy Policy',
    sections: [
      {
        heading: '1. Information We Collect',
        body: 'To provide and improve your listening experience, we collect the following data:',
        bullets: [
          {
            label: 'Registration Data',
            text: 'Username, email address, date of birth, and password.',
          },
          {
            label: 'Usage and Interaction Data',
            text: 'Your listening history, skipped tracks, liked songs, created playlists, and search queries.',
          },
          {
            label: 'Device and Technical Data',
            text: 'IP address, device type, operating system, and app version.',
          },
          {
            label: 'Payment Information',
            text: 'If you are a Premium user, we collect payment details (processed securely by third-party payment gateways).',
          },
        ],
      },
      {
        heading: '2. How We Use Your Information',
        bullets: [
          {
            label: 'Service Delivery',
            text: 'To stream music, maintain your account, and provide offline listening features.',
          },
          {
            label: 'Personalization',
            text: 'To analyze your listening habits and provide tailored recommendations, personalized playlists (e.g., "Discover Weekly"), and concert suggestions.',
          },
          {
            label: 'Advertising (Free Tier)',
            text: 'To deliver relevant advertisements to users on the free, ad-supported tier.',
          },
          {
            label: 'Artist Analytics',
            text: 'To provide artists with aggregated, anonymous data about their audience (e.g., "5,000 listeners in London"). Your individual identity is never shared with artists.',
          },
        ],
      },
      {
        heading: '3. Data Sharing with Third Parties',
        body: 'We do not sell your personal data. We may share information with:',
        bullets: [
          {
            label: 'Service Providers',
            text: 'Cloud hosting, customer support tools, and secure payment processors.',
          },
          {
            label: 'Advertising Partners',
            text: 'For free-tier users, non-identifiable data may be shared with ad networks to serve relevant ads.',
          },
          {
            label: 'Legal Compliance',
            text: 'If required by law, court order, or governmental request.',
          },
        ],
      },
      {
        heading: '4. Data Security',
        body: 'We use industry-standard encryption and security measures to protect your personal data and account credentials from unauthorized access, alteration, or disclosure.',
      },
      {
        heading: '5. Your Privacy Rights',
        bullets: [
          {
            label: 'Access and Portability',
            text: 'You can request a copy of the personal data and listening history we hold about you.',
          },
          {
            label: 'Deletion',
            text: 'You can request the permanent deletion of your account and personal data through the app settings. Once deleted, this action cannot be undone, and your playlists and history will be lost.',
          },
        ],
      },
    ],
  },
];

const artistPolicySections = [
  {
    sections: [
      {
        heading: '1. Acceptance of Terms',
        body: 'By registering as an "Artist" on [App Name], you agree to be bound by these Terms of Service. Only individuals who hold the legal rights and copyright to the works, or are the legal representatives of the copyright owners, are permitted to create an Artist account.',
      },
      {
        heading: '2. Content Ownership and Licensing',
        bullets: [
          {
            label: 'Your Ownership',
            text: 'You retain all intellectual property rights to your music, cover art, and metadata. [App Name] claims no ownership over your work.',
          },
          {
            label: 'License to Us',
            text: 'By uploading your work, you grant [App Name] a non-exclusive, worldwide, royalty-free license to stream, distribute, publicly perform, and use your music for internal platform marketing purposes.',
          },
        ],
      },
      {
        heading: '3. Payments and Royalties',
        bullets: [
          { text: 'We commit to paying royalties based on the number of valid streams of your work.' },
          {
            text: "The exact rate per stream and its calculation method can be viewed in the Artist Dashboard and may vary based on the listener's geographic region.",
          },
          {
            text: 'Payments are processed on a [e.g., monthly/quarterly] basis and deposited into your designated bank account or wallet once your balance reaches the minimum threshold of [Minimum Payout Amount].',
          },
        ],
      },
      {
        heading: '4. Prohibited Content and Copyright Infringement',
        bullets: [
          {
            text: 'Uploading any content that violates third-party rights (unauthorized use of copyrighted material), contains hate speech, or incites violence is strictly prohibited.',
          },
          {
            text: "Upon receiving a valid copyright infringement report (DMCA Takedown), [App Name] reserves the right to remove the content immediately and suspend the Artist's account in cases of repeat infringement.",
          },
        ],
      },
      {
        heading: '5. Artificial Streaming',
        body: 'The use of bots, click-farms, or any other unauthorized methods to artificially inflate streaming numbers is strictly prohibited. If detected, all associated earnings will be forfeited, and the account will be permanently banned.',
      },
    ],
  },
  {
    title: 'Artist Privacy Policy',
    sections: [
      {
        heading: '1. Information We Collect',
        body: 'To provide our services to you as an Artist, we collect the following information:',
        bullets: [
          {
            label: 'Identity and Contact Data',
            text: 'Full name, stage name, email address, phone number, and physical address.',
          },
          {
            label: 'Financial Data',
            text: 'Bank account numbers, tax information, and payment gateway details for royalty payouts.',
          },
          {
            label: 'Analytical Data',
            text: 'Information regarding user interaction with your profile, stream counts, and the geographic location of your listeners (in aggregated form).',
          },
        ],
      },
      {
        heading: '2. How We Use Your Information',
        body: 'We use your data for the following purposes:',
        bullets: [
          { text: 'Creating and managing your Artist profile.' },
          { text: 'Accurately calculating earnings and processing financial payouts.' },
          {
            text: 'Providing analytical tools in your dashboard to help you understand your audience.',
          },
          {
            text: 'Communicating with you regarding platform updates, technical issues, or copyright claims.',
          },
        ],
      },
      {
        heading: '3. Data Sharing with Third Parties',
        body: 'We do not sell your personal or financial information. However, we may share your data with the following parties:',
        bullets: [
          {
            label: 'Payment Service Providers',
            text: 'To process royalty payouts and settlements.',
          },
          {
            label: 'Legal and Tax Authorities',
            text: 'If required by law to submit tax reports or respond to legal subpoenas.',
          },
        ],
      },
      {
        heading: '4. Data Security',
        body: 'We utilize industry-standard security protocols (such as data encryption and secure connections) to protect your sensitive and financial information. However, you are solely responsible for maintaining the confidentiality of your password and account access.',
      },
      {
        heading: '5. Your Rights (Edit and Deletion)',
        body: 'You can edit your personal information at any time through your dashboard. If you wish to leave the platform, you may submit a request to permanently delete your account and all associated works (the content removal process may take up to 30 business days).',
      },
    ],
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [tab, setTab] = useState<RegisterTab>('listener');
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [artistPrivacyAccepted, setArtistPrivacyAccepted] = useState(false);
  const [artistPrivacyError, setArtistPrivacyError] = useState('');
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
      gender: 'male',
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

  async function submitListener(values: ListenerRegistrationFormValues): Promise<void> {
    setFormError('');
    try {
      const user = await registerListener(values);
      setUser(user);
      navigate('/');
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Registration failed.'
      );
    }
  }

  async function submitArtist(values: ArtistRegistrationFormValues): Promise<void> {
    setFormError('');
    setArtistMessage('');
    setArtistPrivacyError('');
    if (!artistPrivacyAccepted) {
      setArtistPrivacyError('You must accept the terms and privacy policy.');
      return;
    }
    try {
      const result = await registerArtist({
        email: values.email,
        password: values.password,
        password_confirmation: values.password_confirmation,
        stage_name: values.stage_name,
        portfolio_links: parsePortfolioLinks(values.portfolio_links),
      });
      artistForm.reset();
      setArtistPrivacyAccepted(false);
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
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {language === 'fa'
                  ? 'به‌عنوان شنونده ثبت‌نام کنید یا دسترسی هنرمند را درخواست دهید.'
                  : 'Register as a listener or request artist access.'}
              </Typography>
            </Box>

            <Tabs
              allowScrollButtonsMobile
              scrollButtons="auto"
              value={tab}
              variant="scrollable"
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
                            checked={Boolean(field.value)}
                            name={field.name}
                            value="true"
                            onBlur={field.onBlur}
                            onChange={(_, checked) =>
                              listenerForm.setValue(
                                'privacy_policy_accepted',
                                checked,
                                { shouldDirty: true, shouldValidate: true },
                              )
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
                <FormControl error={Boolean(artistPrivacyError)}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={artistPrivacyAccepted}
                        onChange={(_, checked) => {
                          setArtistPrivacyAccepted(checked);
                          setArtistPrivacyError('');
                        }}
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
                  <FormHelperText>{artistPrivacyError}</FormHelperText>
                </FormControl>
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
          {language === 'fa'
            ? 'شرایط و سیاست حریم خصوصی'
            : tab === 'artist'
              ? 'Artist Terms and Privacy Policy'
              : 'Listener Terms and Privacy Policy'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            {(tab === 'artist' ? artistPolicySections : listenerPolicySections).map(
              (policySection) => (
                <Stack key={policySection.title} spacing={2}>
                  <Typography
                    component="h2"
                    variant="h6"
                    sx={{ fontWeight: 700 }}
                  >
                    {policySection.title}
                  </Typography>
                  {policySection.sections.map((section) => (
                    <Box key={section.heading}>
                      <Typography
                        component="h3"
                        variant="subtitle1"
                        sx={{ fontWeight: 700 }}
                      >
                        {section.heading}
                      </Typography>
                      {'body' in section && section.body ? (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {section.body}
                        </Typography>
                      ) : null}
                      {'bullets' in section && section.bullets ? (
                        <Box component="ul" sx={{ pl: 3, mt: 1, mb: 0 }}>
                          {section.bullets.map((bullet) => (
                            <Typography
                              key={`${'label' in bullet ? bullet.label : ''}${bullet.text}`}
                              component="li"
                              variant="body2"
                              sx={{ mb: 0.75 }}
                            >
                              {'label' in bullet && bullet.label ? (
                                <>
                                  <Box component="strong">{bullet.label}:</Box>{' '}
                                </>
                              ) : null}
                              {bullet.text}
                            </Typography>
                          ))}
                        </Box>
                      ) : null}
                    </Box>
                  ))}
                </Stack>
              ),
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
