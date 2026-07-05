import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Box,
  Button,
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
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { ROUTES } from '../../lib/constants/routes'
import {
  approveRequest,
  getRequest,
  rejectRequest,
} from '../../lib/mock/verificationService'

const rejectSchema = z.object({
  reason: z.string().trim().min(1, 'Rejection reason is required.'),
})

type RejectFormValues = z.infer<typeof rejectSchema>

export default function VerificationDetailPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const parsedId = Number(requestId)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)

  const request = Number.isFinite(parsedId) ? getRequest(parsedId) : null

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: '' },
  })

  if (!request) {
    return (
      <Box>
        <Alert severity="error">Verification request not found.</Alert>
        <Button
          className="mt-4"
          component={RouterLink}
          to={`${ROUTES.ADMIN_TICKETS}?tab=verification`}
        >
          Back to requests
        </Button>
      </Box>
    )
  }

  const isPending = request.verification_status === 'pending'
  const currentRequest = request

  function handleApprove(): void {
    setError('')
    setSuccess('')
    try {
      approveRequest(currentRequest.id)
      setSuccess('Artist approved successfully. A notification has been sent.')
      setConfirmOpen(false)
      setTimeout(() => {
        navigate(`${ROUTES.ADMIN_TICKETS}?tab=verification`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve request.')
      setConfirmOpen(false)
    }
  }

  function onReject(values: RejectFormValues): void {
    setError('')
    setSuccess('')
    try {
      rejectRequest(currentRequest.id, values.reason)
      setSuccess('Artist request rejected. A notification has been sent.')
      setRejectOpen(false)
      reset()
      setTimeout(() => {
        navigate(`${ROUTES.ADMIN_TICKETS}?tab=verification`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request.')
    }
  }

  return (
    <Box>
      <Button
        className="mb-4"
        component={RouterLink}
        to={`${ROUTES.ADMIN_TICKETS}?tab=verification`}
        variant="outlined"
      >
        Back
      </Button>

      <Typography className="mb-4" component="h1" variant="h4" sx={{ fontWeight: 700 }}>
        Artist Approval Request
      </Typography>

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
          <Typography variant="h6">Stage name: {request.stage_name}</Typography>
          <Typography color="text.secondary">Email: {request.email}</Typography>
          <Typography color="text.secondary">
            Status: {request.verification_status}
          </Typography>
          {request.rejection_reason ? (
            <Typography color="error">Rejection reason: {request.rejection_reason}</Typography>
          ) : null}

          <Typography sx={{ fontWeight: 600 }}>Portfolio / samples</Typography>
          <Stack spacing={1}>
            {request.portfolio_links.map((link) => (
              <Link key={link} href={link} rel="noopener noreferrer" target="_blank">
                {link}
              </Link>
            ))}
          </Stack>
        </Stack>
      </Paper>

      {isPending ? (
        <Stack direction="row" spacing={2}>
          <Button color="success" variant="contained" onClick={() => setConfirmOpen(true)}>
            Approve
          </Button>
          <Button color="error" variant="outlined" onClick={() => setRejectOpen(true)}>
            Reject
          </Button>
        </Stack>
      ) : (
        <Alert severity="info">This request has already been processed.</Alert>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Approve artist?</DialogTitle>
        <DialogContent>
          <Typography>
            Approve {request.stage_name}? They will be able to log in and access Artist Studio.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="success" variant="contained" onClick={handleApprove}>
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog fullWidth maxWidth="sm" open={rejectOpen} onClose={() => setRejectOpen(false)}>
        <DialogTitle>Reject artist request</DialogTitle>
        <form onSubmit={handleSubmit(onReject)}>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              error={Boolean(errors.reason)}
              helperText={errors.reason?.message}
              label="Rejection reason"
              minRows={3}
              {...register('reason')}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button color="error" disabled={isSubmitting} type="submit" variant="contained">
              Reject
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}
