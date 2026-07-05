# 03 — Loading overlay unification (1.11.2 delta)

## Problem

On **page refresh** in Data or Email platform mode, users see **two sequential loading UIs**:

1. AppLayout blocks `<Outlet />` and shows a full-viewport overlay (`Loading session…`) while JWT role refresh runs.
2. After session is ready, the route page mounts and shows a **second** full-viewport overlay (e.g. `Loading tags…`, `Loading templates…`).

Users also briefly see loading **text/layout shift** before the overlay spinner appears (LazyRoute `Suspense` + AppLayout swap).

**Still failing after Phase 3 (delta refinement):** On refresh, users report **two distinct loading stages** — **page loading** (route chunk / inline Suspense fallback) and **data loading** (API fetch label). These must collapse into **one fixed overlay** whose label updates in place (`Loading page…` → `Loading session…` → `Loading tags…`).

## Root cause

| Layer | Behaviour today |
|-------|-----------------|
| `AppLayout` | Replaces `<Outlet />` with `LoadingState overlay` during `sessionLoading` |
| Route pages | Each list/home page renders its own `LoadingState overlay` while fetching data |
| `LazyRoute` | `Suspense` fallback uses another `LoadingState overlay` during chunk load |

Multiple components compete for the same fixed viewport overlay (`z-50 fixed inset-0`).

## Required fix

**One overlay, one position, label updates in place** — no second overlay mount on refresh.

### AppLayout (Data + Email)

1. **Always render `<Outlet />`** under the shell (do not replace with a loading placeholder).
2. Show a **single fixed overlay** when session is loading **or** a child page reports loading.
3. Overlay label priority:
   - `Loading session…` while `isBootstrapping || !roleReady`
   - Else page-provided label (e.g. `Loading tags…`)
4. Use one `LoadingState overlay` instance — update `label` prop only; do not unmount/remount between stages.

### Page loading context

Add `PlatformLoadingProvider` + `usePlatformLoading(label)` hook per satellite FE:

- Pages call `usePlatformLoading(list.loading ? 'Loading tags…' : null)` instead of rendering `LoadingState overlay`.
- Hook sets/clears label in context on mount/update/unmount.
- List loading uses **inline** non-overlay spinner inside content if needed for layout stability (optional); viewport overlay is owned by AppLayout only.

### LazyRoute

Report route-chunk loading into the same AppLayout overlay via `useRouteLoading('Loading page…')` — **no visible Suspense fallback** (fallback renders `null` and only sets context).

Use `useLayoutEffect` in loading hooks so labels are set before paint (avoids one-frame gap between session and data labels).

### Overlay label priority (AppLayout)

1. `Loading session…` — bootstrap or role refresh
2. Page/data label — e.g. `Loading tags…`
3. Route label — `Loading page…` while lazy chunk loads

Show overlay when **any** stage is active; keep one `LoadingState overlay` mounted (stable `key`) and update `label` only.

### Remove redundant handoff spinners

`usePlatformSessionBootstrap` in AppLayout already covers auth-code exchange. Remove duplicate `PlatformHandoffSpinner` early returns from list/home pages where AppLayout session overlay suffices.

## Scope

| Service | Files |
|---------|-------|
| Data | `app/AppLayout.tsx`, `app/LazyRoute.tsx`, new `features/auth/context/PlatformLoadingContext.tsx`, list/home pages using overlay today |
| Email | Same pattern |

## Acceptance

| Step | Expected |
|------|----------|
| Refresh Data `/tags` in platform mode | One overlay; label may change from session → tags; no double flash |
| Refresh Email `/templates` | Same |
| Platform handoff with `?code=` | Single overlay through exchange + first data load |
| Standalone mode (no `return_url`) | Session overlay only when role refresh needed; page inline loading OK |

## ClickUp

Subtask **86ey5wf9a** — [Bug] Still can see the two loading when page refresh.
