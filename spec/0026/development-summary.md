# Development summary — Feedback 0026

| Field | Value |
|-------|-------|
| Ticket | `0026` |
| Feedback id | `rIOMTknVNhH17MIo79z-Q` |
| Title | Issue in item list page mobile view |
| Type | `bug` |
| Completed | 2026-10-05 |

## What was delivered

On mobile-width web list toolbars and native list toolbars, tapping Search while Add is expanded now expands the search field and collapses Add. The outside-press path no longer collapses Add on `pointerdown` before Search’s click (web), and native Search presses correctly mark the toolbar as inside so outside dismiss cannot cancel the open.

## Where to see it

| Surface | Path |
|---------|------|
| Staging (any collection list) | Narrow viewport → Tags / Units / Templates / etc. → expand Add → tap Search |
| Local web | `npm run dev:data` (or any list service) → resize below `sm` → same flow |
| Local native | `npm run mobile` → list screen with Search + Add → same flow |

## Feature details

- Web: in-header/in-toolbar Add collapse is deferred (`setTimeout(0)`) so Search `open()` runs before layout shift; true outside presses still collapse Add and close Search immediately.
- Native: compact Search no longer stops touch propagation before `ListPageActions` `markInsidePress`; inside-press flag clears after outside handlers’ `setTimeout(0)`.
- Mutual exclusivity via existing `open` / `openSearch` / `expandAdd` unchanged for Escape and outside dismiss.

## Code and docs touched

| Root | Key paths |
|------|-----------|
| `ui-kit/package` | `layouts/PageHeader.tsx`, `components/ListPageActions.tsx` |
| `packages/mobile-ui` | `components/SearchInput.tsx`, `components/ListPageActions.tsx`, `components/ListAddButton.tsx` |
| `spec/0026/` | `spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run type-check -w @webonone/ui-kit
npm run lint -w @webonone/ui-kit
npm run type-check -w @webonone/mobile-ui
```

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0026: fix mobile list Search when Add expanded` |
| CI | Push runs `.github/workflows/deploy-staging.yml` |

## Support status

`staging` after successful push (`closed` remains super admin).
