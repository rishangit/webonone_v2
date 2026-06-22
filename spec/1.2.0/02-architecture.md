# 02 — Architecture (1.2.0)

Extends [1.1.0 architecture](../1.1.0/02-architecture.md). All prior design principles still apply.

## Topology

```text
┌────────────────────────────────────────────────────────────────────────────┐
│  webonone-v2/                         (core product shell — EXTENDED)       │
│  AppShell + left nav + System Theme UI                                    │
│  webonone-be :4000  —  system_themes, user_preferences APIs               │
│  ThemeProvider at root; postMessage to iframes; theme params on URL redirects │
└────────────────────────────────────────────────────────────────────────────┘
         │ embed iframe                    │ URL redirect (@webonone/platform-nav)
         │ postMessage                     │ theme_mode + theme_colors query params
         ▼                                 ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│  identity/  :3001       │       │  media/  :3003          │
│  Embed: postMessage     │       │  Embed: postMessage     │
│  Redirect: URL params   │       │  Redirect: URL params   │
└─────────────────────────┘       └─────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│  ui-kit/  +  packages/theme/                                                │
│  AppShell, sidebar, semantic tokens, applyThemeVariables(), embed hook    │
└────────────────────────────────────────────────────────────────────────────┘
```

## Ownership

| Concern | Owner | Notes |
|---------|-------|-------|
| Theme records (CRUD) | WebOnOne v2 BE + `webonone_v2` | No theme tables in Identity or Media DB |
| User active theme + color mode | WebOnOne v2 BE | `user_id` copy from JWT `sub` |
| Layout chrome (nav, header) | UI Kit `AppShell` | WebOnOne passes nav config + routes |
| Nav route definitions | WebOnOne v2 FE | Domain-specific items (Home, Demo, Settings) |
| CSS variable contract | `@webonone/theme` | Versioned DTO + mapper |
| Component styling | UI Kit | Reads semantic tokens; no hardcoded accent hex in components |
| Embed theme sync | Parent WebOnOne FE → child iframe | `postMessage` (channel A) |
| Redirect theme handoff | WebOnOne FE → Identity/Media FE | URL query params via `@webonone/platform-nav` (channel B) |
| Theme relay | Any peer → peer redirect | Forward `theme_*` params with `relayThemeQueryParams` |

**Never:** shared theme table across services, Identity BE querying WebOnOne for theme on each request, or storing theme only in `localStorage` without API persistence for user selection.

## Connection layers (theme)

| Layer | Channel | Used for |
|-------|---------|----------|
| **1 — Runtime CSS** | `document.documentElement` CSS variables | Shell + peer pages after apply |
| **2a — Embed handoff** | `window.postMessage` + origin checks | WebOnOne parent → Identity/Media iframe |
| **2b — Redirect handoff** | URL query `theme_mode` + `theme_colors` | Full-page `@webonone/platform-nav` redirect |
| **3 — API persistence** | `Authorization: Bearer <JWT>` REST | Load/save themes and user preference (WebOnOne only) |
| **4 — Async sync** | Not in 1.2.0 | Future: `ThemeUpdated` event for standalone peer sync |

```text
Persistence:  WebOnOne FE ──JWT──► WebOnOne BE ──► webonone_v2
Apply local:  WebOnOne FE ──► ThemeProvider ──► CSS variables on <html>
Embed sync:   WebOnOne FE ──postMessage──► Identity/Media iframe (channel 2a)
Redirect:     WebOnOne FE ──location + theme params──► Identity/Media FE (channel 2b)
Return:       Identity/Media ──return_url──► WebOnOne (theme from API)
```

## Data flow — theme selection

```text
1. User opens Settings → System Theme
2. FE GET /api/v1/themes + GET /api/v1/me/preferences
3. User selects theme "Brand A" and mode "dark"
4. FE PATCH /api/v1/me/preferences { themeId, colorMode }
5. ThemeProvider maps palette → semantic CSS variables on documentElement
6. class "dark" toggled on <html> for Tailwind darkMode
7. For each open embed iframe: postMessage { type: 'webonone:theme:apply', ... } (channel 2a)
8. Child validates event.origin === parentOrigin; applies same CSS variables
```

### Redirect flow (channel 2b)

```text
1. User clicks action that calls redirectWithAuthCode (e.g. Identity profile)
2. WebOnOne FE merges serializeThemeQueryParams(active theme) into extraSearchParams
3. Browser navigates to peer origin with code + theme_mode + theme_colors
4. Peer FE: applyThemeFromQueryParams before render; strip theme_* from URL
5. Peer UI matches core accents; no WebOnOne API call on peer
```

## Repo layout (1.2.0 additions)

```text
PROJECTS/2026/
├── spec/1.2.0/                    # this folder
├── packages/
│   ├── platform-nav/
│   ├── media-embed/
│   └── theme/                     # NEW — @webonone/theme
├── ui-kit/package/src/
│   ├── layouts/AppShell.tsx       # NEW
│   ├── layouts/AppSidebar.tsx     # NEW
│   └── styles/globals.css         # extended tokens + scrollbar
└── webonone-v2/
    ├── backend/migrations/        # system_themes, user_preferences
    └── frontend/src/features/
        ├── shell/                 # nav config, layout route
        └── settings/
            └── system-theme/      # theme CRUD UI
```

## Design principles (theme-specific)

| Principle | Application |
|-----------|-------------|
| Accents vs surfaces | User palette drives `--primary`, gradient stops, `--ring`, emphasis borders; neutrals drive `--background`, `--card`, `--foreground` |
| Light/dark is orthogonal | `colorMode` switches neutral set; accent mapping function is the same in both modes |
| UI Kit single source | All services import `@webonone/ui-kit/styles`; theme package only **sets** variables |
| Embed parity | Embedded UIs match parent accents when `parentOrigin` is set |
| Redirect parity | Peer UIs opened from core via URL redirect match theme query snapshot |
| JWT for writes | Create/update/delete theme and preferences require authenticated user |

## Security

- Theme CRUD: user may only delete themes they created unless admin role (admin role out of scope — creator-only in 1.2.0).
- `postMessage` and URL theme payloads contain **colors and mode only** — no tokens or PII.
- Child iframe validates `event.origin` against known parent origin (from query param or init message).
- API validates hex color format server-side (`#RRGGBB`).
