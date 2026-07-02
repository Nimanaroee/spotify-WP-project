# Feature Map

Maps course project sections to frontend locations. Update the **Status** column as you ship work.

**Status:** `TODO` | `WIP` | `DONE`

## Phase 1 features

| Spec | Feature | Primary paths | Status |
|------|---------|---------------|--------|
| §2.1 | Login & registration | `pages/LoginPage`, `pages/RegisterPage`, `store/authStore` | TODO |
| §2.2 | Home page | `pages/HomePage`, `layouts/MainLayout` | WIP |
| §2.3 | User profile | `pages/UserProfilePage` | TODO |
| §2.4 | Artist profile | `pages/ArtistProfilePage`, `types/artist.ts` | TODO |
| §2.5 | App settings | `pages/SettingsPage`, `types/settings.ts` | TODO |
| §2.6 | Notifications | `pages/NotificationsPage`, `types/notification.ts` | TODO |
| §2.7 | Playlists | `pages/PlaylistsPage`, `types/playlist.ts` | TODO |
| §2.8 | Albums & singles | `pages/AlbumsPage`, `pages/AlbumDetailPage`, `types/music.ts` | TODO |
| §2.9 | Music player | `components/layout/PlayerBar`, `store/playerStore`, `types/player.ts` | TODO |
| §2.10 | Artwork management | `pages/ArtworkManagementPage` | TODO |
| §2.11 | Admin dashboard | `layouts/AdminLayout`, `pages/admin/*` | TODO |
| §2.11.1 | Tickets & verification | `pages/admin/TicketsPage`, `pages/admin/VerificationPage` | TODO |
| §2.11.2 | Auditing | `pages/admin/AuditingPage`, `types/admin.ts` | TODO |
| §2.11.3 | Subscription admin | `pages/admin/SubscriptionAdminPage`, `types/subscription.ts` | TODO |

## Cross-cutting concerns

| Concern | Where | Spec |
|---------|-------|------|
| Role-based nav | `lib/constants/navItems.ts`, layouts | §2 intro |
| Subscription limits | `lib/constants/subscriptionLimits.ts` | Table 1 |
| Responsive layouts | all pages, Tailwind breakpoints | §2 intro |
| Empty states | `components/common/EmptyState.tsx` | §2.6, §2.7 |
| Verified artist badge | `components/common/VerifiedBadge.tsx` (create) | §2.4 |
| Follow/unfollow | `lib/mock/followService.ts` (create), profile pages | §2.3, §2.4 |
| Gold-only stats | conditional UI using `SUBSCRIPTION_LIMITS` | §2.4, §2.9 |

## User roles

| Role | Constant | Dashboard entry |
|------|----------|-----------------|
| Listener | `ROLES.LISTENER` | `/` Home |
| Artist | `ROLES.ARTIST` | `/` + `/artist/studio` when verified |
| Support | `ROLES.SUPPORT` | `/admin/tickets` |
| Admin | `ROLES.ADMIN` | `/admin` full access |

## Subscription tiers

| Tier | Constant | Key limits |
|------|----------|------------|
| Basic | `basic` | 60 streams/day, 6 playlists, no avatar upload |
| Silver | `silver` | 100 playlists, downloads, avatar |
| Gold | `gold` | unlimited playlists, early access, stats |

Source: `SUBSCRIPTION_LIMITS` in `src/lib/constants/subscriptionLimits.ts`.

## Notification categories by role

| Role | Categories (`types/notification.ts`) |
|------|--------------------------------------|
| Listener | `subscription_expiring`, `new_release` |
| Artist | `account_approval`, `account_rejection`, `monthly_payout` |
| Support/Admin | `new_ticket`, `artist_verification_request` |

## Player requirements checklist

| Requirement | Type / store field |
|-------------|-------------------|
| Progress bar | `PlayerState.progressSeconds` |
| Play / pause / next / prev | player store actions |
| Volume slider | `PlayerState.volume` |
| Queue view | `PlayerState.queue` |
| Repeat: none / all / one | `RepeatMode` |
| Shuffle on/off | `PlayerState.shuffle` |
| Cover art + lyrics | `TrackSummary` / `Track` |
| Mobile mini → fullscreen | `PlayerState.isExpanded` |
| Gold stats overlay | subscription check + `Track.stream_count` |

## Grading reminders (from checklist §6.1)

| Item | Points | Our approach |
|------|--------|--------------|
| Code cleanliness | 500 | Follow spec/, Prettier, ESLint |
| Code modifiability | 300 | Types, mock services, layered folders |
| Framework standards | 250 | React hooks, router, Zustand patterns |
| ≥ 10 frontend tests | 200 | See [testing.md](./testing.md) |
| PWA (bonus) | 200 | Optional — document if attempted |

## Phase 2 touchpoints (plan now, build later)

| Frontend type | Backend app |
|---------------|-------------|
| `User`, `Follow` | `apps/users` |
| `Track`, `Album` | `apps/music` |
| `Playlist` | `apps/playlists` |
| `ArtistProfile` | `apps/artists` |
| `UserSubscription` | `apps/subscriptions` |
| `Notification` | `apps/notifications` |
| `SupportTicket` | `apps/tickets` |
| `MonthlyArtistAudit` | `apps/audits` |

Keep field names aligned to reduce integration refactors.
