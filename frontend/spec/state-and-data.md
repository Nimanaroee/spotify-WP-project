# State and Data

## State ownership

| State | Where | Example |
|-------|-------|---------|
| Auth session | `authStore` | logged-in `User` |
| Player | `playerStore` (create) | queue, repeat, shuffle, volume |
| Page-local UI | `useState` in page | modal open, tab index |
| Server/mock data | store or page hook | playlists list, notifications |
| Form draft | React Hook Form | login, register, settings |

Create new stores only when **two or more routes** need the same live state.

## Zustand store pattern

```ts
import { create } from 'zustand'
import type { User } from '../types'

interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
```

- Store file: `src/store/<name>Store.ts`
- Hook name: `useAuthStore`, `usePlayerStore`
- No side effects inside `create()` — call seed/load from `App` or a dedicated init hook

## localStorage (Phase 1)

Access only through `src/lib/mock/storage.ts`:

```ts
import { storage } from '../lib/mock/storage'

const playlists = storage.get<Playlist[]>('playlists') ?? []
storage.set('playlists', updated)
```

Never call `localStorage` directly outside `storage.ts`.

## Registered storage keys

Document new keys here when you add them.

| Key | Type | Owner feature | Description |
|-----|------|---------------|-------------|
| `seeded` | `boolean` | mock/seed | First-load flag |
| `users` | `User[]` | auth | Mock user registry |
| `auth_user_id` | `number` | auth | Current session user id |
| `playlists` | `Playlist[]` | §2.7 | User playlists with tracks |
| `tracks` | `Track[]` | §2.8 | Catalog |
| `albums` | `Album[]` | §2.8 | Catalog |
| `notifications` | `Notification[]` | §2.6 | Per-user notifications |
| `subscription_pricing` | `SubscriptionPricing` | §2.11.3 | Admin silver/gold prices |
| `user_preferences` | `Record<number, UserPreferences>` | §2.5 | Keyed by user id |
| `tickets` | `SupportTicket[]` | §2.11.1 | Support tickets |
| `artist_audits` | `MonthlyArtistAudit[]` | §2.11.2 | Admin auditing table |
| `artist_profiles` | `ArtistProfile[]` | §2.4, §2.10 | Artist metadata |
| `verification_requests` | `ArtistVerificationRequest[]` | §2.11.1 | Pending artist approvals |
| `daily_streams` | `Record<number, number>` | §2.3 | User id → count today |
| `follows` | `Follow[]` | §2.3 | Mock follow relationships between users |

Reset demo data during development: clear localStorage and reload.

## Seed data

`src/lib/mock/seed.ts` runs once on app load (from `App.tsx` or `main.tsx`).

Rules:

- Seed only if `seeded` is falsy.
- Provide enough data to demo every major page (at least 1–2 items per list).
- Use realistic names; include all four roles for manual testing.
- Align seeded objects with types in `src/types/`.

## Mock services (recommended pattern)

Create `src/lib/mock/<feature>Service.ts`:

```ts
import type { Playlist, CreatePlaylistPayload } from '../../types'
import { storage } from './storage'
import { SUBSCRIPTION_LIMITS } from '../constants/subscriptionLimits'
import { useAuthStore } from '../../store/authStore'

export function listPlaylists(): Playlist[] {
  return storage.get<Playlist[]>('playlists') ?? []
}

export function createPlaylist(payload: CreatePlaylistPayload): Playlist {
  // enforce subscription limit, persist, return new playlist
}
```

Pages call services — not raw storage. Phase 2 replaces the service body with API calls.

## Subscription limits

Always check limits through constants:

```ts
import { SUBSCRIPTION_LIMITS } from '../constants/subscriptionLimits'

const tier = user.subscription_tier ?? 'basic'
const limit = SUBSCRIPTION_LIMITS[tier].playlistLimit
```

Use `Infinity` checks before comparing counts.

## Daily stream limit (Basic tier)

Track plays in `daily_streams` keyed by user id. Reset count when the date changes (store last date per user or compare `played_at` on stream events).

## Phase 2 migration

1. Keep function names in mock services; swap implementation to `api/client`.
2. Keep types unchanged where possible.
3. Move preferences and pricing to backend — remove localStorage keys once integrated.
4. Document API endpoints in `docs/backend-requirements.md` at repo root.
