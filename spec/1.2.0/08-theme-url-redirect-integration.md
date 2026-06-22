# 08 — Theme ↔ URL Redirect Integration

Authoritative guide for applying the **active System Theme** when the WebOnOne core navigates to **Identity** or **Media** via **full-page URL redirect** (not iframe).

Related: [05-theme-propagation.md](./05-theme-propagation.md), [../1.0.0/07-identity-webonone-integration.md](../1.0.0/07-identity-webonone-integration.md), `@webonone/platform-nav`, `@webonone/theme`.

---

## Problem

Cross-service navigation uses **different origins** in local dev (`localhost:3000` → `localhost:3001` / `:3003`) and **different hosts** in production. `sessionStorage` and `postMessage` do not apply after a full `window.location` redirect.

| Channel | Works for iframe embed | Works for URL redirect |
|---------|------------------------|----------------------|
| `postMessage` | Yes | No (new document, no parent frame) |
| `sessionStorage` | Same origin only | No (per-origin isolated) |
| WebOnOne theme API on target | Possible but forbidden on hot path | Cross-service HTTP per page load |

**1.2.0 solution:** pass a **compact, versioned theme snapshot in URL query parameters** on redirect. Target service parses, applies CSS variables, then **strips** theme params from the address bar (same pattern as auth `code` cleanup).

Theme data is **colors + mode only** — never JWT, never theme DB ids alone (ids would force a WebOnOne API round-trip).

---

## Two propagation channels (1.2.0)

| Channel | When | Package |
|---------|------|---------|
| **A — Embed** | iframe (`parentOrigin` set) | `postMessage` `webonone:theme:apply` |
| **B — URL redirect** | Full-page navigation via `@webonone/platform-nav` | Query params `theme_mode` + `theme_colors` |

Both channels call the same `applyThemeVariables()` / `applyColorMode()` in `@webonone/theme`.

```text
Embed:        WebOnOne FE ──postMessage──► Identity/Media iframe
URL redirect: WebOnOne FE ──location.assign(url + theme params)──► Identity/Media FE
```

---

## Query parameter contract

| Param | Required | Format | Example |
|-------|----------|--------|---------|
| `theme_v` | Yes | Integer contract version | `1` |
| `theme_mode` | Yes | `light` \| `dark` | `dark` |
| `theme_colors` | Yes | Five comma-separated hex **without** `#` | `2563EB,3B82F6,F59E0B,F8FAFC,1E293B` |

Optional (display only, not required to apply):

| Param | Format |
|-------|--------|
| `theme_name` | URL-encoded theme name |

**Max size:** ~120 characters for theme params — safe within URL length limits alongside `code` and `return_url`.

### Example URLs

**WebOnOne → Identity profile (auth-code redirect):**

```text
http://localhost:3001/profile
  ?code=abc123
  &return_url=http%3A%2F%2Flocalhost%3A3000%2F
  &theme_v=1
  &theme_mode=dark
  &theme_colors=2563EB,3B82F6,F59E0B,F8FAFC,1E293B
```

**WebOnOne → Identity login (unauthenticated redirect):**

```text
http://localhost:3001/login
  ?redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback
  &return_path=%2F
  &state=...
  &theme_v=1
  &theme_mode=light
  &theme_colors=2563EB,3B82F6,F59E0B,F8FAFC,1E293B
```

**WebOnOne → Media standalone (auth-code redirect):**

```text
http://localhost:3003/upload
  ?code=...
  &return_url=...
  &theme_v=1
  &theme_mode=dark
  &theme_colors=2563EB,3B82F6,F59E0B,F8FAFC,1E293B
```

---

## Package exports (`@webonone/theme`)

| Export | Purpose |
|--------|---------|
| `THEME_QUERY` | `{ V, MODE, COLORS, NAME }` param key constants |
| `serializeThemeQueryParams(payload)` | `Record<string, string>` for `extraSearchParams` |
| `parseThemeQueryParams(searchParams)` | `ThemePayload \| null` with Zod validation |
| `applyThemeFromQueryParams(searchParams)` | Parse → apply CSS → return payload |
| `stripThemeQueryParams(searchParams)` | Remove theme keys (for `history.replaceState`) |
| `appendThemeToUrl(url, payload)` | Merge theme params into `URL` |
| `readThemeFromLocation()` | `window.location.search` helper |
| `useRedirectThemeBootstrap()` | React hook: apply on mount + strip from URL |
| `relayThemeQueryParams(searchParams)` | Forward current URL theme params for outbound redirect |

Build alongside existing embed exports in [05-theme-propagation.md](./05-theme-propagation.md).

---

## Integration with `@webonone/platform-nav`

### Auth-code redirect (authenticated)

`redirectWithAuthCode` already supports `extraSearchParams`. WebOnOne passes theme snapshot:

```typescript
import { redirectWithAuthCode } from '@webonone/platform-nav'
import { serializeThemeQueryParams } from '@webonone/theme'

await redirectWithAuthCode({
  accessToken,
  authCodeEndpoint: `${identityApiBase}/auth/code`,
  targetUrl: identityProfileUrl,
  returnUrl: `${window.location.origin}/`,
  extraSearchParams: serializeThemeQueryParams(buildThemePayload(activeTheme, colorMode)),
})
```

**WebOnOne call sites (1.2.0):**

| Action | Target |
|--------|--------|
| Open Identity profile | `identity.webonone.com/profile` |
| Open Media upload (full page) | `media.webonone.com/upload` |
| Open Media library (full page) | `media.webonone.com/` or `/picker` |

### Login redirect (unauthenticated)

**Extend** `BuildLoginRedirectOptions` in `@webonone/platform-nav` with optional `extraSearchParams` (mirror auth-code redirect).

```typescript
import { buildLoginRedirectUrl } from '@webonone/platform-nav'
import { serializeThemeQueryParams } from '@webonone/theme'

const loginUrl = buildLoginRedirectUrl({
  loginUrl: getIdentityLoginUrl(),
  redirectUri: `${window.location.origin}/callback`,
  returnPath: '/',
  extraSearchParams: serializeThemeQueryParams(guestOrCachedTheme),
})
```

WebOnOne `/login` iframe path still uses **embed postMessage** (channel A). Full redirect login path uses **URL params** (channel B).

### Theme relay (service → service)

When a microservice redirects to another and the **current URL already has theme params**, forward them:

```typescript
import { relayThemeQueryParams } from '@webonone/theme'

await redirectWithAuthCode({
  ...opts,
  extraSearchParams: {
    ...relayThemeQueryParams(new URLSearchParams(window.location.search)),
    // other params
  },
})
```

Example: user on Identity `/profile` (themed via redirect from core) opens Media upload — Identity relays the same `theme_*` params.

---

## Target service bootstrap

Each microservice FE that can be opened via URL redirect from core registers theme bootstrap **before or at app root render**.

### React hook (minimum)

```typescript
// identity/frontend/src/main.tsx or AppLayout — conceptual
import { useRedirectThemeBootstrap } from '@webonone/theme'

function AppRoot() {
  useRedirectThemeBootstrap()
  // ...
}
```

Hook behavior:

1. Read `window.location.search`.
2. `parseThemeQueryParams` — if invalid/missing, no-op.
3. `applyThemeVariables` + `applyColorMode`.
4. `history.replaceState` with `stripThemeQueryParams` (remove theme keys; keep `code`, `return_url`, etc.).

### Flash prevention (recommended)

Apply theme synchronously in `main.tsx` **before** `createRoot().render()` when params present:

```typescript
import { applyThemeFromQueryParams } from '@webonone/theme'

applyThemeFromQueryParams(new URLSearchParams(window.location.search))
```

Hook still strips params after mount.

### Embed + redirect coexistence

Priority on child page load:

| Condition | Source |
|-----------|--------|
| `parentOrigin` query set | Wait for postMessage (channel A); URL params are fallback until parent sends APPLY |
| No `parentOrigin` | URL params (channel B) apply immediately |

If both present, **postMessage from parent wins** when received (parent is authoritative in embed).

---

## Return navigation

When user returns to WebOnOne via `return_url`:

- WebOnOne loads theme from **`GET /me/preferences`** (API) — not from URL.
- Optional: caller may append theme params to `return_url` for instant paint before API responds; WebOnOne bootstrap applies URL theme, then API preference overwrites if different.

```typescript
returnUrl: appendThemeToUrl(`${window.location.origin}/`, currentTheme).toString()
```

---

## Flow diagrams

### Core → Identity profile

```text
1. User on WebOnOne (theme "Brand A", dark mode) clicks Profile
2. WebOnOne FE: redirectWithAuthCode + serializeThemeQueryParams
3. Browser navigates to Identity /profile?code=...&theme_mode=dark&theme_colors=...
4. Identity FE: applyThemeFromQueryParams (sync)
5. Identity FE: exchange code → session JWT
6. Identity FE: strip theme_* from URL via replaceState
7. Profile UI renders with matching accents
8. User clicks Back → return_url → WebOnOne (theme from API)
```

### Core → Media (full page, not modal iframe)

```text
1. User opens Media upload in new tab / full navigation from core
2. Same auth-code + theme params pattern
3. Media FE: useRedirectThemeBootstrap + existing JWT bootstrap
4. Upload UI matches core theme
```

### Core → Identity login (redirect mode)

```text
1. Unauthenticated user; WebOnOne redirects to Identity login
2. buildLoginRedirectUrl + theme extraSearchParams (guest default or last cached mode)
3. Identity login/register pages render with core theme accents
4. After callback, WebOnOne applies saved user preference from API
```

---

## Services matrix (updated)

| Service | Iframe embed | URL redirect from core | Direct visit (no params) |
|---------|--------------|------------------------|--------------------------|
| **WebOnOne** | Parent | N/A | API preferences |
| **Identity** | postMessage | Query params + relay | Default UI Kit theme |
| **Media** | postMessage | Query params + relay | Default UI Kit theme |

---

## Security

| Rule | Detail |
|------|--------|
| No secrets in URL | Only `theme_mode` + `theme_colors` (+ optional name) |
| Validate on parse | Zod: mode enum, exactly five `^[0-9A-Fa-f]{6}$` colors |
| Ignore unknown `theme_v` | Forward-compatible; log in dev |
| Strip after apply | Reduce bookmark/history leakage of stale palettes |
| No server round-trip | Target does not call WebOnOne BE for theme on redirect path |
| Relay trust | Services relay params only when already present — do not invent colors |

Low risk: malicious URL could set arbitrary accent colors locally (same as browser DevTools on CSS variables).

---

## Implementation checklist

### `@webonone/theme`

- [ ] `THEME_QUERY` constants
- [ ] serialize / parse / strip helpers
- [ ] `useRedirectThemeBootstrap`
- [ ] `relayThemeQueryParams`

### `@webonone/platform-nav`

- [ ] `buildLoginRedirectUrl` accepts optional `extraSearchParams`
- [ ] Document theme usage in README

### WebOnOne v2 FE

- [ ] `redirectToIdentityProfile` passes `serializeThemeQueryParams`
- [ ] Any new full-page Media links pass theme params
- [ ] Login redirect builder passes theme params
- [ ] `returnUrl` optionally includes theme for fast paint

### Identity FE

- [ ] `useRedirectThemeBootstrap` in app root
- [ ] Sync apply in `main.tsx` before render
- [ ] `completeAuthRedirect` relays theme params on outbound redirect
- [ ] Embed listener unchanged (channel A)

### Media FE

- [ ] Same bootstrap as Identity
- [ ] Auth login redirect builder relays theme when present
- [ ] Embed listener unchanged (channel A)

---

## Acceptance criteria

1. WebOnOne → Identity profile: buttons/inputs match active core theme on first paint (no flash of default).
2. WebOnOne → Media full-page upload: same theme as core.
3. Identity login via redirect from WebOnOne shows core theme on login form.
4. Theme params removed from URL after bootstrap (auth `code` flow unaffected).
5. Invalid `theme_colors` ignored; app falls back to default UI Kit theme.
6. Identity → Media redirect preserves theme when params were on Identity URL.
7. Iframe embed still uses postMessage; URL params do not conflict when `parentOrigin` set.
