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
import { useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState'
import {
  formatAdminDate,
  getAdminPageText,
} from '../../lib/constants/adminPageText'
import {
  adminTicketDetailPath,
  adminVerificationDetailPath,
} from '../../lib/constants/routes'
import { listTickets } from '../../lib/mock/ticketService'
import { listPendingRequests } from '../../lib/mock/verificationService'
import { useAppLanguage } from '../../theme/LanguageContext'

export default function TicketsPage() {
  const { language } = useAppLanguage()
  const copy = getAdminPageText(language)
  const isRtl = language === 'fa'
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
    <Box dir={isRtl ? 'rtl' : 'ltr'}>
      <Typography className="mb-4" component="h1" variant="h4" sx={{ fontWeight: 700 }}>
        {copy.tickets.title}
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab label={copy.tickets.ticketsTab} />
          <Tab label={copy.tickets.verificationTab} />
        </Tabs>
      </Paper>

      {tab === 0 ? (
        tickets.length === 0 ? (
          <EmptyState title={copy.tickets.noTickets} />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{copy.tickets.ticketId}</TableCell>
                  <TableCell>{copy.tickets.userName}</TableCell>
                  <TableCell>{copy.tickets.subject}</TableCell>
                  <TableCell>{copy.tickets.dateSubmitted}</TableCell>
                  <TableCell>{copy.tickets.status}</TableCell>
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
                    <TableCell>{formatAdminDate(ticket.created_at, language)}</TableCell>
                    <TableCell>
                      <Chip
                        label={copy.tickets.statusLabels[ticket.status]}
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
        <EmptyState title={copy.tickets.noRequests} />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{copy.tickets.stageName}</TableCell>
                <TableCell>{copy.tickets.email}</TableCell>
                <TableCell sx={{ textAlign: 'end' }}>{copy.tickets.actions}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.stage_name}</TableCell>
                  <TableCell>{request.email}</TableCell>
                  <TableCell sx={{ textAlign: 'end' }}>
                    <Button
                      component={RouterLink}
                      size="small"
                      to={adminVerificationDetailPath(request.id)}
                      variant="outlined"
                    >
                      {copy.tickets.viewPortfolio}
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
