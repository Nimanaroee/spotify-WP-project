# Spotify-like Music Streaming Platform

A full-stack music streaming platform inspired by Spotify. It pairs a React + TypeScript client with a Django REST API for music discovery, playback tracking, playlists, artist publishing, profiles, subscriptions, support, and administration.

## Features

- **JWT authentication:** listener and artist registration, login, logout, and token refresh.
- **Role-aware access:** listener, artist, support, and admin routes are protected in both the UI and API.
- **Music discovery:** home recommendations, album browsing, catalog search and sorting, and album detail pages.
- **Playback tracking:** a persistent player bar and API-backed stream tracking with subscription and early-access rules.
- **Playlists:** create, rename, delete, upload cover art, and add or remove tracks. Playlist limits follow the active subscription tier.
- **Profiles and social features:** editable listener and artist profiles, avatar uploads, public profiles, and follow/unfollow relationships.
- **Artist Studio:** approved artists can publish, edit, and remove albums or singles with cover art and audio uploads.
- **Notifications:** an in-app inbox with read, mark-all-read, and delete actions.
- **Subscriptions and payments:** Basic, Silver, and Gold plans; public pricing; subscription management; and a Zarinpal payment integration.
- **Support and administration:** support tickets, artist-verification review, monthly artist audits and settlements, subscription pricing, and revenue reporting.
- **English and Persian UI:** RTL support, Persian typography, and light/dark themes.
- **Responsive UI:** layouts built with Material UI, Tailwind CSS utilities, and Vite.
- **API documentation:** OpenAPI schema, Swagger UI, and ReDoc are available when the backend is running.

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React 18, Vite 4, TypeScript |
| UI | Material UI, Tailwind CSS, Lucide icons |
| Routing and state | React Router 6, Zustand |
| Forms and validation | React Hook Form, Zod |
| Testing | Vitest, Testing Library, pytest |
| Backend | Django, Django REST Framework, Simple JWT |
| API documentation | drf-spectacular (OpenAPI, Swagger UI, ReDoc) |
| Development containers | Docker Compose, Node 20, Python 3.12 |
| Database in Compose | SQLite in a persistent Docker volume |

## Quick Start with Docker Compose

### Prerequisites

- Docker Desktop (or Docker Engine with the Compose plugin)
- Ports `5173` and `8000` available on your machine

From the repository root, build the images and start both development services:

```bash
docker compose up --build
```

Open these URLs once the services are ready:

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Django API | `http://localhost:8000` |
| Swagger UI | `http://localhost:8000/api/docs/` |
| ReDoc | `http://localhost:8000/api/redoc/` |
| OpenAPI schema | `http://localhost:8000/api/schema/` |
| Django admin | `http://localhost:8000/admin/` |

The backend runs migrations automatically each time the Compose service starts. Stop the stack with `Ctrl+C`, then remove the containers and network with:

```bash
docker compose down
```

To run it in the background, use:

```bash
docker compose up --build -d
docker compose logs -f
```

### What Docker Compose Starts

| Service | Purpose | Host port |
| --- | --- | --- |
| `frontend` | Vite development server for the React application | `5173` |
| `backend` | Django development server and REST API | `8000` |

Compose bind-mounts `frontend/` and `backend/` into their containers, so source-code changes are reflected during development without rebuilding the images. The frontend uses polling to make file watching reliable in Docker.

Two named volumes are also used:

- `sqlite_data` stores the Compose SQLite database at `/app/data/db.sqlite3`, preserving backend data across container restarts.
- `frontend_node_modules` keeps container-installed Node packages separate from the host project files.

To inspect the running services:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

To run Django commands inside the backend container:

```bash
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py seed_demo_data
docker compose exec backend pytest
```

To run frontend checks inside its container:

```bash
docker compose exec frontend npm run typecheck
docker compose exec frontend npm run lint
docker compose exec frontend npm run test -- --run
```

### Demo Accounts

After the stack is running, create API demo data with:

```bash
docker compose exec backend python manage.py seed_demo_data
```

All seeded accounts use the password `password123`.

| Role | Email |
| --- | --- |
| Listener | `listener@example.com` |
| Silver listener | `silver@example.com` |
| Gold listener | `gold@example.com` |
| Approved artist | `artist.approved@example.com` |
| Pending artist | `artist.pending@example.com` |
| Support | `support@example.com` |
| Admin | `admin@example.com` |

`seed_demo_data` is safe to run again; it creates missing demo records and preserves existing records.

### Resetting Compose Data

`docker compose down` preserves the database. To remove the containers **and** the persisted SQLite and Node module volumes, run:

```bash
docker compose down -v
```

This permanently removes data created in the Compose database. Start the stack again and rerun `seed_demo_data` to restore the sample backend data.

### Docker Compose Environment

The Compose file provides development-safe values for the backend and frontend, including:

- `DJANGO_SETTINGS_MODULE=config.settings.dev`
- SQLite database URL pointing to the persistent `sqlite_data` volume
- CORS and frontend URL settings for `http://localhost:5173`
- `VITE_API_BASE_URL=http://localhost:8000/api/v1`

The Compose `environment` settings take precedence over values in `backend/.env`. For non-Compose development, copy `backend/.env.example` to `backend/.env` and adjust it as needed. Do not commit real secrets or payment credentials.

### Troubleshooting

- **A port is already in use:** stop the conflicting program or change the corresponding mapping in `docker-compose.yml`.
- **Changes are not appearing:** verify the service is running with `docker compose ps`; if dependencies changed, rebuild with `docker compose up --build`.
- **Start over with a clean database:** use `docker compose down -v`, then start the stack and run `seed_demo_data`.
- **See a startup error:** inspect the relevant service with `docker compose logs backend` or `docker compose logs frontend`.

## Local Development Without Docker

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
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

Use Python 3.12 or a compatible Python version:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

Optional backend setup commands:

```bash
python manage.py createsuperuser
python manage.py seed_demo_data
pytest
```

The local frontend defaults to `http://localhost:8000/api/v1`, which matches the backend development server.

## Project Structure

```text
.
├── docker-compose.yml         # Frontend and backend development services
├── frontend/
│   ├── spec/                  # Architecture and team conventions
│   ├── src/
│   │   ├── components/        # Shared and feature UI components
│   │   ├── layouts/           # Main and admin shells
│   │   ├── lib/api/           # API client and domain service modules
│   │   ├── pages/             # Route-level pages
│   │   ├── routes/            # Router and role guard
│   │   ├── store/             # Zustand stores
│   │   ├── theme/             # MUI theme, RTL cache, and contexts
│   │   └── types/             # Domain TypeScript models
│   └── package.json
└── backend/
    ├── config/                # Django settings and URL configuration
    ├── user/                  # Authentication, profiles, preferences, follows
    ├── music/                 # Catalog, releases, playlists, playback
    ├── notifications/         # Notification inbox
    ├── management/            # Tickets, audits, verification, pricing
    ├── payment/               # Subscription payment flow
    └── requirements.txt
```

## API Overview

All application endpoints are versioned under `/api/v1/`. Authentication uses an access token in the `Authorization: Bearer <access-token>` header. The frontend API client saves and refreshes JWTs automatically.

Key endpoint groups:

| Area | Base path |
| --- | --- |
| Authentication | `/api/v1/auth/` |
| User profiles, preferences, subscriptions | `/api/v1/users/` |
| Music catalog, releases, playlists | `/api/v1/music/` |
| Notifications | `/api/v1/notifications/` |
| Support, verification, audits, pricing | `/api/v1/management/` |
| Subscription fees | `/api/v1/subscription/` |
| Payments | `/api/v1/payment/` |

For request and response details, use Swagger UI at `/api/docs/` after starting the backend.

## Roles and Main Routes

| Role | Main areas |
| --- | --- |
| Listener | Home, albums, playlists, profile, notifications, settings |
| Artist | Listener areas plus Artist Studio |
| Support | Ticket queue, artist verification, and monthly auditing |
| Admin | Support areas plus subscription pricing and revenue management |

Important frontend routes:

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
| Gold | Unlimited playlists, downloads, early access, premium statistics |

Backend limits are configurable through the `MUSIC_*` environment variables in `backend/.env.example`.

## Development Notes

- Read `frontend/spec/README.md` before changing frontend architecture or feature conventions.
- Keep frontend API calls in `frontend/src/lib/api/` and domain models in `frontend/src/types/`.
- Keep route access rules centralized in `frontend/src/routes/router.tsx` and `RoleGuard.tsx`.
- Browser `localStorage` holds the frontend session tokens and user preferences such as theme and language; application records are managed by the Django API.
- Uploaded media is served by Django in development. Configure durable media storage and production-safe settings before deploying.
