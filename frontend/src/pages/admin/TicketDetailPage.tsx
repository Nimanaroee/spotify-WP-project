import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import {
  formatAdminDateTime,
  getAdminPageText,
} from '../../lib/constants/adminPageText'
import { ROUTES } from '../../lib/constants/routes'
import { closeTicket, getTicket, replyToTicket } from '../../lib/mock/ticketService'
import { useAuthStore } from '../../store/authStore'
import { useAppLanguage } from '../../theme/LanguageContext'
import type { SupportTicket } from '../../types/support'

export default function TicketDetailPage() {
  const { ticketId } = useParams()
  const user = useAuthStore((state) => state.user)
  const { language } = useAppLanguage()
  const copy = getAdminPageText(language)
  const isRtl = language === 'fa'
  const parsedId = Number(ticketId)
  const [reply, setReply] = useState('')
  const [error, setError] = useState('')
  const [ticketOverride, setTicketOverride] = useState<SupportTicket | null>(null)

  const ticket = useMemo(() => {
    if (ticketOverride) {
      return ticketOverride
    }
    return Number.isFinite(parsedId) ? getTicket(parsedId) : null
  }, [parsedId, ticketOverride])

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

  function handleSendReply(): void {
    if (!user) {
      return
    }
    setError('')
    try {
      const updated = replyToTicket(
        currentTicket.id,
        user.id,
        user.display_name,
        { message: reply },
      )
      setReply('')
      setTicketOverride(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.ticketDetail.failedSendReply)
    }
  }

  function handleClose(): void {
    setError('')
    try {
      const updated = closeTicket(currentTicket.id)
      setTicketOverride(updated)
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
