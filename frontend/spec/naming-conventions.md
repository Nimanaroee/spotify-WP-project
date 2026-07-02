# Naming Conventions

Follow these rules so the codebase reads consistently for all three members and for graders.

## Files and folders

| Kind | Convention | Example |
|------|------------|---------|
| React component | `PascalCase.tsx` | `EmptyState.tsx`, `PlayerBar.tsx` |
| Page | `PascalCase` + `Page` suffix | `HomePage.tsx`, `PlaylistsPage.tsx` |
| Layout | `PascalCase` + `Layout` suffix | `MainLayout.tsx`, `AdminLayout.tsx` |
| Hook | `camelCase` with `use` prefix | `usePlaylists.ts`, `useAuth.ts` |
| Store | `camelCase` + `Store` suffix | `authStore.ts`, `playerStore.ts` |
| Test | same name + `.test.tsx` | `EmptyState.test.tsx` |
| Types | `camelCase.ts` (domain noun) | `user.ts`, `playlist.ts` |
| Constants | `camelCase.ts` | `roles.ts`, `subscriptionLimits.ts` |
| Mock service | `camelCase` + `Service.ts` | `playlistService.ts` |
| Folder (feature) | `kebab-case` or `camelCase` | `components/player/` |

**No** `.js` or `.jsx` in `src/`.

## Components

```tsx
// Default export for pages, layouts, route components
export default function HomePage() { ... }

// Named export OK for small shared components used in one feature module
export function PlaylistCard() { ... }
```

Component name must match the file name.

## Variables and functions

| Kind | Convention | Example |
|------|------------|---------|
| Variables | `camelCase` | `currentTrack`, `isPlaying` |
| Functions | `camelCase` | `fetchPlaylists`, `markAsRead` |
| Constants (runtime) | `SCREAMING_SNAKE_CASE` | `ROLES`, `SUBSCRIPTION_LIMITS` |
| Types / interfaces | `PascalCase` | `User`, `PlaylistTrack` |
| Type-only unions | `PascalCase` | `Role`, `RepeatMode`, `TicketStatus` |
| Enums (avoid if possible) | `PascalCase` + members `PascalCase` | Prefer `as const` objects |

## API and domain field names

Use **snake_case** on types that mirror backend JSON:

```ts
interface User {
  id: number
  display_name: string
  subscription_tier: SubscriptionTier
  created_at: string
}
```

Use **camelCase** for pure frontend state (player UI, form temp values):

```ts
interface PlayerState {
  isPlaying: boolean
  repeatMode: RepeatMode
  progressSeconds: number
}
```

When sending to the API in Phase 2, match backend serializer field names (usually snake_case).

## Routes

| Rule | Example |
|------|---------|
| Paths are kebab-case, plural nouns | `/playlists`, `/albums`, `/settings` |
| Dynamic segments | `/artists/:artistId`, `/albums/:albumId` |
| Admin/support under prefix | `/admin/auditing`, `/admin/tickets` |
| Auth | `/login`, `/register`, `/forgot-password` |

Define route path constants in `src/lib/constants/routes.ts` (create when adding routes):

```ts
export const ROUTES = {
  HOME: '/',
  PLAYLISTS: '/playlists',
  ADMIN_AUDITING: '/admin/auditing',
} as const
```

Use constants in `<Link to={...}>` and `navigate()` — no magic strings scattered in JSX.

## CSS / Tailwind

- Prefer Tailwind utility classes in JSX.
- Extract repeated patterns to components, not copy-pasted class strings.
- Custom shared classes (if any) go in `index.css` with clear names: `.player-progress-thumb`.

## localStorage keys

| Rule | Example |
|------|---------|
| snake_case | `users`, `playlists`, `subscription_pricing` |
| Prefix app-specific if needed | `music_app_auth` |
| Document every key in [state-and-data.md](./state-and-data.md) |

## Git branches

See [git-workflow.md](./git-workflow.md). Pattern: `feat/playlists-page`, `fix/player-shuffle`.

## Comments referencing the course spec

Use the section number from the project PDF:

```tsx
/**
 * PlaylistsPage — create, rename, delete playlists
 * Spec reference: §2.7
 */
```

Use `§2.x` format consistently in file headers.
