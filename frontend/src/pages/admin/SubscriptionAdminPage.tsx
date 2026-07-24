import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { z } from 'zod'
import PageHeader from '../../components/common/PageHeader'
import {
  formatAdminDateTime,
  formatAdminMonthYear,
  getAdminPageText,
} from '../../lib/constants/adminPageText'
import {
  getCurrentPeriod,
  getPricing,
  getRevenueReport,
  updatePricing,
} from '../../lib/api/managementService'
import { useAppLanguage } from '../../theme/LanguageContext'
import type { SubscriptionTier } from '../../lib/constants/subscriptionLimits'
import type { RevenueReport } from '../../types/admin'
import type { SubscriptionPricing } from '../../types/subscription'

type PricingFormValues = {
  silver_price: number
  gold_price: number
}

const TIER_COLORS: Record<SubscriptionTier, string> = {
  basic: '#9e9e9e',
  silver: '#c0c0c0',
  gold: '#ffd700',
}

const EMPTY_REPORT: RevenueReport = {
  period_year: 0,
  period_month: 0,
  total_subscription_revenue: 0,
  subscription_distribution: [],
}

export default function SubscriptionAdminPage() {
  const { language } = useAppLanguage()
  const copy = getAdminPageText(language)
  const period = getCurrentPeriod()
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [pricing, setPricing] = useState<SubscriptionPricing>({ silver_price: 0, gold_price: 0 })
  const [report, setReport] = useState<RevenueReport>(EMPTY_REPORT)

  const pricingSchema = useMemo(
    () =>
      z.object({
        silver_price: z.coerce.number().positive(copy.subscriptions.silverPriceError),
        gold_price: z.coerce.number().positive(copy.subscriptions.goldPriceError),
      }),
    [copy.subscriptions.goldPriceError, copy.subscriptions.silverPriceError],
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PricingFormValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: { silver_price: 0, gold_price: 0 },
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([getPricing(), getRevenueReport(period.year, period.month)])
      .then(([pricingResult, reportResult]) => {
        if (cancelled) {
          return
        }
        setPricing(pricingResult)
        setReport(reportResult)
        reset({
          silver_price: pricingResult.silver_price,
          gold_price: pricingResult.gold_price,
        })
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : copy.subscriptions.failedUpdate)
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
  }, [])

  const chartData = useMemo(
    () =>
      report.subscription_distribution.map((item) => ({
        name: `${copy.subscriptions.tierLabels[item.tier]} (${item.percentage}%)`,
        value: item.user_count,
        percentage: item.percentage,
        fill: TIER_COLORS[item.tier],
      })),
    [copy.subscriptions.tierLabels, report.subscription_distribution],
  )

  async function onSubmit(values: PricingFormValues): Promise<void> {
    setError('')
    setSuccess('')
    try {
      const updated = await updatePricing(values)
      setPricing(updated)
      setSuccess(copy.subscriptions.updateSuccess)
      reset({
        silver_price: updated.silver_price,
        gold_price: updated.gold_price,
      })
      const refreshedReport = await getRevenueReport(period.year, period.month)
      setReport(refreshedReport)
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.subscriptions.failedUpdate)
    }
  }

  const periodLabel = formatAdminMonthYear(period.year, period.month, language)
  const lastUpdatedLabel = pricing.updated_at
    ? copy.subscriptions.lastUpdated(
        formatAdminDateTime(pricing.updated_at, language),
      )
    : null

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <PageHeader className="mb-4">{copy.subscriptions.title}</PageHeader>

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

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper className="p-6">
            <Typography className="mb-4" variant="h6" sx={{ fontWeight: 600 }}>
              {copy.subscriptions.pricePanel}
            </Typography>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  error={Boolean(errors.silver_price)}
                  helperText={errors.silver_price?.message}
                  label={copy.subscriptions.silverPrice}
                  type="number"
                  slotProps={{ htmlInput: { step: '0.01', min: 0 } }}
                  {...register('silver_price')}
                />
                <TextField
                  fullWidth
                  error={Boolean(errors.gold_price)}
                  helperText={errors.gold_price?.message}
                  label={copy.subscriptions.goldPrice}
                  type="number"
                  slotProps={{ htmlInput: { step: '0.01', min: 0 } }}
                  {...register('gold_price')}
                />
                {lastUpdatedLabel ? (
                  <Typography color="text.secondary" variant="caption">
                    {lastUpdatedLabel}
                  </Typography>
                ) : null}
                <Button disabled={isSubmitting} type="submit" variant="contained">
                  {copy.subscriptions.updatePrices}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={3}>
            <Paper className="p-6">
              <Typography className="mb-2" variant="h6" sx={{ fontWeight: 600 }}>
                {copy.subscriptions.monthlyRevenue}
              </Typography>
              <Typography sx={{ typography: { xs: 'h4', md: 'h3' }, fontWeight: 700 }}>
                ${report.total_subscription_revenue.toFixed(2)}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {periodLabel}
              </Typography>
            </Paper>

            <Paper className="p-6">
              <Typography className="mb-4" variant="h6" sx={{ fontWeight: 600 }}>
                {copy.subscriptions.userDistribution}
              </Typography>
              <Box sx={{ height: { xs: 280, sm: 340 }, width: '100%', minHeight: 240 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      cx="50%"
                      cy="42%"
                      data={chartData}
                      dataKey="value"
                      innerRadius={55}
                      outerRadius={85}
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      align="center"
                      layout="horizontal"
                      verticalAlign="bottom"
                      wrapperStyle={{ paddingTop: 16, lineHeight: '28px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}
