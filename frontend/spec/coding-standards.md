# Coding Standards

## TypeScript

- `strict: true` is enabled — do not weaken it.
- Avoid `any`. Use `unknown` + narrowing, or a proper type from `src/types/`.
- Prefer `interface` for object shapes; use `type` for unions and utility types.
- Export types from `src/types/index.ts` when used outside the defining file.
- Unused parameters: prefix with `_` (ESLint allows this).

```ts
function RoleGuard({ allowedRoles: _allowedRoles, children }: Props) { ... }
```

## Imports

Order (blank line between groups):

1. React / third-party libraries
2. Absolute-ish project imports (`../types`, `../store/...`)
3. Relative sibling imports (`./PlaylistCard`)

Use `import type` for type-only imports:

```ts
import type { User } from '../types'
import type { ReactNode } from 'react'
```

Do not use path aliases (e.g. `@/components`) until the team adds them to `tsconfig` together.

## React

### Components

- Function components only (no class components).
- Props: inline type or `interface Props` above the component.
- Keep components focused; extract when a file exceeds ~150 lines.
- Destructure props in the signature.

### Hooks

- Custom hooks start with `use`.
- One hook per file in the same folder as the feature or in `hooks/` if shared.

### Effects

- Prefer derived state over `useEffect` when possible.
- Document why an effect runs (comment only if non-obvious).

### Forms

- React Hook Form + Zod resolver for login, register, settings, admin forms.
- Zod schemas can live next to the page: `LoginPage.schema.ts`.

## Styling

- Material UI theme tokens are the source of truth for colors and component defaults.
- Dark mode must stay black/purple; light mode must stay pink/white.
- Theme-aware surfaces should use `background.default`, `background.paper`, `text.primary`, and `text.secondary`.
- Every interactive element needs visible focus/hover states.
- Mobile-first: base styles for mobile, then `md:` / `lg:` overrides.

### Theme usage

- Define palette changes only in `src/theme/appTheme.ts`.
- Read and toggle theme mode via `useThemeMode` from `src/theme/ThemeModeContext.tsx`.
- Use `ThemeToggleButton` instead of creating one-off toggle controls.
- Keep new pages visually consistent by starting their root wrapper with:

```tsx
<Box className="min-h-screen p-6" sx={{ bgcolor: 'background.default' }}>
  ...
</Box>
```

- If a decorative gradient is needed, derive it from `theme.palette.mode` inside `sx`.

## Accessibility

- Buttons and links must be keyboard reachable.
- Images need `alt` text (song/album title or "Album cover for …").
- Icon-only buttons need `aria-label`.

## Error and empty states

- Lists with no data → use `EmptyState` from `components/common/`.
- Failed mock/API calls → show user-friendly message, not raw errors.
- Loading → simple skeleton or spinner; consistent across the app.

## File header comment

Every **page**, **layout**, and **store** file should start with:

```tsx
/**
 * <ComponentName> — one-line description
 * Spec reference: §2.x
 *
 * Responsibilities:
 *  - [ ] task 1
 *  - [ ] task 2
 */
```

Update checkboxes as you complete work. Stub files already follow this pattern — keep it.

## What not to do

- No inline `style={{ ... }}` except dynamic values (e.g. progress bar width).
- No `console.log` in committed code (use temporarily while debugging, remove before PR).
- No commented-out blocks left in PRs.
- No duplicate type definitions — import from `src/types/`.
- No business logic in `router.tsx` — use guards and page-level logic.

## Formatting

Prettier config (`.prettierrc`):

- Single quotes
- Semicolons

Run format in your editor on save. ESLint + TypeScript must pass before merge.

## Dependencies

Do not add new npm packages without team agreement. Prefer existing stack:

- Already included: `axios`, `zustand`, `react-hook-form`, `zod`, `date-fns`, `recharts`, `lucide-react`.

If you need a player library, discuss in the group first and document the choice in this spec folder.
