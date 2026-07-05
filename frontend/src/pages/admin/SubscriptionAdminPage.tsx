/**
 * SubscriptionAdminPage — price control and revenue reports
 * Spec reference: §2.11.3
 */
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { format } from 'date-fns'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { z } from 'zod'
import {
  getCurrentPeriod,
} from '../../lib/mock/auditService'
import {
  getPricing,
  getRevenueReport,
  updatePricing,
} from '../../lib/mock/subscriptionAdminService'
import type { SubscriptionTier } from '../../lib/constants/subscriptionLimits'

const pricingSchema = z.object({
  silver_price: z.coerce.number().positive('Silver price must be greater than zero.'),
  gold_price: z.coerce.number().positive('Gold price must be greater than zero.'),
})

type PricingFormValues = z.infer<typeof pricingSchema>

const TIER_COLORS: Record<SubscriptionTier, string> = {
  basic: '#9e9e9e',
  silver: '#c0c0c0',
  gold: '#ffd700',
}

const TIER_LABELS: Record<SubscriptionTier, string> = {
  basic: 'Basic',
  silver: 'Silver',
  gold: 'Gold',
}

export default function SubscriptionAdminPage() {
  const period = getCurrentPeriod()
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  void refreshKey
  const pricing = getPricing()
  const report = getRevenueReport(period.year, period.month)

  const chartData = useMemo(
    () =>
      report.subscription_distribution.map((item) => ({
        name: TIER_LABELS[item.tier],
        value: item.user_count,
        percentage: item.percentage,
        fill: TIER_COLORS[item.tier],
      })),
    [report.subscription_distribution],
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PricingFormValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      silver_price: pricing.silver_price,
      gold_price: pricing.gold_price,
    },
  })

  function onSubmit(values: PricingFormValues): void {
    setError('')
    setSuccess('')
    try {
      const updated = updatePricing(values)
      setSuccess('Subscription prices updated successfully.')
      reset({
        silver_price: updated.silver_price,
        gold_price: updated.gold_price,
      })
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prices.')
    }
  }

  return (
    <Box>
      <Typography className="mb-4" component="h1" variant="h4" sx={{ fontWeight: 700 }}>
        Subscription Management
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

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper className="p-6">
            <Typography className="mb-4" variant="h6" sx={{ fontWeight: 600 }}>
              Price Control Panel
            </Typography>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  error={Boolean(errors.silver_price)}
                  helperText={errors.silver_price?.message}
                  label="Silver Subscription Price ($)"
                  type="number"
                  slotProps={{ htmlInput: { step: '0.01', min: 0 } }}
                  {...register('silver_price')}
                />
                <TextField
                  fullWidth
                  error={Boolean(errors.gold_price)}
                  helperText={errors.gold_price?.message}
                  label="Gold Subscription Price ($)"
                  type="number"
                  slotProps={{ htmlInput: { step: '0.01', min: 0 } }}
                  {...register('gold_price')}
                />
                {pricing.updated_at ? (
                  <Typography color="text.secondary" variant="caption">
                    Last updated:{' '}
                    {format(new Date(pricing.updated_at), 'MMM d, yyyy h:mm a')}
                  </Typography>
                ) : null}
                <Button disabled={isSubmitting} type="submit" variant="contained">
                  Update Prices
                </Button>
              </Stack>
            </form>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={3}>
            <Paper className="p-6">
              <Typography className="mb-2" variant="h6" sx={{ fontWeight: 600 }}>
                Monthly Subscription Revenue
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                ${report.total_subscription_revenue.toFixed(2)}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {format(new Date(period.year, period.month - 1), 'MMMM yyyy')}
              </Typography>
            </Paper>

            <Paper className="p-6">
              <Typography className="mb-4" variant="h6" sx={{ fontWeight: 600 }}>
                User Distribution by Tier
              </Typography>
              <Box sx={{ height: 300, width: '100%' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      cx="50%"
                      cy="50%"
                      data={chartData}
                      dataKey="value"
                      innerRadius={60}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={100}
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
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
