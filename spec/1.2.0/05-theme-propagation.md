# 05 — Theme Propagation

How the active theme and color mode apply to WebOnOne core, **embedded iframes**, and **full-page URL redirects** to Identity/Media.

Package: **`@webonone/theme`** (`packages/theme/`).

**URL redirect detail:** [08-theme-url-redirect-integration.md](./08-theme-url-redirect-integration.md).

---

## Propagation channels

| Channel | Mechanism | When |
|---------|-----------|------|
| **A — Embed** | `postMessage` `webonone:theme:apply` | iframe with `parentOrigin` (login frame, Media picker modal) |
| **B — URL redirect** | Query params `theme_v`, `theme_mode`, `theme_colors` | Full-page navigation via `@webonone/platform-nav` (`redirectWithAuthCode`, `buildLoginRedirectUrl`) |
| **C — API (core only)** | `GET /me/preferences` | WebOnOne shell bootstrap and return from peer services |

Channels A and B call the same `applyThemeVariables()` / `applyColorMode()`. Channel C is the source of truth for persisted user preference on WebOnOne.

---

## CSS variable contract

### Raw accent variables (set on `document.documentElement`)

```css
--color-1: #2563EB;
--color-2: #3B82F6;
--color-3: #F59E0B;
--color-4: #F8FAFC;
--color-5: #1E293B;
```

### Semantic variables (derived by `applyThemeVariables(theme)`)

| Semantic | Source |
|----------|--------|
| `--primary` | `color1` — primary brand |
| `--primary-gradient-from` | `color1` |
| `--primary-gradient-to` | `color2` — secondary |
| `--primary-foreground` | contrast vs darker of `color1` / `color2` |
| `--secondary` | `color2` |
| `--secondary-foreground` | contrast on `color2` |
| `--accent` | `color3` — badges, callouts |
| `--accent-foreground` | contrast on `color3` |
| `--ring` | `color3` |
| `--scrollbar-thumb` | `color3` at 60% opacity |
| `--background`, `--card`, `--popover` | Frosted glass (~78% opacity) over tinted canvas |
| `--background-base` | Neutral site canvas |
| `--background-tint` | Theme wash hue (color4 light / color5 dark) |
| `--background-tint-opacity` | Body gradient tint strength |
| `--foreground`, `--card-foreground`, `--popover-foreground` | `color5` in light mode; `color4` in dark mode |
| `--muted` | glass tint at ~42% opacity |
| `--muted-foreground` | foreground at 70% opacity |
| `--border`, `--input` | foreground at 15% opacity |
| `--destructive` | platform fixed `#DC2626` (not a palette slot) |
| `--destructive-foreground` | contrast on destructive |

### Primary button gradient tokens

`applyThemeVariables()` must set `--primary-gradient-from` and `--primary-gradient-to` whenever raw `--color-1` and `--color-2` are set, so embed and URL redirect channels produce the same gradient as the core shell.

Tailwind preset (`ui-kit/package/tailwind.config.ts`) may expose:

```typescript
primaryGradient: {
  from: 'hsl(var(--primary-gradient-from))',
  to: 'hsl(var(--primary-gradient-to))',
},
```

Used only by `Button` `default` variant — not for backgrounds or cards.

### Color mode application

```typescript
// Conceptual
function applyColorMode(mode: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', mode === 'dark')
}
```

Tailwind `darkMode: ['class']` must remain enabled in all consumer `tailwind.config` presets.

---

## Package exports (`@webonone/theme`)

| Export | Purpose |
|--------|---------|
| `ThemeDto` | `{ id, name, color1..color5 }` |
| `ColorMode` | `'light' \| 'dark'` |
| `ThemePayload` | `{ theme: ThemeDto, colorMode: ColorMode, version: 1 }` |
| `THEME_MESSAGE_TYPES` | `{ APPLY: 'webonone:theme:apply' }` |
| `hexToHslCssVar(hex)` | Convert `#RRGGBB` → `H S% L%` for Tailwind hsl() tokens |
| `applyThemeVariables(payload)` | Set `--color-*` and semantic vars on given root element |
| `applyColorMode(mode)` | Toggle `dark` class |
| `buildThemePayload(theme, mode)` | Full payload for postMessage |
| `ThemeProvider` | React context; loads preference, applies on change |
| `useTheme()` | `{ theme, colorMode, setColorMode, selectTheme }` |
| `useEmbedThemeListener()` | Child iframe: listen for parent APPLY message |
| `broadcastThemeToIframes(payload, iframes)` | Parent: postMessage to allowed origins |
| `THEME_QUERY` | URL param key constants (`theme_v`, `theme_mode`, `theme_colors`) |
| `serializeThemeQueryParams(payload)` | For `redirectWithAuthCode` `extraSearchParams` |
| `parseThemeQueryParams(searchParams)` | Validate URL theme snapshot |
| `applyThemeFromQueryParams(searchParams)` | Sync apply before React render |
| `stripThemeQueryParams(searchParams)` | Clean URL after apply |
| `useRedirectThemeBootstrap()` | App root: apply + strip on mount |
| `relayThemeQueryParams(searchParams)` | Forward theme when service redirects to another |

Build: root script `npm run build:theme` (mirror `build:platform-nav`).

---

## Core application (WebOnOne parent)

### Bootstrap

```text
1. App mounts ThemeProvider (inside Redux Provider)
2. On auth: epic fetches GET /me/preferences
3. ThemeProvider calls applyThemeVariables + applyColorMode
4. Shell renders with updated tokens
```

### On theme change

```text
1. User selects theme or toggles light/dark
2. PATCH /me/preferences
3. ThemeProvider updates context + CSS variables
4. broadcastThemeToIframes(payload, document.querySelectorAll('iframe'))
```

### Iframe targeting

Only post to iframes where `contentWindow` is accessible (same-session embed). Origin derived from iframe `src` URL origin.

---

## Embed mode (Identity, Media)

When `parentOrigin` query param is present, child FE registers `useEmbedThemeListener(parentOrigin)` in addition to existing embed hooks.

### Parent → child message

```typescript
{
  type: 'webonone:theme:apply',
  version: 1,
  theme: {
    id: 'V7xK9mN2pQw3rTy4uIoP0',
    name: 'Platform Default',
    color1: '#2563EB',
    color2: '#3B82F6',
    color3: '#F59E0B',
    color4: '#F8FAFC',
    color5: '#1E293B',
  },
  colorMode: 'dark',
}
```

### Child handler

1. Listen `window.addEventListener('message', ...)`.
2. Verify `event.origin === parentOrigin` (from query param).
3. Verify `event.data?.type === 'webonone:theme:apply'`.
4. Call `applyThemeVariables(event.data)` and `applyColorMode(event.data.colorMode)`.

### Initial sync

Parent sends APPLY message:
- After iframe `load` event.
- After any theme/mode change while iframe mounted.

Optional init handshake (1.2.0): child posts `webonone:theme:ready` to parent; parent responds with APPLY (ensures no flash of default theme).

---

## URL redirect (channel B)

When WebOnOne navigates to Identity or Media with `window.location` (auth-code handoff, login redirect, full-page Media), attach theme query params via `@webonone/platform-nav`:

```typescript
await redirectWithAuthCode({
  ...opts,
  extraSearchParams: serializeThemeQueryParams(buildThemePayload(theme, colorMode)),
})
```

Target service: `applyThemeFromQueryParams` on load → strip params from URL.

Full contract, flows, relay rules, and security: **[08-theme-url-redirect-integration.md](./08-theme-url-redirect-integration.md)**.

---

## Services matrix

| Service | Direct visit | Iframe embed (A) | URL redirect from core (B) |
|---------|--------------|------------------|----------------------------|
| **WebOnOne** | API preferences (C) | Parent | N/A |
| **Identity** | Default UI Kit theme | postMessage | Query params |
| **Media** | Default UI Kit theme | postMessage | Query params |
| **UI Kit showcase** | Local demo toggle | N/A | N/A |

Peer services do **not** call WebOnOne theme API on redirect; they apply the URL snapshot only.

---

## Consumer setup checklist

Each peer frontend (Identity, Media):

1. Dependency: `"@webonone/theme": "*"` workspace.
2. `import '@webonone/ui-kit/styles'` (unchanged).
3. App root: `useRedirectThemeBootstrap()` (channel B).
4. Sync `applyThemeFromQueryParams` in `main.tsx` before render (reduce flash).
5. Embed layout: `useEmbedThemeListener(parentOrigin)` (channel A).
6. Outbound `redirectWithAuthCode`: `relayThemeQueryParams` (channel B relay).
7. Vite alias for `@webonone/theme` (mirror `platform-nav` in each `vite.config.ts`).

WebOnOne parent:

1. Wrap app in `ThemeProvider` with API callbacks.
2. Call `broadcastThemeToIframes` from theme change handler and iframe `onLoad` (channel A).
3. Pass `serializeThemeQueryParams` on all `redirectWithAuthCode` and login redirect calls (channel B).

---

## Versioning

- `version: 1` in message payload; consumers ignore unknown versions gracefully.
- Breaking mapping changes increment version and support previous version for one release.

---

## Security

| Rule | Detail |
|------|--------|
| Origin check | Child accepts only `parentOrigin` |
| No secrets in payload | Colors and mode only |
| Parent target origin | `postMessage(data, childOrigin)` — never `'*'` |
| Validate shape | Zod parse in listener before apply |

---

## Acceptance criteria

1. Changing theme in WebOnOne updates shell buttons/inputs immediately; primary `default` buttons use gradient from `color1` to `color2`.
2. Open Media picker embed: matches parent theme after load and after parent theme change (channel A).
3. Identity login iframe on `/login` matches theme when parent is WebOnOne with active dark + custom palette (channel A).
4. WebOnOne → Identity profile redirect: themed UI without calling WebOnOne API from Identity (channel B).
5. WebOnOne → Media full-page redirect: same accents as core (channel B).
6. Theme query params stripped from URL after bootstrap; invalid params ignored.
7. Invalid postMessage ignored; wrong origin ignored.
8. `@webonone/theme` builds and type-checks from repo root.
