import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import {
  formatAdminDateTime,
  getAdminPageText,
} from '../../lib/constants/adminPageText'
import { ROUTES } from '../../lib/constants/routes'
import { closeTicket, getTicket, replyToTicket } from '../../lib/api/managementService'
import { useAppLanguage } from '../../theme/LanguageContext'
import type { SupportTicket } from '../../types/support'

export default function TicketDetailPage() {
  const { ticketId } = useParams()
  const { language } = useAppLanguage()
  const copy = getAdminPageText(language)
  const isRtl = language === 'fa'
  const parsedId = Number(ticketId)
  const [reply, setReply] = useState('')
  const [error, setError] = useState('')
  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!Number.isFinite(parsedId)) {
      setLoading(false)
      return
    }
    setLoading(true)
    getTicket(parsedId)
      .then((result) => {
        if (!cancelled) {
          setTicket(result)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : copy.ticketDetail.notFound)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedId])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!ticket) {
    return (
      <Box dir={isRtl ? 'rtl' : 'ltr'}>
        <Alert severity="error">{copy.ticketDetail.notFound}</Alert>
        <Button className="mt-4" component={RouterLink} to={ROUTES.ADMIN_TICKETS}>
          {copy.ticketDetail.backToTickets}
        </Button>
      </Box>
    )
  }

  const messages = ticket.messages ?? []
  const isClosed = ticket.status === 'closed'
  const currentTicket = ticket
  const submittedAt = formatAdminDateTime(ticket.created_at, language)

  async function handleSendReply(): Promise<void> {
    setError('')
    try {
      const updated = await replyToTicket(currentTicket.id, { message: reply })
      setReply('')
      setTicket(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.ticketDetail.failedSendReply)
    }
  }

  async function handleClose(): Promise<void> {
    setError('')
    try {
      const updated = await closeTicket(currentTicket.id)
      setTicket(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.ticketDetail.failedCloseTicket)
    }
  }

  return (
    <Box dir={isRtl ? 'rtl' : 'ltr'}>
      <Stack
        className="mb-4"
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
      >
        <Button component={RouterLink} to={ROUTES.ADMIN_TICKETS} variant="outlined">
          {copy.ticketDetail.back}
        </Button>
        <PageHeader
          className="flex-1"
          sx={{ wordBreak: 'break-word', typography: { xs: 'h6', sm: 'h5' } }}
        >
          {copy.ticketDetail.ticketHeading(ticket.id, ticket.subject)}
        </PageHeader>
        <Chip label={copy.tickets.statusLabels[ticket.status]} size="small" sx={{ alignSelf: { sm: 'center' } }} />
      </Stack>

      <Typography className="mb-4" color="text.secondary" variant="body2">
        {copy.ticketDetail.submittedBy(ticket.user_name, submittedAt)}
      </Typography>

      <Paper className="mb-4 max-h-96 overflow-y-auto p-4" sx={{ bgcolor: 'background.paper' }}>
        <Stack spacing={2}>
          {messages.map((msg) => {
            const isStaff = msg.sender_id !== ticket.user_id
            return (
              <Box
                key={msg.id}
                className="max-w-[80%] rounded-lg p-3"
                sx={{
                  alignSelf: isStaff ? 'flex-end' : 'flex-start',
                  bgcolor: isStaff ? 'primary.main' : 'action.hover',
                  color: isStaff ? 'primary.contrastText' : 'text.primary',
                }}
              >
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {msg.sender_name} · {formatAdminDateTime(msg.created_at, language)}
                </Typography>
                <Typography variant="body1">{msg.message}</Typography>
              </Box>
            )
          })}
        </Stack>
      </Paper>

      {error ? (
        <Alert className="mb-4" severity="error">
          {error}
        </Alert>
      ) : null}

      {!isClosed ? (
        <Stack spacing={2}>
          <TextField
            fullWidth
            multiline
            label={copy.ticketDetail.yourReply}
            minRows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button fullWidth={false} sx={{ width: { xs: '100%', sm: 'auto' } }} variant="contained" onClick={handleSendReply}>
              {copy.ticketDetail.sendReply}
            </Button>
            <Button
              color="inherit"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
              variant="outlined"
              onClick={handleClose}
            >
              {copy.ticketDetail.closeTicket}
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Alert severity="info">{copy.ticketDetail.ticketClosed}</Alert>
      )}
    </Box>
  )
}
