/**
 * AuditingPage — monthly artist financial calculations
 * Spec reference: §2.11.2
 */
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import EmptyState from '../../components/common/EmptyState'
import { ROLES } from '../../lib/constants/roles'
import {
  confirmSettlement,
  getCurrentPeriod,
  listMonthlyAudits,
} from '../../lib/mock/auditService'
import { hasRole } from '../../routes/RoleGuard'
import { useAuthStore } from '../../store/authStore'
import type { PaymentStatus } from '../../types/admin'

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pending Payment',
  settled: 'Settled',
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

export default function AuditingPage() {
  const user = useAuthStore((state) => state.user)
  const currentPeriod = getCurrentPeriod()
  const [year, setYear] = useState(currentPeriod.year)
  const [month, setMonth] = useState(currentPeriod.month)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const audits = useMemo(
    () => listMonthlyAudits(year, month),
    [year, month, refreshKey],
  )
  const isAdmin = hasRole(user, [ROLES.ADMIN])

  function handleConfirmSettlement(auditId: number): void {
    if (!user) {
      return
    }
    setError('')
    try {
      confirmSettlement(auditId, user.role)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm settlement.')
    }
  }

  return (
    <Box>
      <Typography className="mb-4" component="h1" variant="h4" sx={{ fontWeight: 700 }}>
        Auditing / Accounting
      </Typography>

      <Stack className="mb-4" direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Year"
          select
          size="small"
          sx={{ minWidth: 120 }}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {[year - 1, year, year + 1].map((y) => (
            <MenuItem key={y} value={y}>
              {y}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Month"
          select
          size="small"
          sx={{ minWidth: 140 }}
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
        >
          {MONTHS.map((m) => (
            <MenuItem key={m} value={m}>
              {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {error ? (
        <Alert className="mb-4" severity="error">
          {error}
        </Alert>
      ) : null}

      {audits.length === 0 ? (
        <EmptyState title="No audit records for this period." />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Artist</TableCell>
                <TableCell align="right">Unique Listeners</TableCell>
                <TableCell align="right">Registered Streams</TableCell>
                <TableCell align="right">Calculated Reward</TableCell>
                <TableCell>Payment Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {audits.map((audit) => (
                <TableRow key={audit.id}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>{audit.artist_name}</Typography>
                    <Typography color="text.secondary" variant="caption">
                      ART-{audit.artist_id}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{audit.unique_listeners_count}</TableCell>
                  <TableCell align="right">{audit.total_streams_count}</TableCell>
                  <TableCell align="right">
                    ${audit.payout_amount?.toFixed(2) ?? '—'}
                  </TableCell>
                  <TableCell>{PAYMENT_STATUS_LABELS[audit.payment_status]}</TableCell>
                  <TableCell align="right">
                    {audit.payment_status === 'pending' && isAdmin ? (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleConfirmSettlement(audit.id)}
                      >
                        Confirm Settlement
                      </Button>
                    ) : null}
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
