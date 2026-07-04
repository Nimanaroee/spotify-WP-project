/**
 * RegisterPage — listener and artist registration
 * Spec reference: §2.1
 */
import { zodResolver } from '@hookform/resolvers/zod'
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
} from '@mui/material'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { registerArtist, registerListener } from '../lib/mock/authService'
import { useAuthStore } from '../store/authStore'
import {
  artistRegistrationSchema,
  listenerRegistrationSchema,
  parsePortfolioLinks,
  type ArtistRegistrationFormValues,
  type ListenerRegistrationFormValues,
} from './authSchemas'

type RegisterTab = 'listener' | 'artist'

export default function RegisterPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const [tab, setTab] = useState<RegisterTab>('listener')
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [artistMessage, setArtistMessage] = useState('')

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
  })

  const artistForm = useForm<ArtistRegistrationFormValues>({
    resolver: zodResolver(artistRegistrationSchema),
    defaultValues: {
      email: '',
      password: '',
      password_confirmation: '',
      stage_name: '',
      portfolio_links: '',
    },
  })

  function submitListener(values: ListenerRegistrationFormValues): void {
    setFormError('')
    try {
      const user = registerListener(values)
      setUser(user)
      navigate('/')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Registration failed.')
    }
  }

  function submitArtist(values: ArtistRegistrationFormValues): void {
    setFormError('')
    setArtistMessage('')
    try {
      const result = registerArtist({
        email: values.email,
        password: values.password,
        password_confirmation: values.password_confirmation,
        stage_name: values.stage_name,
        portfolio_links: parsePortfolioLinks(values.portfolio_links),
      })
      artistForm.reset()
      setArtistMessage(result.message)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Registration failed.')
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
                Create account
              </Typography>
              <Typography color="text.secondary">
                Register as a listener or request artist access.
              </Typography>
            </Box>

            <Tabs value={tab} onChange={(_, value: RegisterTab) => setTab(value)}>
              <Tab label="Regular user" value="listener" />
              <Tab label="Artist" value="artist" />
            </Tabs>

            {formError ? <Alert severity="error">{formError}</Alert> : null}
            {artistMessage ? <Alert severity="info">{artistMessage}</Alert> : null}

            {tab === 'listener' ? (
              <Stack
                component="form"
                spacing={2}
                onSubmit={listenerForm.handleSubmit(submitListener)}
              >
                <TextField
                  label="Display Name"
                  error={Boolean(listenerForm.formState.errors.display_name)}
                  helperText={listenerForm.formState.errors.display_name?.message}
                  {...listenerForm.register('display_name')}
                />
                <TextField
                  label="Email"
                  type="email"
                  error={Boolean(listenerForm.formState.errors.email)}
                  helperText={listenerForm.formState.errors.email?.message}
                  {...listenerForm.register('email')}
                />
                <TextField
                  label="Password"
                  type="password"
                  error={Boolean(listenerForm.formState.errors.password)}
                  helperText={listenerForm.formState.errors.password?.message}
                  {...listenerForm.register('password')}
                />
                <TextField
                  label="Confirm Password"
                  type="password"
                  error={Boolean(listenerForm.formState.errors.password_confirmation)}
                  helperText={
                    listenerForm.formState.errors.password_confirmation?.message
                  }
                  {...listenerForm.register('password_confirmation')}
                />
                <TextField
                  label="Date of Birth"
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
                    <FormControl error={Boolean(listenerForm.formState.errors.gender)}>
                      <InputLabel id="gender-label">Gender</InputLabel>
                      <Select
                        labelId="gender-label"
                        label="Gender"
                        name={field.name}
                        value={field.value}
                        onBlur={field.onBlur}
                        inputRef={field.ref}
                        onChange={(event) => field.onChange(event.target.value)}
                      >
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                        <MenuItem value="prefer_not_to_say">
                          Prefer not to say
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
                        listenerForm.formState.errors.privacy_policy_accepted,
                      )}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={field.value}
                            onBlur={field.onBlur}
                            slotProps={{ input: { ref: field.ref } }}
                            onChange={(event) => field.onChange(event.target.checked)}
                          />
                        }
                        label={
                          <span>
                            I agree to the Terms and{' '}
                            <Button
                              type="button"
                              variant="text"
                              onClick={() => setPrivacyOpen(true)}
                            >
                              Privacy Policy
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
                  Register
                </Button>
              </Stack>
            ) : (
              <Stack
                component="form"
                spacing={2}
                onSubmit={artistForm.handleSubmit(submitArtist)}
              >
                <TextField
                  label="Email"
                  type="email"
                  error={Boolean(artistForm.formState.errors.email)}
                  helperText={artistForm.formState.errors.email?.message}
                  {...artistForm.register('email')}
                />
                <TextField
                  label="Password"
                  type="password"
                  error={Boolean(artistForm.formState.errors.password)}
                  helperText={artistForm.formState.errors.password?.message}
                  {...artistForm.register('password')}
                />
                <TextField
                  label="Confirm Password"
                  type="password"
                  error={Boolean(artistForm.formState.errors.password_confirmation)}
                  helperText={artistForm.formState.errors.password_confirmation?.message}
                  {...artistForm.register('password_confirmation')}
                />
                <TextField
                  label="Artistic/Stage Name"
                  error={Boolean(artistForm.formState.errors.stage_name)}
                  helperText={artistForm.formState.errors.stage_name?.message}
                  {...artistForm.register('stage_name')}
                />
                <TextField
                  label="Portfolio/Work Samples"
                  multiline
                  minRows={3}
                  placeholder="Paste URLs separated by commas or new lines"
                  error={Boolean(artistForm.formState.errors.portfolio_links)}
                  helperText={artistForm.formState.errors.portfolio_links?.message}
                  {...artistForm.register('portfolio_links')}
                />
                <Button type="submit" variant="contained">
                  Request artist approval
                </Button>
              </Stack>
            )}

            <Link component={RouterLink} to="/login">
              Already have an account?
            </Link>
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={privacyOpen} onClose={() => setPrivacyOpen(false)}>
        <DialogTitle>Privacy Policy</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography>
              Welcome ! Your privacy is important to us. This Privacy Policy explains
              how we collect, use, share, and protect your personal information when
              you use our website, mobile applications, and audio streaming services .
            </Typography>

            <Typography variant="h6" component="h3">
              1. Information We Collect
            </Typography>
            <Typography>
              We collect information to provide, personalize, and improve your
              listening experience.
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>
              A. Information You Provide to Us:
            </Typography>
            <Box component="ul" sx={{ pl: 3, my: 0 }}>
              <li>
                <Typography>
                  <strong>Account Registration:</strong> When you sign up as a User or
                  an Artist, we collect your display name, email address, password, date
                  of birth, and gender.
                </Typography>
              </li>
              <li>
                <Typography>
                  <strong>Artist Profiles:</strong> If you register as an Artist, we
                  may collect additional information such as your portfolio, biography,
                  profile images, and social media links.
                </Typography>
              </li>
              <li>
                <Typography>
                  <strong>User Content:</strong> Playlists you create, comments, likes,
                  and interactions with other users or artists.
                </Typography>
              </li>
              <li>
                <Typography>
                  <strong>Communications:</strong> Messages you send to us for support
                  or inquiries.
                </Typography>
              </li>
            </Box>

            <Typography sx={{ fontWeight: 700 }}>
              B. Information We Collect Automatically:
            </Typography>
            <Box component="ul" sx={{ pl: 3, my: 0 }}>
              <li>
                <Typography>
                  <strong>Usage Data:</strong> Details about your listening history,
                  skipped tracks, preferred genres, search queries, and time spent on
                  the Service.
                </Typography>
              </li>
              <li>
                <Typography>
                  <strong>Device Information:</strong> Your IP address, device type,
                  operating system, browser type, and app version.
                </Typography>
              </li>
              <li>
                <Typography>
                  <strong>Location Data:</strong> General location data based on your
                  IP address to ensure regional content licensing compliance and offer
                  localized recommendations.
                </Typography>
              </li>
            </Box>

            <Typography variant="h6" component="h3">
              2. How We Use Your Information
            </Typography>
            <Typography>We use the collected information for the following purposes:</Typography>
            <Box component="ul" sx={{ pl: 3, my: 0 }}>
              <li>
                <Typography>
                  <strong>To Provide the Service:</strong> Delivering audio streams,
                  managing your account, and maintaining platform functionality.
                </Typography>
              </li>
              <li>
                <Typography>
                  <strong>Personalization:</strong> Recommending songs, artists, and
                  playlists based on your listening habits and preferences.
                </Typography>
              </li>
              <li>
                <Typography>
                  <strong>Analytics and Improvement:</strong> Understanding how users
                  interact with our platform to fix bugs, develop new features, and
                  improve audio quality.
                </Typography>
              </li>
              <li>
                <Typography>
                  <strong>Artist Compensation:</strong> Tracking stream counts and
                  listenership to accurately report and pay artists and rights holders.
                </Typography>
              </li>
              <li>
                <Typography>
                  <strong>Communication:</strong> Sending you updates, security alerts,
                  and promotional messages which you can opt out of at any time.
                </Typography>
              </li>
            </Box>

            <Typography variant="h6" component="h3">
              3. How We Share Your Information
            </Typography>
            <Typography>
              We do not sell your personal data. We only share your information in the
              following circumstances:
            </Typography>
            <Box component="ul" sx={{ pl: 3, my: 0 }}>
              <li>
                <Typography>
                  <strong>With Rights Holders and Artists:</strong> We share aggregated,
                  non-personally identifiable data with artists and record labels for
                  royalty and analytics purposes.
                </Typography>
              </li>
              <li>
                <Typography>
                  <strong>With Service Providers:</strong> Third-party vendors that help
                  us with hosting, data analysis, payment processing, and customer
                  support.
                </Typography>
              </li>
              <li>
                <Typography>
                  <strong>Publicly:</strong> Information you choose to make public, such
                  as your public playlists, followers, and display name.
                </Typography>
              </li>
              <li>
                <Typography>
                  <strong>For Legal Reasons:</strong> If required by law, subpoena, or
                  other legal processes, or to protect the rights, property, or safety of
                  our platform, our users, or others.
                </Typography>
              </li>
            </Box>

            <Typography variant="h6" component="h3">
              4. Your Rights and Choices
            </Typography>
            <Typography>Depending on your region, you may have the right to:</Typography>
            <Box component="ul" sx={{ pl: 3, my: 0 }}>
              <li>
                <Typography>
                  <strong>Access:</strong> Request a copy of the personal data we hold
                  about you.
                </Typography>
              </li>
              <li>
                <Typography>
                  <strong>Correction:</strong> Edit or update inaccurate information in
                  your account settings.
                </Typography>
              </li>
              <li>
                <Typography>
                  <strong>Deletion:</strong> Request that we delete your account and
                  associated personal data.
                </Typography>
              </li>
              <li>
                <Typography>
                  <strong>Opt-Out:</strong> Unsubscribe from promotional emails and
                  disable certain tracking features via your device or browser settings.
                </Typography>
              </li>
            </Box>

            <Typography variant="h6" component="h3">
              5. Data Security
            </Typography>
            <Typography>
              We implement industry-standard security measures, including encryption
              and secure server hosting, to protect your personal information from
              unauthorized access, alteration, disclosure, or destruction. However, no
              method of transmission over the internet is 100% secure.
            </Typography>

            <Typography variant="h6" component="h3">
              6. Children&apos;s Privacy
            </Typography>
            <Typography>
              Our Service is not directed to children under the age of 13 or the
              applicable legal age in your region. We do not knowingly collect personal
              information from children without verified parental consent.
            </Typography>

            <Typography variant="h6" component="h3">
              7. Changes to This Policy
            </Typography>
            <Typography>
              We may update this Privacy Policy from time to time to reflect changes in
              our practices or for legal reasons. We will notify you of any material
              changes by posting the new policy on this page and updating the Effective
              Date.
            </Typography>

            <Typography variant="h6" component="h3">
              8. Contact Us
            </Typography>
            <Typography>
              If you have any questions, concerns, or requests regarding this Privacy
              Policy, please contact us at:
            </Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  )
}
