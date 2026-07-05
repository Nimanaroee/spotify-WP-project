import type { RevenueReport, SubscriptionDistribution } from '../../types/admin'
import type { SubscriptionPricing, UpdateSubscriptionPricingPayload } from '../../types/subscription'
import type { User } from '../../types/user'
import type { SubscriptionTier } from '../constants/subscriptionLimits'
import { storage } from './storage'

const SUBSCRIPTION_PRICING_KEY = 'subscription_pricing'
const USERS_KEY = 'users'

const DEFAULT_PRICING: SubscriptionPricing = {
  silver_price: 9.99,
  gold_price: 19.99,
}

function nowIso(): string {
  return new Date().toISOString()
}

export function getPricing(): SubscriptionPricing {
  return storage.get<SubscriptionPricing>(SUBSCRIPTION_PRICING_KEY) ?? DEFAULT_PRICING
}

export function updatePricing(payload: UpdateSubscriptionPricingPayload): SubscriptionPricing {
  if (payload.silver_price <= 0 || payload.gold_price <= 0) {
    throw new Error('Prices must be greater than zero.')
  }

  const pricing: SubscriptionPricing = {
    silver_price: payload.silver_price,
    gold_price: payload.gold_price,
    updated_at: nowIso(),
  }

  storage.set(SUBSCRIPTION_PRICING_KEY, pricing)
  return pricing
}

function countUsersByTier(): Record<SubscriptionTier, number> {
  const users = storage.get<User[]>(USERS_KEY) ?? []
  const listenerUsers = users.filter((u) => u.role === 'listener' || u.role === 'artist')

  return listenerUsers.reduce(
    (counts, user) => {
      const tier = user.subscription_tier ?? 'basic'
      counts[tier] += 1
      return counts
    },
    { basic: 0, silver: 0, gold: 0 } as Record<SubscriptionTier, number>,
  )
}

export function getRevenueReport(year: number, month: number): RevenueReport {
  const pricing = getPricing()
  const tierCounts = countUsersByTier()
  const totalUsers = tierCounts.basic + tierCounts.silver + tierCounts.gold

  const subscription_distribution: SubscriptionDistribution[] = (
    ['basic', 'silver', 'gold'] as SubscriptionTier[]
  ).map((tier) => ({
    tier,
    user_count: tierCounts[tier],
    percentage: totalUsers > 0 ? Math.round((tierCounts[tier] / totalUsers) * 100) : 0,
  }))

  const total_subscription_revenue =
    tierCounts.silver * pricing.silver_price + tierCounts.gold * pricing.gold_price

  return {
    period_year: year,
    period_month: month,
    total_subscription_revenue,
    subscription_distribution,
  }
}

export function getTierPrice(tier: SubscriptionTier): number | null {
  const pricing = getPricing()
  if (tier === 'basic') {
    return 0
  }
  if (tier === 'silver') {
    return pricing.silver_price
  }
  return pricing.gold_price
}
