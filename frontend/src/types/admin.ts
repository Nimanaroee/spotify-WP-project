import type { EntityId, Timestamps } from './common'
import type { SubscriptionTier } from '../lib/constants/subscriptionLimits'

export type PaymentStatus = 'pending' | 'settled'

export interface MonthlyArtistAudit extends Timestamps {
  id: EntityId
  artist_id: EntityId
  artist_name: string
  period_year: number
  period_month: number
  unique_listeners_count: number
  total_streams_count: number
  payout_amount: number | null
  payment_status: PaymentStatus
}

export interface SubscriptionDistribution {
  tier: SubscriptionTier
  user_count: number
  percentage: number
}

export interface RevenueReport {
  period_year: number
  period_month: number
  total_subscription_revenue: number
  subscription_distribution: SubscriptionDistribution[]
}
