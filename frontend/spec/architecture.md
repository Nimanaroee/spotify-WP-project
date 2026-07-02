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
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Charts (admin) | Recharts |
| Tests | Vitest + Testing Library |

## Folder layout

```
frontend/
├── spec/                    # Team conventions (this folder)
├── public/                  # Static assets (default avatar, cover)
├── scripts/                 # verify.sh and tooling
└── src/
    ├── main.tsx             # App entry
    ├── App.tsx              # Root providers + router
    ├── index.css            # Tailwind directives + global styles
    ├── components/          # Reusable UI
    │   ├── common/          # EmptyState, Button, Modal, ...
    │   ├── layout/          # Sidebar, Navbar, PlayerBar, ...
    │   └── <feature>/       # Feature-specific components
    ├── layouts/             # Page shells (MainLayout, AdminLayout, ...)
    ├── pages/               # Route-level screens (one folder per page if large)
    ├── routes/              # router.tsx, RoleGuard.tsx
    ├── store/               # Zustand stores (authStore, playerStore, ...)
    ├── types/               # Domain TypeScript models
    ├── lib/
    │   ├── api/             # Axios client, endpoint helpers (Phase 2)
    │   ├── constants/       # roles, subscription limits, route paths
    │   └── mock/            # localStorage wrapper, seed, mock services
    └── setupTests.ts
```

## Layer rules

### Pages (`src/pages/`)

- One default export per page component.
- Pages compose layouts + feature components; keep business logic thin.
- Fetch/mock data here or via a dedicated hook in the same folder (`usePlaylists.ts`).

### Components (`src/components/`)

- **common/** — used across multiple features (buttons, empty states, modals).
- **layout/** — shell pieces shared by layouts (sidebar links, player bar).
- **&lt;feature&gt/** — only used by one feature area (e.g. `components/player/ProgressBar.tsx`).

Do not import page components from other pages. Share via `components/` or `lib/`.

### Layouts (`src/layouts/`)

- Wrap `<Outlet />` (React Router) or `children`.
- **MainLayout** — listener/artist: sidebar + navbar + bottom player.
- **AdminLayout** — support/admin dashboard with its own sidebar.
- Layouts read auth role and render the correct navigation set.

### Store (`src/store/`)

- One Zustand store per domain: `authStore`, `playerStore`, `notificationStore`.
- Stores hold **client state** and **cached server/mock data** when shared across routes.
- Prefer local `useState` for UI-only state (open/closed modals).

### Types (`src/types/`)

- All domain entities and API payloads live here.
- See [types-and-models.md](./types-and-models.md).

### Mock layer (`src/lib/mock/`) — Phase 1 only

- `storage.ts` — typed localStorage access.
- `seed.ts` — initial demo data on first load.
- `services/` (add as needed) — functions that mimic future API calls (`playlistService.create`).

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

## Phase boundaries

| Phase 1 (now) | Phase 2 (later) |
|-----------------|-----------------|
| Mock data in localStorage | Django REST API |
| Payment page UI stub only | Real payment gateway |
| Admin price form updates mock | Admin price form hits backend |
| No file uploads to server | Upload songs/images to backend |

Build Phase 1 abstractions (types, service interfaces, stores) so Phase 2 is mostly wiring.
