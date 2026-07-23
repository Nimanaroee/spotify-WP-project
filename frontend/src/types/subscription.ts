import type { SubscriptionTier } from '../lib/constants/subscriptionLimits'
import type { EntityId, Timestamps } from './common'

export type SubscriptionPeriodMonths = 1 | 3 | 6 | 12

export interface SubscriptionFee {
  subscription_tier: SubscriptionTier
  price_per_month: number
}

export interface SubscriptionPlan {
  id: EntityId
  tier: SubscriptionTier
  price: number | null
  streams_per_day: number | null
  playlist_limit: number | null
  profile_picture: boolean
  download: boolean
  early_access: boolean
  view_stats: boolean
}

export interface UserSubscription extends Timestamps {
  id: EntityId
  user_id: EntityId
  plan_id: EntityId
  tier: SubscriptionTier
  started_at: string
  expires_at: string
  period_months: SubscriptionPeriodMonths
  is_active: boolean
}

export interface SubscriptionPricing {
  silver_price: number
  gold_price: number
  updated_at?: string
}

export interface UpdateSubscriptionPricingPayload {
  silver_price: number
  gold_price: number
}

export interface PurchaseSubscriptionPayload {
  tier: Exclude<SubscriptionTier, 'basic'>
  period_months: SubscriptionPeriodMonths
}
