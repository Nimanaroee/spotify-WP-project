# Architecture

## Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 |
| Build | Vite 4 |
| Language | TypeScript (strict) |
| Routing | React Router 6 |
| State | Zustand |
| HTTP (Phase 2) | Axios via `src/lib/api/client.ts` |
| Forms | React Hook Form + Zod |
| Styling | Material UI theme + Tailwind CSS utilities |
| Icons | Lucide React |
| Charts (admin) | Recharts |
| Tests | Vitest + Testing Library |

## Folder layout

```
frontend/
├── spec/                    # Team conventions (this folder)
└── src/
    ├── main.tsx             # App entry
    ├── App.tsx              # Root providers, seed/bootstrap, router, global player
    ├── index.css            # Tailwind directives, font-face, global RTL font styles
    ├── assets/              # Bundled app assets such as local fonts
    ├── theme/               # MUI palette, theme mode, language, RTL Emotion cache
    ├── components/          # Reusable UI
    │   ├── common/          # EmptyState, PageHeader, ThemeToggleButton, ...
    │   ├── player/          # Persistent PlayerBar and player UI
    │   └── <feature>/       # Feature-specific components
    ├── layouts/             # Page shells (MainLayout, AdminLayout, ...)
    ├── pages/               # Route-level screens (one folder per page if large)
    ├── routes/              # router.tsx, RoleGuard.tsx
    ├── store/               # Zustand stores (authStore, playerStore, ...)
    ├── types/               # Domain TypeScript models
    ├── lib/
    │   ├── api/             # Axios client, endpoint helpers (Phase 2)
    │   ├── constants/       # roles, subscription limits, route paths, locale copy
    │   ├── artwork/         # client-side upload helpers (Phase 1: base64 in storage)
    │   └── mock/            # localStorage wrapper, seed, mock services
    └── setupTests.ts
```

Add app-wide language context alongside theme concerns in `src/theme/` so pages can read the active locale without prop drilling. For Persian (`fa`), `App.tsx` swaps Emotion cache direction via `theme/emotionCache.ts` and sets `document.documentElement.dir`.

`App.tsx` also seeds Phase 1 demo data, restores the current mock user, preloads mock media, loads notifications for the signed-in user, and renders `components/player/PlayerBar` outside the router pages so playback persists across route changes.

## Layer rules

### Pages (`src/pages/`)

- One default export per page component.
- Pages compose layouts + feature components; keep business logic thin.
- Fetch/mock data here or via a dedicated hook in the same folder (`usePlaylists.ts`).

### Components (`src/components/`)

- **common/** — used across multiple features (buttons, empty states, modals).
- **player/** — persistent music player and related controls.
- **&lt;feature&gt/** — only used by one feature area (e.g. `components/player/ProgressBar.tsx`).

Do not import page components from other pages. Share via `components/` or `lib/`.

### Layouts (`src/layouts/`)

- Wrap `<Outlet />` (React Router) or `children`.
- **MainLayout** — authenticated app shell for home, playlists, albums, manage, profiles, settings, notifications, and artist studio.
- **AdminLayout** — support/admin dashboard with its own sidebar.
- Layouts read auth role and render the correct navigation set from `src/lib/constants/navItems.ts`.
- The global `PlayerBar` is rendered by `App.tsx`, not by individual layouts.

### Internationalization

- Keep all user-facing text in shared locale modules under `src/lib/constants/`.
- The active language is app-wide state and must persist via `localStorage`.
- Persian (`fa`) switches the app to RTL, uses the RTL Emotion cache, and applies the bundled `Noto Sans Arabic` font from `src/assets/fonts/`.
- Components should read copy from the shared locale module, not inline strings, when the text is user-facing or reused across pages.
- Prefer a single source of truth for translated labels so switching language updates the whole app consistently.

### Store (`src/store/`)

- One Zustand store per shared domain: currently `authStore`, `catalogStore`, `layoutStore`, `notificationStore`, and `playerStore`.
- Stores hold **client state** and **cached server/mock data** when shared across routes.
- Prefer local `useState` for UI-only state (open/closed modals).

### Types (`src/types/`)

- All domain entities and API payloads live here.
- See [types-and-models.md](./types-and-models.md).

### Mock layer (`src/lib/mock/`) — Phase 1 only

- `storage.ts` — typed localStorage access.
- `seed.ts` — initial demo data on first load.
- Feature service files such as `authService`, `playlistService`, `musicService`, `userProfileService`, `artistProfileService`, `notificationService`, `ticketService`, `verificationService`, `auditService`, and `subscriptionAdminService`.
- `mediaCache.ts` — caches/preloads mock media used by the player and catalog.

Phase 2 replaces mock services with real API calls using the **same function signatures** where possible.

## Data flow (Phase 1)

```
Page → hook or store action → mock service → storage (localStorage) → UI update
```

## Data flow (Phase 2)

```
Page → hook or store action → api client → Django REST → serializer → types → UI
```

Design mock services now so swapping the implementation later requires minimal page changes.

## Environment

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Backend base URL (Phase 2). Default: `http://localhost:8000/api/v1` |

Copy `.env.example` to `.env.local` for local overrides. Never commit secrets.

## Responsive breakpoints

Use Tailwind defaults unless we agree otherwise:

| Prefix | Min width |
|--------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |

- **Desktop**: full sidebar + bottom player bar.
- **Tablet**: collapsible sidebar.
- **Mobile**: bottom nav + mini player (expandable to full screen).

## Theme system

The app uses Material UI as the source of truth for color, radius, and component defaults. Tailwind is still allowed for layout, spacing, and responsive utility classes, but do not hardcode page-level colors with Tailwind color classes.

| Mode | Primary palette | Background |
|------|-----------------|------------|
| Dark | black surfaces with purple accents | `#050008`, `#12001f` |
| Light | white/pink surfaces with pink accents | `#fff7fb`, `#ffffff` |

- Theme creation lives in `src/theme/appTheme.ts`.
- Theme mode state and persistence live in `src/theme/ThemeModeContext.tsx`.
- Language state lives in `src/theme/LanguageContext.tsx` and persists with `spotify-wp-app-language`.
- RTL support lives in `src/theme/emotionCache.ts`; `App.tsx` switches caches when language changes.
- Persian typography uses `Noto Sans Arabic` declared in `src/index.css`.
- Use MUI semantic tokens such as `bgcolor: 'background.default'`, `bgcolor: 'background.paper'`, `color: 'text.primary'`, and `color: 'text.secondary'`.
- Use `ThemeToggleButton` from `src/components/common/ThemeToggleButton.tsx` when a page needs to expose theme switching.
- Persist the selected mode with `spotify-wp-theme-mode` in `localStorage`; do not introduce another theme storage key.

## Phase boundaries

| Phase 1 (now) | Phase 2 (later) |
|-----------------|-----------------|
| Mock data in localStorage | Django REST API |
| Payment page UI stub only | Real payment gateway |
| Admin price form updates mock | Admin price form hits backend |
| No file uploads to server | Upload songs/images to backend |
| Artwork audio/cover as base64 in mock storage | Real media storage + CDN URLs |

Build Phase 1 abstractions (types, service interfaces, stores) so Phase 2 is mostly wiring.
