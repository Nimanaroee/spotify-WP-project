# Testing

The course requires **at least 10 frontend tests** for Phase 1. Aim for meaningful coverage, not trivial snapshots.

## Stack

- **Vitest** — test runner (Vite-native)
- **Testing Library** — render components as users interact
- **jsdom** — browser environment

Config lives in `vite.config.ts`. Setup: `src/setupTests.ts`.

## File placement

Co-locate tests with components:

```
src/components/common/EmptyState.tsx
src/components/common/EmptyState.test.tsx
```

Page tests optional but encouraged: `HomePage.test.tsx` next to `HomePage.tsx`.

## Naming

```ts
describe('EmptyState', () => {
  it('renders the message text', () => { ... })
})
```

Test names describe **behavior**, not implementation.

## What to test

| Priority | Target |
|----------|--------|
| High | Shared components (`EmptyState`, buttons, form validation) |
| High | Role/subscription guard logic (pure functions) |
| High | Mock services (playlist limit enforcement, stream cap) |
| Medium | Pages with conditional empty states |
| Medium | Store actions (player queue, shuffle) |
| Low | Layout snapshot-only tests |

## What not to test

- Implementation details (internal state variable names)
- Third-party libraries (React Router, Zustand internals)
- Tailwind class strings unless tied to behavior (aria, disabled)

## Example

```tsx
import { render, screen } from '@testing-library/react'
import EmptyState from './EmptyState'

describe('EmptyState', () => {
  it('shows the provided message', () => {
    render(<EmptyState message="No playlists yet" />)
    expect(screen.getByText('No playlists yet')).toBeInTheDocument()
  })
})
```

## Running tests

```bash
npm test              # watch mode
npm test -- --run     # single run (CI / verify)
npm test EmptyState   # filter by name
```

## Before PR

```bash
npm run verify
```

This runs typecheck, build, and tests — same expectation as CI.

## Coverage goals (team target)

| Area | Minimum tests |
|------|----------------|
| common components | 3+ |
| auth/register forms | 2+ |
| playlist limits | 2+ |
| notifications empty/read | 1+ |
| player controls / queue | 2+ |

Track progress in PR descriptions until we exceed 10 tests total.

## Mocking

- Mock `storage` when testing services — do not rely on real localStorage in unit tests.
- Mock stores with Zustand test pattern or render with providers when testing pages.

```ts
import { vi } from 'vitest'

vi.mock('../lib/mock/storage', () => ({
  storage: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
}))
```
