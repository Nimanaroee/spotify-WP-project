# Git Workflow

Three-person team — keep history readable and avoid merge conflicts on large files.

## Branch naming

```
feat/<short-description>     # new feature
fix/<short-description>      # bug fix
refactor/<short-description> # no behavior change
docs/<short-description>     # spec or README only
test/<short-description>     # tests only
```

Examples:

- `feat/playlists-page`
- `feat/music-player-queue`
- `fix/role-guard-redirect`
- `docs/spec-routing`

Branch from latest `main` (or your team's default branch):

```bash
git checkout main
git pull
git checkout -b feat/playlists-page
```

## Commit messages

Use imperative mood, one logical change per commit when possible:

```
Add playlist empty state component

Enforce basic tier playlist limit in mock service
```

Optional prefix for clarity:

```
feat(playlists): add create playlist modal
fix(player): correct shuffle queue order
docs(spec): document localStorage keys
```

Do not commit:

- `node_modules/`, `dist/`, `.env.local`
- Unrelated formatting-only changes mixed with features

## Pull request process

1. Run `npm run verify` locally.
2. Push branch and open PR.
3. Fill PR template (create if missing):
   - **Spec section** (e.g. §2.7)
   - **Summary** — what changed
   - **Screenshots** — for UI changes (desktop + mobile)
   - **Test plan** — checklist
4. Request review from **at least one** teammate.
5. Address comments; re-run verify after fixes.
6. Squash or merge per team preference — stay consistent.

## Dividing work (suggested)

| Member focus | Areas | Spec sections |
|--------------|-------|---------------|
| A | Auth, home, profile, settings | §2.1–§2.5 |
| B | Playlists, albums, player | §2.7–§2.9 |
| C | Artist studio, admin dashboard, notifications | §2.6, §2.10, §2.11 |

Adjust based on strengths — but **everyone must touch multiple areas** (course requirement).

## Avoiding conflicts

- Do not edit the same page in two branches without coordinating.
- Shared files (`router.tsx`, `MainLayout.tsx`, `seed.ts`) — merge often from `main`.
- Add routes in `router.tsx` in separate commits or communicate order.
- New types: add in `src/types/` in small PRs first if multiple features depend on them.

## Sync with backend team (Phase 2)

- Log API needs in repo-root `docs/backend-requirements.md`.
- When an endpoint is ready, integrate in a dedicated `feat/api-playlists` branch.
- Do not change type field names without syncing both sides.

## Definition of done (per feature)

- [ ] Implements course spec section behavior
- [ ] Responsive (mobile + desktop checked)
- [ ] Uses types from `src/types/`
- [ ] Role/subscription rules enforced where applicable
- [ ] Empty/error states handled
- [ ] Tests added or updated
- [ ] `npm run verify` passes
- [ ] Spec reference in file header
- [ ] PR reviewed by teammate
