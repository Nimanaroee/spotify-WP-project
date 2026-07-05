# Frontend Specification

This folder is the **single source of truth** for how we build the Phase 1 frontend. Every team member should read these docs before writing code and follow them when adding features.

## Who this is for

- All three group members working on the React + Vite frontend
- Anyone reviewing PRs or writing tests

## How to use these docs

1. Read **architecture** and **naming-conventions** first.
2. Before starting a feature, open **feature-map** and find your section (e.g. §2.7 Playlists).
3. Use **types-and-models** when defining data shapes or mock storage.
4. Follow **git-workflow** for branches, commits, and reviews.
5. Run `npm run verify` (or `./scripts/verify.sh`) before opening a PR.

## Document index

| Document | Purpose |
|----------|---------|
| [architecture.md](./architecture.md) | Folder layout, layers, Phase 1 vs Phase 2 |
| [naming-conventions.md](./naming-conventions.md) | Files, components, variables, routes |
| [coding-standards.md](./coding-standards.md) | TypeScript, React, styling, imports |
| [types-and-models.md](./types-and-models.md) | Domain types, API field naming, payloads |
| [state-and-data.md](./state-and-data.md) | Zustand, localStorage mock, seed data |
| [routing-and-access.md](./routing-and-access.md) | Routes, role guards, layouts |
| [testing.md](./testing.md) | Vitest, Testing Library, minimum coverage |
| [git-workflow.md](./git-workflow.md) | Branches, commits, PR checklist |
| [feature-map.md](./feature-map.md) | Course spec sections → code locations |

## Quick rules (non-negotiable)

- **TypeScript only** in `src/` — no `.js` / `.jsx` files.
- **Strict mode** — no `any` unless documented with a reason.
- **One feature per branch** — keep PRs small and reviewable.
- **Spec reference in file header** — link the course section you implement (see coding-standards).
- **Reuse types from `src/types/`** — do not duplicate interfaces in components.
- **Responsive UI** — every page must work on desktop, tablet, and mobile.
- **Role-aware layouts** — listener, artist, support, and admin see different navigation.
- **Bilingual UI** — English and Persian copy must come from shared locale files and persist per user in `localStorage`.

## Commands

```bash
npm run dev          # local dev server
npm run typecheck    # TypeScript
npm run lint         # ESLint
npm run test         # Vitest (watch)
npm run verify       # typecheck + build + test (CI-like)
```

## When something is missing

If the spec does not cover a decision:

1. Propose the convention in your PR description.
2. Add a short note to the relevant spec file in the same PR.
3. Get approval from at least one other team member before merging.

Do not invent one-off patterns silently — consistency is graded.
