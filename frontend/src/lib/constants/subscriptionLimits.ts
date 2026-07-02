export interface SubscriptionTierLimits {
  streamsPerDay: number
  playlistLimit: number
  profilePicture: boolean
  download: boolean
  earlyAccess: boolean
  viewStats: boolean
  price: number | null
}

export type SubscriptionTier = 'basic' | 'silver' | 'gold'

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionTierLimits> = {
  basic: {
    streamsPerDay: 60,
    playlistLimit: 6,
    profilePicture: false,
    download: false,
    earlyAccess: false,
    viewStats: false,
    price: 0,
  },
  silver: {
    streamsPerDay: Infinity,
    playlistLimit: 100,
    profilePicture: true,
    download: true,
    earlyAccess: false,
    viewStats: false,
    price: null,
  },
  gold: {
    streamsPerDay: Infinity,
    playlistLimit: Infinity,
    profilePicture: true,
    download: true,
    earlyAccess: true,
    viewStats: true,
    price: null,
  },
}
