# 05 — Remove leftover `sync-data-role` calls (delta)

## Problem

After 1.11.1 removed `POST /api/v1/company/me/sync-data-role` from WebOnOne, **Data frontend** still called that endpoint during:

- Standalone OAuth callback (`AuthCallbackPage`)
- Platform auth-code handoff (`usePlatformSessionBootstrap`)

Result: **404 Not Found** on `http://localhost:4000/api/v1/company/me/sync-data-role`.

## Root cause

Phase 3 removed WebOnOne sync routes and WebOnOne `AppLayout` handoff sync, but **Data service frontend** retained `syncPlatformDataRole.ts` from the 1.11.0 scaffold.

## Required fix

| Area | Action |
|------|--------|
| `data/frontend/src/features/auth/utils/syncPlatformDataRole.ts` | **Delete** |
| `AuthCallbackPage.tsx` | After token exchange, load role via `GET /api/v1/me` (JWT claims) only — no WebOnOne POST |
| `usePlatformSessionBootstrap.ts` | Remove `syncPlatformDataRole` call before `fetchDataRole` |
| Orphan sync utils | Delete unused `email/.../syncPlatformEmailRole.ts`, `identity/.../syncEmailRole.ts` if nothing imports them |

## Acceptance

- Data login and platform handoff succeed without calling WebOnOne `sync-data-role`
- `npm run type-check -w data-root` passes
- No references to `sync-data-role` or `syncPlatformDataRole` in `data/frontend/`

## ClickUp

Subtask **issue in data sync** (86ey5nk8m): roles come from Identity JWT; Data BE `/me` reads `platform_role` from token — no cross-service role sync POST.
