# Plan — Feedback 0036

## Current behavior

`website/frontend/src/features/website/hooks/useUserLocation.ts` bootstraps once per page. It reads `website.locationPromptDismissed` from `sessionStorage`, then `navigator.permissions.query({ name: 'geolocation' })`.

| Permission result | What happens |
|-------------------|----------------|
| `granted` | `getCurrentPosition` with no in-app dialog |
| `denied` | IP fallback; in-app dialog unless dismissed this tab |
| `prompt` or `unsupported` | In-app dialog unless dismissed this tab |

`queryGeolocationPermission` returns `unsupported` when `permissions.query` is missing or throws. Success writes React state only — nothing in `localStorage`. `getCurrentPosition` uses `maximumAge: 0`, so every call asks the browser for a brand-new fix. Home and catalog detail both mount this hook, so a refresh of either page repeats the bootstrap.

## Approach

Persist a successful GPS reading (`lat`, `lng`, `placeLabel`, `savedAt`) under `website.userLocation` in `localStorage`. On bootstrap, restore it before any permission UI. Call `getCurrentPosition` on load only when the Permissions API reports `granted`. Otherwise, if a saved fix exists, leave it on screen and do not open the dialog. Explicit refresh (button / Allow) still calls `getCurrentPosition` from the click. `PERMISSION_DENIED` deletes the saved fix and keeps the existing IP fallback.

## Implementation steps

1. **Storage helpers** in `useUserLocation.ts` — `readStoredLocation`, `writeStoredLocation`, `clearStoredLocation`, each in try/catch. Do not store IP fallback coordinates.

2. **Split the geolocation call** — Internal `readPosition(maximumAge, silent)` used by `requestLocation` (click: `maximumAge: 0`, not silent) and by the granted bootstrap path (`maximumAge` about 5 minutes, silent so a saved label stays visible). On success, write storage and clear the dismiss key as today. On `PERMISSION_DENIED`, clear storage then `applyIpFallback`. On other errors during a silent refresh that already has coordinates, keep the saved place.

3. **Bootstrap** — If storage has a fix, set `coords`, `placeLabel`, `source: 'gps'`, `status: 'ready'` immediately and do not set `showPermissionPrompt`. Then:
   - `granted` → silent `readPosition`.
   - `denied` → clear storage, IP fallback, in-app dialog unless dismissed (unchanged).
   - `prompt` / `unsupported` with a saved fix → return (no dialog, no `getCurrentPosition`).
   - `prompt` / `unsupported` without a saved fix → existing dismiss / dialog / IP behavior.

4. **Verify** — `npm run type-check -w website-root` and `npm run lint -w @webonone/website-frontend`.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- A saved fix can be slightly stale until the visitor taps refresh, or until a browser that reports `granted` updates it in the background.
- `localStorage` can throw in locked-down browsers; failures are ignored and the old prompt behavior remains.
- Support docs are not required for this bug fix.
