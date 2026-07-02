import type { SubscriptionTier } from '../lib/constants/subscriptionLimits'
import type { SubscriptionPeriodMonths } from './subscription'
import type { EntityId, Timestamps } from './common'

export type TransactionStatus = 'pending' | 'successful' | 'failed'

export interface Transaction extends Timestamps {
  id: EntityId
  user_id: EntityId
  amount: number
  tier: Exclude<SubscriptionTier, 'basic'>
  period_months: SubscriptionPeriodMonths
  status: TransactionStatus
  gateway_reference?: string
}

export interface PaymentInitResponse {
  transaction_id: EntityId
  redirect_url: string
}
