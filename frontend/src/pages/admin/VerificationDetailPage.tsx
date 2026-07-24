import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import PageHeader from '../../components/common/PageHeader'
import { getAdminPageText } from '../../lib/constants/adminPageText'
import { ROUTES } from '../../lib/constants/routes'
import {
  approveRequest,
  getRequest,
  rejectRequest,
} from '../../lib/api/managementService'
import { useAppLanguage } from '../../theme/LanguageContext'
import type { ArtistVerificationRequest } from '../../types/artist'

type RejectFormValues = {
  reason: string
}

export default function VerificationDetailPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const { language } = useAppLanguage()
  const copy = getAdminPageText(language)
  const isRtl = language === 'fa'
  const parsedId = Number(requestId)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [request, setRequest] = useState<ArtistVerificationRequest | null>(null)
  const [loading, setLoading] = useState(true)

  const rejectSchema = useMemo(
    () =>
      z.object({
        reason: z.string().trim().min(1, copy.verification.rejectReasonRequired),
      }),
    [copy.verification.rejectReasonRequired],
  )

  useEffect(() => {
    let cancelled = false
    if (!Number.isFinite(parsedId)) {
      setLoading(false)
      return
    }
    setLoading(true)
    getRequest(parsedId)
      .then((result) => {
        if (!cancelled) {
          setRequest(result)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [parsedId])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: '' },
  })

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!request) {
    return (
      <Box dir={isRtl ? 'rtl' : 'ltr'}>
        <Alert severity="error">{copy.verification.notFound}</Alert>
        <Button
          className="mt-4"
          component={RouterLink}
          to={`${ROUTES.ADMIN_TICKETS}?tab=verification`}
        >
          {copy.verification.backToRequests}
        </Button>
      </Box>
    )
  }

  const isPending = request.verification_status === 'pending'
  const currentRequest = request
  const statusLabel = copy.verification.statusLabels[request.verification_status]

  async function handleApprove(): Promise<void> {
    setError('')
    setSuccess('')
    try {
      await approveRequest(currentRequest.id)
      setSuccess(copy.verification.approvedSuccess)
      setConfirmOpen(false)
      setTimeout(() => {
        navigate(`${ROUTES.ADMIN_TICKETS}?tab=verification`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.verification.failedApprove)
      setConfirmOpen(false)
    }
  }

  async function onReject(values: RejectFormValues): Promise<void> {
    setError('')
    setSuccess('')
    try {
      await rejectRequest(currentRequest.id, values.reason)
      setSuccess(copy.verification.rejectedSuccess)
      setRejectOpen(false)
      reset()
      setTimeout(() => {
        navigate(`${ROUTES.ADMIN_TICKETS}?tab=verification`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.verification.failedReject)
    }
  }

  return (
    <Box dir={isRtl ? 'rtl' : 'ltr'}>
      <Button
        className="mb-4"
        component={RouterLink}
        to={`${ROUTES.ADMIN_TICKETS}?tab=verification`}
        variant="outlined"
      >
        {copy.verification.back}
      </Button>

      <PageHeader className="mb-4">{copy.verification.title}</PageHeader>

      {error ? (
        <Alert className="mb-4" severity="error">
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert className="mb-4" severity="success">
          {success}
        </Alert>
      ) : null}

      <Paper className="mb-6 p-6">
        <Stack spacing={2}>
          <Typography variant="h6">{copy.verification.stageName(request.stage_name)}</Typography>
          <Typography color="text.secondary">{copy.verification.email(request.email)}</Typography>
          <Typography color="text.secondary">
            {copy.verification.status(statusLabel)}
          </Typography>
          {request.rejection_reason ? (
            <Typography color="error">
              {copy.verification.rejectionReason(request.rejection_reason)}
            </Typography>
          ) : null}

          <Typography sx={{ fontWeight: 600 }}>{copy.verification.portfolio}</Typography>
          <Stack spacing={1}>
            {request.portfolio_links.map((link) => (
              <Link
                key={link}
                href={link}
                rel="noopener noreferrer"
                sx={{ wordBreak: 'break-all' }}
                target="_blank"
              >
                {link}
              </Link>
            ))}
          </Stack>
        </Stack>
      </Paper>

      {isPending ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            color="success"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
            variant="contained"
            onClick={() => setConfirmOpen(true)}
          >
            {copy.verification.approve}
          </Button>
          <Button
            color="error"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
            variant="outlined"
            onClick={() => setRejectOpen(true)}
          >
            {copy.verification.reject}
          </Button>
        </Stack>
      ) : (
        <Alert severity="info">{copy.verification.alreadyProcessed}</Alert>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{copy.verification.confirmTitle}</DialogTitle>
        <DialogContent>
          <Typography>{copy.verification.confirmBody(request.stage_name)}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{copy.verification.cancel}</Button>
          <Button color="success" variant="contained" onClick={handleApprove}>
            {copy.verification.approve}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog fullWidth maxWidth="sm" open={rejectOpen} onClose={() => setRejectOpen(false)}>
        <DialogTitle>{copy.verification.rejectTitle}</DialogTitle>
        <form onSubmit={handleSubmit(onReject)}>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              error={Boolean(errors.reason)}
              helperText={errors.reason?.message}
              label={copy.verification.rejectReasonLabel}
              minRows={3}
              {...register('reason')}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectOpen(false)}>{copy.verification.cancel}</Button>
            <Button color="error" disabled={isSubmitting} type="submit" variant="contained">
              {copy.verification.reject}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}
