# Routing and Access Control

## Router setup

- Central router: `src/routes/router.tsx`
- Nested routes use layouts via React Router `<Outlet />`.
- Several app pages wrap themselves with `MainLayout` in their route element or page component. Admin pages are nested under `AdminLayout`.
- Lazy-load heavy admin pages when the bundle grows: `lazy(() => import('../pages/admin/AuditingPage'))`.

## Planned route map

Update this table as routes are implemented. Mark done with ✅.

| Path | Page | Layout | Roles | Spec |
|------|------|--------|-------|------|
| `/login` | LoginPage | page shell | public | §2.1 ✅ |
| `/register` | RegisterPage | page shell | public | §2.1 ✅ |
| `/forgot-password` | ForgotPasswordPage | page shell | public | §2.1 ✅ |
| `/` | HomePage | MainLayout | authenticated via page redirect | §2.2 ✅ |
| `/manage` | ManagePage | MainLayout | listener, artist | §2.3 ✅ |
| `/profile/:username` | UserProfilePage | MainLayout | listener, artist, support, admin | §2.3 / §2.4 ✅ |
| `/settings` | SettingsPage | MainLayout | listener, artist, support, admin | §2.5 ✅ |
| `/notifications` | NotificationsPage | MainLayout | listener, artist, support, admin | §2.6 ✅ |
| `/playlists` | PlaylistsPage | MainLayout | listener, artist, support, admin | §2.7 ✅ |
| `/albums` | AlbumsPage | MainLayout | listener, artist, support, admin | §2.8 ✅ |
| `/albums/:albumId` | AlbumDetailPage | MainLayout | listener, artist, support, admin | §2.8 ✅ |
| `/artist/studio` | ArtworkManagementPage | MainLayout | artist | §2.10 ✅ |
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
    <RoleGuard allowedRoles={[ROLES.ARTIST]}>
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
3. Artist-only routes may optionally check `isVerifiedArtist(userId)` via `requireVerifiedArtist` on `RoleGuard` (reads `artist_profiles` in mock storage). The current Artist Studio page also performs its own verified-artist check and shows a warning state for unverified artists.

## Layout switching by role

| Role | Main nav highlights |
|------|---------------------|
| Listener | Home, Playlists, Albums, Profile, Settings |
| Artist | Above + Artist Studio (if verified) |
| Support | Main nav includes Home, Playlists, Albums, Admin, Settings; admin sidebar includes Tickets and Auditing |
| Admin | Support nav + Subscription pricing |

Implement nav config as data — do not duplicate sidebar markup per role.

Suggested: `src/lib/constants/navItems.ts`

```ts
export const MAIN_NAV = [
  { label: 'Home', path: ROUTES.HOME, roles: [ROLES.LISTENER, ROLES.ARTIST, ROLES.SUPPORT, ROLES.ADMIN] },
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

- Rendered once in `App.tsx` after `Router`, not inside individual pages.
- Persists across route changes and is shown when a user is authenticated.
- State from `playerStore`.

## Deep links from notifications

Notifications include optional `link` field — route paths must match this table (e.g. `/albums/5`, `/admin/tickets/12`).
