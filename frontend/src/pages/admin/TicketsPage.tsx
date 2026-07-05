/**
 * TicketsPage — support tickets and artist approval hub
 * Spec reference: §2.11.1
 */
import {
  Box,
  Button,
  Chip,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material'
import { format } from 'date-fns'
import { useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState'
import {
  adminTicketDetailPath,
  adminVerificationDetailPath,
} from '../../lib/constants/routes'
import { listTickets } from '../../lib/mock/ticketService'
import { listPendingRequests } from '../../lib/mock/verificationService'
import type { TicketStatus } from '../../types/support'

const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  answered: 'Answered',
  closed: 'Closed',
}

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), 'MMM d, yyyy')
  } catch {
    return iso
  }
}

export default function TicketsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const tabParam = searchParams.get('tab')
  const [tab, setTab] = useState(tabParam === 'verification' ? 1 : 0)

  const tickets = listTickets()
  const pendingRequests = listPendingRequests()

  function handleTabChange(_: React.SyntheticEvent, newValue: number): void {
    setTab(newValue)
    setSearchParams(newValue === 1 ? { tab: 'verification' } : {})
  }

  return (
    <Box>
      <Typography className="mb-4" component="h1" variant="h4" sx={{ fontWeight: 700 }}>
        Tickets & Authentication
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab label="Support Tickets" />
          <Tab label="Artist Approval Requests" />
        </Tabs>
      </Paper>

      {tab === 0 ? (
        tickets.length === 0 ? (
          <EmptyState title="No support tickets yet." />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ticket ID</TableCell>
                  <TableCell>User Name</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Date Submitted</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(adminTicketDetailPath(ticket.id))}
                  >
                    <TableCell>#{ticket.id}</TableCell>
                    <TableCell>{ticket.user_name}</TableCell>
                    <TableCell>{ticket.subject}</TableCell>
                    <TableCell>{formatDate(ticket.created_at)}</TableCell>
                    <TableCell>
                      <Chip
                        label={TICKET_STATUS_LABELS[ticket.status]}
                        size="small"
                        color={
                          ticket.status === 'open'
                            ? 'warning'
                            : ticket.status === 'answered'
                              ? 'info'
                              : 'default'
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      ) : pendingRequests.length === 0 ? (
        <EmptyState title="No pending artist approval requests." />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Stage Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.stage_name}</TableCell>
                  <TableCell>{request.email}</TableCell>
                  <TableCell align="right">
                    <Button
                      component={RouterLink}
                      size="small"
                      to={adminVerificationDetailPath(request.id)}
                      variant="outlined"
                    >
                      View portfolio/samples
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
