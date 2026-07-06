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
import {
  formatAdminMonthName,
  getAdminPageText,
} from '../../lib/constants/adminPageText'
import { ROLES } from '../../lib/constants/roles'
import {
  confirmSettlement,
  getCurrentPeriod,
  listMonthlyAudits,
} from '../../lib/mock/auditService'
import { hasRole } from '../../routes/RoleGuard'
import { useAuthStore } from '../../store/authStore'
import { useAppLanguage } from '../../theme/LanguageContext'

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

export default function AuditingPage() {
  const user = useAuthStore((state) => state.user)
  const { language } = useAppLanguage()
  const copy = getAdminPageText(language)
  const isRtl = language === 'fa'
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
      setError(err instanceof Error ? err.message : copy.auditing.failedSettlement)
    }
  }

  return (
    <Box dir={isRtl ? 'rtl' : 'ltr'}>
      <Typography className="mb-4" component="h1" variant="h4" sx={{ fontWeight: 700 }}>
        {copy.auditing.title}
      </Typography>

      <Stack className="mb-4" direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label={copy.auditing.year}
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
          label={copy.auditing.month}
          select
          size="small"
          sx={{ minWidth: 140 }}
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
        >
          {MONTHS.map((m) => (
            <MenuItem key={m} value={m}>
              {formatAdminMonthName(m, language)}
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
        <EmptyState title={copy.auditing.noRecords} />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{copy.auditing.artist}</TableCell>
                <TableCell sx={{ textAlign: 'end' }}>{copy.auditing.uniqueListeners}</TableCell>
                <TableCell sx={{ textAlign: 'end' }}>{copy.auditing.registeredStreams}</TableCell>
                <TableCell sx={{ textAlign: 'end' }}>{copy.auditing.calculatedReward}</TableCell>
                <TableCell>{copy.auditing.paymentStatus}</TableCell>
                <TableCell sx={{ textAlign: 'end' }}>{copy.auditing.actions}</TableCell>
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
                  <TableCell sx={{ textAlign: 'end' }}>{audit.unique_listeners_count}</TableCell>
                  <TableCell sx={{ textAlign: 'end' }}>{audit.total_streams_count}</TableCell>
                  <TableCell sx={{ textAlign: 'end' }}>
                    ${audit.payout_amount?.toFixed(2) ?? '—'}
                  </TableCell>
                  <TableCell>{copy.auditing.paymentStatusLabels[audit.payment_status]}</TableCell>
                  <TableCell sx={{ textAlign: 'end' }}>
                    {audit.payment_status === 'pending' && isAdmin ? (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleConfirmSettlement(audit.id)}
                      >
                        {copy.auditing.confirmSettlement}
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
