# Feedback 0049 — Lint issue fails CI pipeline

| Field | Value |
|-------|-------|
| Ticket | `0049` |
| Feedback id | `s5P-_i1IaGHC3t49zVNAH` |
| Type | `bug` |
| Title | Lint issue fails CI pipeline |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

Root `npm run lint` (GitHub Actions CI on `deploy_staging`) fails with exit code 1. The failure is an ESLint **error** in the Media frontend: `react-hooks/rules-of-hooks` on `SelectorPage.tsx` — a `useEffect` runs after an early return, so hooks are conditional.

## Problem / goal

**Problem:** CI’s Lint step fails the whole pipeline, blocking staging deploy confidence.

**Goal:** Fix the rules-of-hooks violation so `npm run lint` exits 0 for `@webonone/media-frontend` (and thus the monorepo lint workspace chain no longer fails on that error).

## Acceptance criteria

1. **`SelectorPage`** — No hook is called after a conditional early return. All `useEffect` / hooks run in the same order every render.
2. **Lint** — `npm run lint -w @webonone/media-frontend` reports **0 errors**.
3. **Behavior** — When `listPage` + `parentOrigin` + content node are set, the page still posts `CONTENT_SIZE` height to the parent (ResizeObserver). Waiting-for-auth embed spinner still shows when embedded without a token.
4. **CI** — Root `npm run lint` no longer fails because of Media `SelectorPage` (other workspaces may still print warnings; warnings alone must not fail Media).

## Services affected

| Area | Change |
|------|--------|
| `media/frontend` | Fix conditional `useEffect` in `SelectorPage.tsx` |
| `spec/0049/` | This package |

## Out of scope

- Cleaning unrelated `react-hooks/exhaustive-deps` **warnings** in other services
- Product/feature UI changes beyond restoring valid hook order
- Setting Support status `closed`

## Verification

```bash
npm run lint -w @webonone/media-frontend
npm run type-check -w media-root
```
