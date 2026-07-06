# Routing and Access Control

## Router setup

- Central router: `src/routes/router.tsx`
- Nested routes use layouts via React Router `<Outlet />`.
- Lazy-load heavy admin pages when the bundle grows: `lazy(() => import('../pages/admin/AuditingPage'))`.

## Planned route map

Update this table as routes are implemented. Mark done with ✅.

| Path | Page | Layout | Roles | Spec |
|------|------|--------|-------|------|
| `/login` | LoginPage | AuthLayout | public | §2.1 |
| `/register` | RegisterPage | AuthLayout | public | §2.1 |
| `/forgot-password` | ForgotPasswordPage | AuthLayout | public | §2.1 |
| `/` | HomePage | MainLayout | listener, artist | §2.2 |
| `/manage` | ManagePage | page wraps own shell | listener | §2.3 ✅ |
| `/profile/:username` | UserProfilePage | page wraps own shell | all authenticated | §2.3 |
| `/artists/:artistId` | ArtistProfilePage | MainLayout | all authenticated | §2.4 |
| `/settings` | SettingsPage | MainLayout | all authenticated | §2.5 |
| `/notifications` | NotificationsPage | none (full-page) | listener, artist, support, admin | §2.6 ✅ |
| `/playlists` | PlaylistsPage | MainLayout | listener (+ artist as listener) | §2.7 |
| `/albums` | AlbumsPage | MainLayout | listener, artist | §2.8 |
| `/albums/:albumId` | AlbumDetailPage | MainLayout | listener, artist | §2.8 |
| `/artist/studio` | ArtworkManagementPage | MainLayout | artist (verified) | §2.10 ✅ |
| `/admin` | redirect → `/admin/tickets` | AdminLayout | support, admin | §2.11 ✅ |
| `/admin/tickets` | TicketsPage (tickets + verification tabs) | AdminLayout | support, admin | §2.11.1 ✅ |
| `/admin/tickets/:ticketId` | TicketDetailPage | AdminLayout | support, admin | §2.11.1 ✅ |
| `/admin/verification/:requestId` | VerificationDetailPage | AdminLayout | support, admin | §2.11.1 ✅ |
| `/admin/auditing` | AuditingPage | AdminLayout | support, admin | §2.11.2 ✅ |
| `/admin/subscriptions` | SubscriptionAdminPage | AdminLayout | **admin only** | §2.11.3 ✅ |

## RoleGuard

`src/routes/RoleGuard.tsx` wraps routes that require specific roles.

```tsx
<Route
  path={ROUTES.ARTIST_STUDIO}
  element={
    <RoleGuard allowedRoles={[ROLES.ARTIST]} requireVerifiedArtist>
      <MainLayout>
        <ArtworkManagementPage />
      </MainLayout>
    </RoleGuard>
  }
/>
```

```tsx
<Route
  element={
    <RoleGuard allowedRoles={[ROLES.ADMIN]}>
      <AdminLayout />
    </RoleGuard>
  }
>
  <Route path="/admin/subscriptions" element={<SubscriptionAdminPage />} />
</Route>
```

Behavior:

1. No user → redirect to `/login` (preserve `returnUrl`).
2. User role not in `allowedRoles` → redirect to `/` or `/403`.
3. Artist-only routes → also check `isVerifiedArtist(userId)` via `requireVerifiedArtist` on `RoleGuard` (reads `artist_profiles` in mock storage).

## Layout switching by role

| Role | Main nav highlights |
|------|---------------------|
| Listener | Home, Playlists, Albums, Profile, Settings |
| Artist | Above + Artist Studio (if verified) |
| Support | Admin sidebar: Tickets (includes verification tab), Auditing |
| Admin | Support nav + Subscription pricing |

Implement nav config as data — do not duplicate sidebar markup per role.

Suggested: `src/lib/constants/navItems.ts`

```ts
export const MAIN_NAV = [
  { label: 'Home', path: ROUTES.HOME, roles: [ROLES.LISTENER, ROLES.ARTIST] },
  ...
] as const
```

Filter by `user.role` when rendering.

## Subscription-based UI (not role)

Some features depend on **subscription tier**, not role:

| Feature | Tier required |
|---------|---------------|
| Upload profile picture | silver, gold |
| Early access section on home | gold |
| Stats on artist profile / player | gold |
| Download button | silver, gold |

Use `SUBSCRIPTION_LIMITS[tier]` — do not hardcode tier checks in many places. Optional helper:

```ts
function canUseFeature(tier: SubscriptionTier, feature: keyof SubscriptionTierLimits): boolean
```

## Notification panel

- `NotificationPanel` lives in `MainLayout` and `AdminLayout` app bars (unread badge + quick list).
- Full inbox: `/notifications` (`NotificationsPage`).
- Shared state: `notificationStore` (loaded in `App.tsx` when auth user changes).

## Player bar

- Rendered inside `MainLayout` (and optionally full-screen overlay on mobile).
- Persists across route changes — lives in layout, not individual pages.
- State from `playerStore`.

## Deep links from notifications

Notifications include optional `link` field — route paths must match this table (e.g. `/albums/5`, `/admin/tickets/12`).
