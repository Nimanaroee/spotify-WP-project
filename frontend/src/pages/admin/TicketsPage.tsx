import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Tab,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import ScrollableTableContainer from '../../components/common/ScrollableTableContainer'
import {
  formatAdminDate,
  getAdminPageText,
} from '../../lib/constants/adminPageText'
import {
  adminTicketDetailPath,
  adminVerificationDetailPath,
} from '../../lib/constants/routes'
import { listPendingRequests, listTickets } from '../../lib/api/managementService'
import { useAppLanguage } from '../../theme/LanguageContext'
import type { ArtistVerificationRequest } from '../../types/artist'
import type { SupportTicket } from '../../types/support'

export default function TicketsPage() {
  const { language } = useAppLanguage()
  const copy = getAdminPageText(language)
  const isRtl = language === 'fa'
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const tabParam = searchParams.get('tab')
  const [tab, setTab] = useState(tabParam === 'verification' ? 1 : 0)

  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [pendingRequests, setPendingRequests] = useState<ArtistVerificationRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([listTickets(), listPendingRequests()])
      .then(([ticketsResult, requestsResult]) => {
        if (cancelled) {
          return
        }
        setTickets(ticketsResult)
        setPendingRequests(requestsResult)
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  function handleTabChange(_: React.SyntheticEvent, newValue: number): void {
    setTab(newValue)
    setSearchParams(newValue === 1 ? { tab: 'verification' } : {})
  }

  return (
    <Box dir={isRtl ? 'rtl' : 'ltr'}>
      <PageHeader className="mb-4">{copy.tickets.title}</PageHeader>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          allowScrollButtonsMobile
          scrollButtons="auto"
          value={tab}
          variant="scrollable"
          onChange={handleTabChange}
        >
          <Tab label={copy.tickets.ticketsTab} />
          <Tab label={copy.tickets.verificationTab} />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : tab === 0 ? (
        tickets.length === 0 ? (
          <EmptyState title={copy.tickets.noTickets} />
        ) : (
          <ScrollableTableContainer minWidth={{ xs: 640, md: 'auto' }}>
            <TableHead>
              <TableRow>
                <TableCell>{copy.tickets.ticketId}</TableCell>
                <TableCell>{copy.tickets.userName}</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  {copy.tickets.subject}
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  {copy.tickets.dateSubmitted}
                </TableCell>
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
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    {ticket.subject}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    {formatAdminDate(ticket.created_at, language)}
                  </TableCell>
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
          </ScrollableTableContainer>
        )
      ) : pendingRequests.length === 0 ? (
        <EmptyState title={copy.tickets.noRequests} />
      ) : (
        <ScrollableTableContainer minWidth={{ xs: 480, md: 'auto' }}>
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
                    sx={{ whiteSpace: 'nowrap' }}
                    to={adminVerificationDetailPath(request.id)}
                    variant="outlined"
                  >
                    {copy.tickets.viewPortfolio}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </ScrollableTableContainer>
      )}
    </Box>
  )
}
