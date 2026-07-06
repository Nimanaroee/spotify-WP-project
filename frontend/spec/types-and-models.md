# Types and Models

All domain models live in `src/types/`. This is the contract between UI, mock services (Phase 1), and the Django API (Phase 2).

## Import pattern

```ts
// Preferred — barrel import
import type { User, Playlist, Track } from '../types'

// OK for large feature files
import type { PlayerState, RepeatMode } from '../types/player'
```

## File map

| File | Models |
|------|--------|
| `common.ts` | `EntityId`, `Timestamps`, `PaginatedResponse`, `ApiError` |
| `user.ts` | `User`, `UserSummary`, `Follow`, auth/register payloads |
| `artist.ts` | `ArtistProfile`, `ArtistVerificationRequest`, `VerificationStatus` |
| `subscription.ts` | `SubscriptionPlan`, `UserSubscription`, `SubscriptionPricing` |
| `music.ts` | `Track`, `Album`, `Genre`, `ReleaseType`, `PublishReleasePayload`, `UpdateTrackPayload` |
| `playlist.ts` | `Playlist`, `PlaylistTrack`, CRUD payloads |
| `player.ts` | `PlayerState`, `QueueItem`, `RepeatMode` (frontend-only) |
| `notification.ts` | `Notification`, category unions by role |
| `settings.ts` | `UserPreferences`, `AppLanguage` |
| `support.ts` | `SupportTicket`, `TicketMessage`, `TicketStatus` |
| `admin.ts` | `MonthlyArtistAudit`, `RevenueReport`, `PaymentStatus` |
| `payment.ts` | `Transaction`, `TransactionStatus`, `PaymentInitResponse` |

## Naming: Summary vs full entity

| Pattern | When |
|---------|------|
| `TrackSummary` | Cards, queues, lists |
| `Track` | Detail view, player, edit forms |
| `UserSummary` | Auth session, avatars in lists |
| `User` | Profile page, settings |

Extend summary types with `extends` — do not duplicate fields.

## Constants vs types

| Location | Contents |
|----------|----------|
| `src/lib/constants/roles.ts` | `ROLES`, `Role` |
| `src/lib/constants/subscriptionLimits.ts` | `SUBSCRIPTION_LIMITS`, `SubscriptionTier` |
| `src/types/` | Everything else |

Types import `Role` and `SubscriptionTier` from constants — do not redefine them.

## Field naming rules

| Context | Case | Example |
|---------|------|---------|
| API / entity types | snake_case | `display_name`, `is_read` |
| Frontend-only state | camelCase | `isPlaying`, `progressSeconds` |
| Payload types | snake_case | `password_confirmation` |

Match Django REST serializers in Phase 2. Backend models use snake_case fields.

## Roles

```ts
type Role = 'listener' | 'artist' | 'support' | 'admin'
```

Use `ROLES` constant for comparisons:

```ts
import { ROLES } from '../lib/constants/roles'

if (user.role === ROLES.ARTIST) { ... }
```

## Subscription tiers

```ts
type SubscriptionTier = 'basic' | 'silver' | 'gold'
```

Enforce limits using `SUBSCRIPTION_LIMITS` from constants — not hardcoded numbers in components.

## Adding a new type

1. Add to the correct file under `src/types/`.
2. Re-export from `src/types/index.ts`.
3. If it maps to localStorage, document the key in [state-and-data.md](./state-and-data.md).
4. If it maps to a future API endpoint, note the endpoint in a comment (Phase 2).

Do **not** define `interface User` inside a component file.

## Payload types

Request bodies use a `*Payload` suffix:

- `LoginPayload`
- `CreatePlaylistPayload`
- `UpdateSubscriptionPricingPayload`

Keep payloads separate from entity types so forms can omit read-only fields.

## Paginated lists (Phase 2)

List endpoints return:

```ts
interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
```

Phase 1 mock services may return plain arrays; wrap when integrating API.
