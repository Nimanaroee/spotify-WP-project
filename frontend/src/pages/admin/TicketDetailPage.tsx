/**
 * TicketDetailPage — chat-style support ticket detail
 * Spec reference: §2.11.1
 */
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
import { format } from 'date-fns'
import { useMemo, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { ROUTES } from '../../lib/constants/routes'
import { closeTicket, getTicket, replyToTicket } from '../../lib/mock/ticketService'
import { useAuthStore } from '../../store/authStore'
import type { SupportTicket, TicketStatus } from '../../types/support'

const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  answered: 'Answered',
  closed: 'Closed',
}

function formatDateTime(iso: string): string {
  try {
    return format(new Date(iso), 'MMM d, yyyy h:mm a')
  } catch {
    return iso
  }
}

export default function TicketDetailPage() {
  const { ticketId } = useParams()
  const user = useAuthStore((state) => state.user)
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
      <Box>
        <Alert severity="error">Ticket not found.</Alert>
        <Button className="mt-4" component={RouterLink} to={ROUTES.ADMIN_TICKETS}>
          Back to tickets
        </Button>
      </Box>
    )
  }

  const messages = ticket.messages ?? []
  const isClosed = ticket.status === 'closed'
  const currentTicket = ticket

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
      setError(err instanceof Error ? err.message : 'Failed to send reply.')
    }
  }

  function handleClose(): void {
    setError('')
    try {
      const updated = closeTicket(currentTicket.id)
      setTicketOverride(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close ticket.')
    }
  }

  return (
    <Box>
      <Stack className="mb-4" direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Button component={RouterLink} to={ROUTES.ADMIN_TICKETS} variant="outlined">
          Back
        </Button>
        <Typography className="flex-1" component="h1" variant="h5" sx={{ fontWeight: 700 }}>
          Ticket #{ticket.id}: {ticket.subject}
        </Typography>
        <Chip label={TICKET_STATUS_LABELS[ticket.status]} size="small" />
      </Stack>

      <Typography className="mb-4" color="text.secondary" variant="body2">
        From {ticket.user_name} · Submitted {formatDateTime(ticket.created_at)}
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
                  {msg.sender_name} · {formatDateTime(msg.created_at)}
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
            label="Your reply"
            minRows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={handleSendReply}>
              Send reply
            </Button>
            <Button color="inherit" variant="outlined" onClick={handleClose}>
              Close ticket
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Alert severity="info">This ticket is closed.</Alert>
      )}
    </Box>
  )
}
