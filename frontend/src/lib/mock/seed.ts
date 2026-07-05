import { ROLES } from '../constants/roles'
import { storage } from './storage'

export function seedDemoData(): void {
  if (!storage.get<boolean>('seeded')) {
    const createdAt = new Date().toISOString()
    const now = new Date()
    const periodYear = now.getFullYear()
    const periodMonth = now.getMonth() + 1

    storage.set('seeded', true)
    storage.set('users', [
      {
        id: 1,
        username: 'demo_user',
        email: 'demo@example.com',
        password: 'password123',
        display_name: 'Demo User',
        role: ROLES.LISTENER,
        subscription_tier: 'basic',
        followers_count: 0,
        following_count: 0,
        daily_streams_count: 0,
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: 2,
        username: 'demo_artist',
        email: 'artist@example.com',
        password: 'password123',
        display_name: 'Demo Artist',
        role: ROLES.ARTIST,
        subscription_tier: 'silver',
        followers_count: 120,
        following_count: 5,
        daily_streams_count: 0,
        account_status: 'active',
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: 3,
        username: 'support_agent',
        email: 'support@example.com',
        password: 'password123',
        display_name: 'Support Agent',
        role: ROLES.SUPPORT,
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: 4,
        username: 'manager',
        email: 'manager@example.com',
        password: 'password123',
        display_name: 'Manager',
        role: ROLES.ADMIN,
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: 5,
        username: 'pending_artist',
        email: 'pending@example.com',
        password: 'password123',
        display_name: 'Neon Waves',
        role: ROLES.ARTIST,
        subscription_tier: 'basic',
        followers_count: 0,
        following_count: 0,
        daily_streams_count: 0,
        account_status: 'pending_approval',
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: 6,
        username: 'gold_listener',
        email: 'gold@example.com',
        password: 'password123',
        display_name: 'Gold Listener',
        role: ROLES.LISTENER,
        subscription_tier: 'gold',
        followers_count: 10,
        following_count: 3,
        daily_streams_count: 0,
        created_at: createdAt,
        updated_at: createdAt,
      },
    ])

    storage.set('verification_requests', [
      {
        id: 1,
        user_id: 5,
        stage_name: 'Neon Waves',
        email: 'pending@example.com',
        portfolio_links: [
          'https://soundcloud.com/example/neon-waves',
          'https://example.com/portfolio/neon-waves',
        ],
        verification_status: 'pending',
        created_at: createdAt,
        updated_at: createdAt,
      },
    ])

    storage.set('artist_profiles', [
      {
        id: 1,
        user_id: 2,
        stage_name: 'Demo Artist',
        bio: 'Electronic music producer.',
        portfolio_links: ['https://example.com/demo-artist'],
        verification_status: 'approved',
        is_verified: true,
        listener_count: 450,
        total_streams: 12500,
        created_at: createdAt,
        updated_at: createdAt,
      },
    ])

    storage.set('tickets', [
      {
        id: 1,
        user_id: 1,
        user_name: 'Demo User',
        subject: 'Cannot create more playlists',
        status: 'open',
        messages: [
          {
            id: 1,
            ticket_id: 1,
            sender_id: 1,
            sender_name: 'Demo User',
            message: 'I hit my playlist limit on Basic. Can I upgrade?',
            created_at: createdAt,
            updated_at: createdAt,
          },
        ],
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: 2,
        user_id: 6,
        user_name: 'Gold Listener',
        subject: 'Billing question',
        status: 'answered',
        messages: [
          {
            id: 1,
            ticket_id: 2,
            sender_id: 6,
            sender_name: 'Gold Listener',
            message: 'When does my Gold subscription renew?',
            created_at: createdAt,
            updated_at: createdAt,
          },
          {
            id: 2,
            ticket_id: 2,
            sender_id: 3,
            sender_name: 'Support Agent',
            message: 'Your subscription renews on the 1st of each month.',
            created_at: createdAt,
            updated_at: createdAt,
          },
        ],
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: 3,
        user_id: 1,
        user_name: 'Demo User',
        subject: 'Account recovery',
        status: 'closed',
        messages: [
          {
            id: 1,
            ticket_id: 3,
            sender_id: 1,
            sender_name: 'Demo User',
            message: 'I forgot my password but recovered it. Please close this ticket.',
            created_at: createdAt,
            updated_at: createdAt,
          },
        ],
        created_at: createdAt,
        updated_at: createdAt,
      },
    ])

    storage.set('artist_audits', [
      {
        id: 1,
        artist_id: 2,
        artist_name: 'Demo Artist',
        period_year: periodYear,
        period_month: periodMonth,
        unique_listeners_count: 320,
        total_streams_count: 4500,
        payout_amount: 225.0,
        payment_status: 'pending',
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: 2,
        artist_id: 2,
        artist_name: 'Demo Artist',
        period_year: periodMonth === 1 ? periodYear - 1 : periodYear,
        period_month: periodMonth === 1 ? 12 : periodMonth - 1,
        unique_listeners_count: 280,
        total_streams_count: 3900,
        payout_amount: 195.0,
        payment_status: 'settled',
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: 3,
        artist_id: 5,
        artist_name: 'Neon Waves',
        period_year: periodYear,
        period_month: periodMonth,
        unique_listeners_count: 45,
        total_streams_count: 120,
        payout_amount: 6.0,
        payment_status: 'pending',
        created_at: createdAt,
        updated_at: createdAt,
      },
    ])

    storage.set('subscription_pricing', {
      silver_price: 9.99,
      gold_price: 19.99,
      updated_at: createdAt,
    })

    storage.set('notifications', [])
  }
}
