# 02 — WebOnOne SMS navigation (1.12.1)

Wire **SMS** into the WebOnOne left nav the same way **Email** and **Data** are wired today: shared sentinels in `@webonone/platform-nav`, local routes under `/sms/*`, and an iframe peer frame. Implements the 1.12.1 user story.

## Reference implementations (do not invent a third pattern)

| Pattern | Path |
|---------|------|
| Email / Data sentinels + groups | `packages/platform-nav/src/coreNav.ts` |
| Peer iframe host | `webonone-v2/frontend/src/features/shell/pages/PlatformPeerFrame.tsx` |
| Peer routes | `webonone-v2/frontend/src/app/router.tsx` (`email/*`, `data/*`) |
| Peer origin config | `webonone-v2/frontend/src/features/email/utils/emailConfig.ts` |
| Embed on peer | `sms/frontend/src/app/AppLayout.tsx` → `PlatformEmbedLayout` (already present) |
| Canonical rules | `.cursor/rules/platform-shell-navigation.mdc` |

## Navigation contract

### Platform shell (WebOnOne)

When **super_admin** or **company_admin** uses the core left nav, **SMS** is a **nav group** (not a single link to the SMS dashboard):

| Sub-nav label | Sentinel (`path`) | SMS service route (`externalPath`) | Roles |
|---------------|-------------------|--------------------------------------|-------|
| **Send SMS** | `/sms/send` | `/send` | super_admin, company_admin |
| **Devices** | `/sms/devices` | `/devices` | super_admin, company_admin |
| **Queue** | `/sms/queue` | `/queue` | super_admin, company_admin |
| **History** | `/sms/history` | `/history` | super_admin, company_admin |
| **Templates** | `/sms/templates` | `/templates` | super_admin, company_admin |

**Order** in the group must match the table (Send SMS first, then Devices, Queue, History, Templates).

**Do not** add Dashboard or Test to the core SMS group in 1.12.1 — those stay on the standalone SMS service nav ([1.12.0/02-sms-service-scaffold.md](../1.12.0/02-sms-service-scaffold.md)).

**Member** variant (`MEMBER_PLATFORM_NAV`) — no SMS group (same as Email).

### Standalone SMS service nav

Unchanged. When opened without embed / without `return_url`, SMS FE keeps its own nav (Dashboard, Send SMS, Devices, Queue, History, Templates, etc.).

## Channel selection

| Context | Channel | Behaviour |
|---------|---------|-----------|
| WebOnOne left-nav SMS sentinels | **Embed** | `navigate('/sms/…')` → `PlatformPeerFrame` → iframe |
| Satellite (Email/Data/Identity) → SMS | **Redirect** | Auth-code → `{smsOrigin}{path}?return_url&core_nav&theme` |
| Direct bookmark of SMS origin | Standalone / redirect bootstrap | Existing SMS auth |

WebOnOne must **not** use auth-code `window.location.assign` for its own SMS left-nav clicks.

## packages/platform-nav

### Extend types

```typescript
export type ExternalServiceId = 'email' | 'data' | 'identity' | 'sms'
```

### Sentinels and helpers

```typescript
export const SMS_NAV_SENTINELS = {
  send: '/sms/send',
  devices: '/sms/devices',
  queue: '/sms/queue',
  history: '/sms/history',
  templates: '/sms/templates',
} as const

export function isSmsNavSentinel(to: string): boolean { /* any of the five */ }

export function smsSentinelToExternalPath(sentinel: string): string | null {
  // /sms/send → /send, … /sms/templates → /templates
}
```

Export from `packages/platform-nav/src/index.ts`.

### Core nav defs

Add an **SMS** group to `MAIN_PLATFORM_NAV` and `SUPER_ADMIN_PLATFORM_NAV` (place after **Email**, before **Settings** — or beside Email consistently in both variants):

```typescript
{
  kind: 'group',
  label: 'SMS',
  children: [
    { kind: 'item', path: SMS_NAV_SENTINELS.send, label: 'Send SMS', externalService: 'sms', externalPath: '/send' },
    { kind: 'item', path: SMS_NAV_SENTINELS.devices, label: 'Devices', externalService: 'sms', externalPath: '/devices' },
    { kind: 'item', path: SMS_NAV_SENTINELS.queue, label: 'Queue', externalService: 'sms', externalPath: '/queue' },
    { kind: 'item', path: SMS_NAV_SENTINELS.history, label: 'History', externalService: 'sms', externalPath: '/history' },
    { kind: 'item', path: SMS_NAV_SENTINELS.templates, label: 'Templates', externalService: 'sms', externalPath: '/templates' },
  ],
}
```

### Tests

Extend `packages/platform-nav/src/coreNav.test.ts`:

- Resolves SMS sub-nav URLs when `externalOrigins.sms` is set.
- Omits SMS group for `member` variant.
- `isSmsNavSentinel` / `smsSentinelToExternalPath` cover all five paths.

## WebOnOne v2 frontend

### Env

`webonone-v2/frontend/.env.example`:

```env
VITE_SMS_ORIGIN=http://localhost:3016
```

Local default in code may mirror Email (`http://localhost:3016`). Do **not** add per-route `VITE_SMS_*_URL` keys — derive paths in config.

### Config module

Create `webonone-v2/frontend/src/features/sms/utils/smsConfig.ts`:

| Export | Behaviour |
|--------|-----------|
| `getSmsOrigin()` | `VITE_SMS_ORIGIN` or local default |
| `getSmsAppUrl(path)` | `{origin}{path}` helper (for redirect consumers / tests) |

### Router

In `app/router.tsx`, add sibling to Email/Data:

```text
path="sms/*" → <PlatformPeerFrame peer="sms" />
```

### PlatformPeerFrame

1. Extend `PlatformPeerId` with `'sms'`.
2. `resolvePeerPath`: `smsSentinelToExternalPath(pathname) ?? '/send'` (default first sub-item).
3. `resolvePeerOrigin`: `getSmsOrigin()`.
4. `PEER_LABELS.sms = 'SMS'`.

### AppLayout / nav chrome

| File | Change |
|------|--------|
| `features/shell/config/navItems.ts` | Icons for SMS group + each sentinel; treat `externalService === 'sms'` like email/data; export `isSmsNavSentinel` |
| `app/AppLayout.tsx` | Include SMS sentinels in `isPlatformPeerEmbedPath` so `embedMain` applies |
| `app/routePrefetch.ts` | Prefetch peer frame when path is an SMS sentinel |

Core shell continues to use **local navigate** for SMS sentinels — no `onClick` auth-code redirect on WebOnOne.

### Session copy (optional polish)

`RoleSelectionDialog` (or similar) may mention SMS access for company/super admin the way Email is mentioned — keep wording short; not required for acceptance if nav visibility alone is clear.

## SMS frontend (embed peer)

SMS already branches to `PlatformEmbedLayout` when `embed=platform` + validated `parentOrigin`. Confirm for 1.12.1:

| Check | Requirement |
|-------|-------------|
| Routes | `/send`, `/devices`, `/queue`, `/history`, `/templates` render under embed outlet with **`FeaturePage`** |
| Content-ready | `usePlatformEmbedContentReady` so WebOnOne overlay dismisses correctly |
| Auth storage | `sms_auth` via `writeServiceAuthSession` / `usePlatformEmbedAuth` |
| CSP | `vite.config.ts` `frame-ancestors` includes WebOnOne origin |
| Allowed parents | `VITE_ALLOWED_PARENT_ORIGINS` / `VITE_WEBONONE_ORIGIN` validates `parentOrigin` |
| `.env.example` | Documents WebOnOne as allowed parent |

No new SMS pages required if 1.12.0 already shipped them.

## Satellite outbound (Email / Data / Identity)

Once SMS appears in shared core nav defs, satellites that build platform nav will show the SMS group. Without handlers, clicks fall back to core sentinel paths incorrectly (see [1.11.2](../1.11.2/02-cross-service-nav-fix.md)).

For each satellite that shows core nav in platform mode:

| File | Action |
|------|--------|
| `features/sms/utils/smsConfig.ts` | `getSmsOrigin()`, `getSmsAppUrl(path)` from `VITE_SMS_ORIGIN` |
| `features/sms/utils/redirectToSms.ts` | `getSmsRedirectOptions({ accessToken, returnUrl, navVariant, smsNavSentinel, extraSearchParams })` — mirror `redirectToEmail.ts` |
| `app/AppLayout.tsx` | Attach outbound click on `isSmsNavSentinel` before client-side nav |
| `frontend/.env.example` | `VITE_SMS_ORIGIN=http://localhost:3016` |

**Redirect options contract:**

- `authCodeEndpoint`: Identity API `/auth/code`
- `targetUrl`: `{smsOrigin}{smsSentinelToExternalPath(sentinel)}`
- `returnUrl`: current satellite origin home (or current path per existing peer pattern)
- `extraSearchParams`: `core_nav` + theme relay

WebOnOne itself does **not** need `redirectToSms` for left-nav (embed only). Optional helper is fine for tests or future use.

## Behaviour after change

```text
User on WebOnOne (super admin or company admin)
  → expands SMS → clicks History
  → navigate('/sms/history')
  → PlatformPeerFrame peer=sms
  → iframe src = {smsOrigin}/history?embed=platform&parentOrigin&core_nav&theme
  → postMessage webonone:platform:init { accessToken }
  → SMS PlatformEmbedLayout shows History FeaturePage
  → sidebar/header stay on WebOnOne
```

```text
User on Data /tags (platform mode)
  → clicks SMS → Templates
  → handleSmsNavClick
  → POST Identity /auth/code
  → window.location → {smsOrigin}/templates?code&return_url={dataOrigin}/&core_nav=…
  → SMS bootstrap exchanges code
  → Templates page (full SMS shell or platform shell per existing SMS handoff)
```

## Role and data scoping

Nav visibility is role-based in `platform-nav` variants. **API scoping** remains entirely on SMS BE (company_id / platform scope from JWT) — WebOnOne does not proxy SMS APIs from the browser for these pages.

## Acceptance

| Step | Expected |
|------|----------|
| Super admin — SMS group | Five children in order; each embeds correct SMS path |
| Company admin — SMS group | Same five children; company-scoped data from SMS API |
| Member | No SMS group |
| WebOnOne → SMS → Send SMS | Iframe `/send`; shell chrome remains |
| Switch SMS → Devices | Iframe path updates; no full WebOnOne reload |
| Data → SMS → Templates | Lands on SMS `/templates` (redirect), not core Home |
| Standalone SMS | Unchanged admin nav |
| Type-check | platform-nav, webonone-v2-root, sms-root, touched satellites |

## ClickUp

Subtask TBD — SMS left nav under WebOnOne.
