# Spotify-like Music Streaming Platform

A full-stack music streaming project inspired by Spotify. The app supports listeners,
artists, support staff, and admins with role-aware navigation, music discovery,
playlist management, profile management, notifications, artist publishing tools, and
admin workflows.

The current frontend is a rich Phase 1 implementation backed by typed mock services
and `localStorage`. The backend is a Django REST API scaffold that mirrors the same
domain areas for Phase 2 integration.

## Features

- **Authentication:** login, registration, forgot-password flow, persisted mock session.
- **Role-based access:** listener, artist, support, and admin routes are guarded with `RoleGuard`.
- **Music discovery:** home showcase, `/albums` catalog search/sort, album detail pages, songs and albums.
- **Persistent player:** global player bar with queue/progress controls that stays active across pages.
- **Playlists:** create, rename, delete, enforce subscription limits, and add/remove songs.
- **Profiles:** public profile pages, follow/unfollow, tabbed followers/following lists, editable manage page.
- **Artist tools:** verified artists can publish, edit, and delete releases from Artist Studio.
- **Notifications:** notification panel plus full inbox with role-specific notification categories.
- **Settings:** theme, language, account preferences, and subscription preview/update flow.
- **Admin dashboard:** support tickets, artist verification, monthly auditing, and subscription pricing admin.
- **Subscriptions:** Basic, Silver, and Gold tiers control playlist limits, profile pictures, downloads, early access, and stats.
- **Bilingual UI:** English and Persian UI copy, RTL layout support, and Persian font support.
- **Responsive design:** desktop, tablet, and mobile layouts using Material UI and Tailwind utilities.

## How It Works

### Frontend

The frontend is a React + Vite + TypeScript app in `frontend/`.

- `src/App.tsx` seeds demo data, restores auth, loads notifications, applies theme/language providers, and renders the global player.
- `src/routes/router.tsx` defines public, authenticated, artist, support, and admin routes.
- `src/layouts/MainLayout.tsx` and `src/layouts/AdminLayout.tsx` provide role-specific shells and navigation.
- `src/store/` contains shared Zustand state such as auth, notifications, catalog refresh, layout, and player state.
- `src/lib/mock/` contains typed mock services that read/write through the storage wrapper instead of direct `localStorage` access.
- `src/types/` contains shared domain models for users, music, playlists, notifications, subscriptions, admin data, and support data.
- `src/lib/constants/*Text.ts` stores English/Persian page copy so UI text stays centralized.

Phase 1 data flow:

```text
Page/component → Zustand or mock service → storage wrapper → localStorage → UI refresh
```

Phase 2 target flow:

```text
Page/component → service/API client → Django REST API → serializer/model → UI refresh
```

### Backend

The backend is a Django project in `backend/` with apps aligned to the frontend
domains:

- `users`
- `artists`
- `music`
- `playlists`
- `notifications`
- `tickets`
- `audits`
- `subscriptions`
- `core`

It is intended to replace the mock frontend services with real API calls while
keeping frontend types and service boundaries stable.

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React 18, Vite 4, TypeScript |
| Routing | React Router 6 |
| State | Zustand |
| UI | Material UI, Tailwind CSS, Lucide icons |
| Forms | React Hook Form, Zod |
| Charts | Recharts |
| Tests | Vitest, Testing Library |
| Backend | Django, Django REST Framework |
| Phase 1 data | `localStorage` mock services |

## Project Structure

```text
.
├── frontend/
│   ├── spec/                  # Team architecture and feature specifications
│   ├── src/
│   │   ├── components/        # Shared and feature UI components
│   │   ├── layouts/           # Main and admin shells
│   │   ├── lib/               # constants, mock services, API client placeholder
│   │   ├── pages/             # Route-level pages
│   │   ├── routes/            # Router and role guard
│   │   ├── store/             # Zustand stores
│   │   ├── theme/             # MUI theme, RTL cache, language/theme contexts
│   │   └── types/             # Domain TypeScript models
│   └── package.json
├── backend/
│   ├── apps/                  # Django apps by domain
│   ├── config/                # Django settings/URL config
│   └── requirements.txt
└── docs/
    └── backend-requirements.md
```

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Useful frontend commands:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run verify
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Run backend tests:

```bash
pytest
```

## Demo Data

The frontend seeds demo data on first load through `frontend/src/lib/mock/seed.ts`.
If you need a clean demo state, clear browser `localStorage` and reload the app.

Seeded data includes multiple roles, users, follows, playlists, tracks, albums,
notifications, tickets, artist profiles, verification requests, audits, and
subscription pricing.

## Roles and Main Routes

| Role | Main areas |
| --- | --- |
| Listener | Home, Albums, Playlists, Manage Profile, Notifications, Settings |
| Artist | Listener areas plus Artist Studio for publishing music |
| Support | Admin tickets, verification queue, auditing |
| Admin | Support areas plus subscription pricing management |

Important routes:

- `/login`
- `/register`
- `/`
- `/albums`
- `/albums/:albumId`
- `/playlists`
- `/manage`
- `/profile/:username`
- `/artist/studio`
- `/notifications`
- `/settings`
- `/admin/tickets`
- `/admin/auditing`
- `/admin/subscriptions`

## Subscription Tiers

| Tier | Main behavior |
| --- | --- |
| Basic | 60 streams/day, 6 playlists, no profile-picture upload |
| Silver | Unlimited daily streams, 100 playlists, downloads, profile pictures |
| Gold | Unlimited playlists, downloads, early access, premium stats |

Limits live in `frontend/src/lib/constants/subscriptionLimits.ts`.

## Language and Theme

- English and Persian are supported through app-wide language context.
- Persian mode switches the document to RTL, uses the RTL Emotion cache, and applies the bundled Noto Sans Arabic font.
- Dark/light mode is stored in `localStorage` and generated from `frontend/src/theme/appTheme.ts`.

## Development Notes

- Read `frontend/spec/README.md` before changing frontend architecture or feature conventions.
- Keep user-facing text in locale constants under `frontend/src/lib/constants/`.
- Keep domain shapes in `frontend/src/types/`.
- Use mock services in `frontend/src/lib/mock/`; do not access `localStorage` directly in pages/components.
- Keep route access changes centralized in `frontend/src/routes/router.tsx` and `RoleGuard.tsx`.

## Current Status

The frontend is functional as a Phase 1 mock app. Some quality commands may report
existing TypeScript issues in older MUI usage patterns; these should be cleaned up
as part of stabilization before final delivery.
