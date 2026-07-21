# 02 — WebOnOne Email Send + Queue navigation (1.12.2)

Extend the **Email** left-nav group with **Send Email** and **Queue**, matching the existing History / Templates embed pattern. Implements the 1.12.2 user story.

## Reference implementations (do not invent a third pattern)

| Pattern | Path |
|---------|------|
| Current Email sentinels + group | `packages/platform-nav/src/coreNav.ts` |
| SMS Send / Queue order precedent | `SMS_NAV_SENTINELS` + SMS group in same file |
| Peer iframe host | `webonone-v2/frontend/src/features/shell/pages/PlatformPeerFrame.tsx` |
| Peer routes | `webonone-v2/frontend/src/app/router.tsx` (`email/*` — already present) |
| Peer origin config | `webonone-v2/frontend/src/features/email/utils/emailConfig.ts` |
| Email pages | `email/frontend` `/send`, `/queue` (already present from earlier Email specs) |
| Canonical rules | `.cursor/rules/platform-shell-navigation.mdc` |

## Navigation contract

### Platform shell (WebOnOne)

When **super_admin** or **company_admin** uses the core left nav, **Email** is a **nav group** with four children:

| Sub-nav label | Sentinel (`path`) | Email service route (`externalPath`) | Roles |
|---------------|-------------------|--------------------------------------|-------|
| **Send Email** | `/email/send` | `/send` | super_admin, company_admin |
| **Queue** | `/email/queue` | `/queue` | super_admin, company_admin |
| **Email History** | `/email/history` | `/history` | super_admin, company_admin |
| **Templates** | `/email/templates` | `/templates` | super_admin, company_admin |

**Order** in the group must match the table (Send Email first, then Queue, History, Templates).

**Do not** add Dashboard, Test Email, Providers, or Settings to the core Email group in 1.12.2 — those stay on the standalone Email service nav.

**Member** variant — no Email group (unchanged).

### Standalone Email service nav

Unchanged. When opened without embed / without `return_url`, Email FE keeps its own nav (Dashboard, Send Email, Queue, Test, Providers, Settings, plus Email → History / Templates group).

## Channel selection

| Context | Channel | Behaviour |
|---------|---------|-----------|
| WebOnOne left-nav Email sentinels | **Embed** | `navigate('/email/…')` → `PlatformPeerFrame` → iframe |
| Satellite (Data/Identity) → Email | **Redirect** | Auth-code → `{emailOrigin}{path}?return_url&core_nav&theme` |
| Direct bookmark of Email origin | Standalone / redirect bootstrap | Existing Email auth |

WebOnOne must **not** use auth-code `window.location.assign` for its own Email left-nav clicks.

## packages/platform-nav

### Sentinels and helpers

```typescript
export const EMAIL_NAV_SENTINELS = {
  send: '/email/send',
  queue: '/email/queue',
  history: '/email/history',
  templates: '/email/templates',
} as const

export function isEmailNavSentinel(to: string): boolean {
  // any of the four
}

export function emailSentinelToExternalPath(sentinel: string): string | null {
  // /email/send → /send, /email/queue → /queue, …
}
```

Exports already re-exported from `packages/platform-nav/src/index.ts` — no new export names required beyond existing symbols.

### Core nav defs

Replace Email group children on `MAIN_PLATFORM_NAV` and `SUPER_ADMIN_PLATFORM_NAV`:

```typescript
{
  kind: 'group',
  label: 'Email',
  children: [
    { kind: 'item', path: EMAIL_NAV_SENTINELS.send, label: 'Send Email', externalService: 'email', externalPath: '/send' },
    { kind: 'item', path: EMAIL_NAV_SENTINELS.queue, label: 'Queue', externalService: 'email', externalPath: '/queue' },
    { kind: 'item', path: EMAIL_NAV_SENTINELS.history, label: 'Email History', externalService: 'email', externalPath: '/history' },
    { kind: 'item', path: EMAIL_NAV_SENTINELS.templates, label: 'Templates', externalService: 'email', externalPath: '/templates' },
  ],
}
```

### Tests

Extend `packages/platform-nav/src/coreNav.test.ts`:

- Resolves four Email sub-nav URLs when `externalOrigins.email` is set (order: send, queue, history, templates).
- `isEmailNavSentinel` / `emailSentinelToExternalPath` cover all four paths.
- Member still omits Email group.

## WebOnOne v2 frontend

### Router / peer frame

`email/*` → `PlatformPeerFrame peer="email"` already exists. Update only:

1. `resolvePeerPath`: `emailSentinelToExternalPath(pathname) ?? '/send'` (default first sub-item).
2. `navItems.ts`: icons for `EMAIL_NAV_SENTINELS.send` (Send) and `.queue` (Rows3).

No new env keys — `VITE_EMAIL_ORIGIN` already documented.

`AppLayout` / `routePrefetch` already use `isEmailNavSentinel` — they pick up the new paths automatically once helpers expand.

## Email frontend (embed peer)

Confirm for 1.12.2 (pages already ship):

| Check | Requirement |
|-------|-------------|
| Routes | `/send`, `/queue` render under embed outlet with **`FeaturePage`** |
| Content-ready | `usePlatformEmbedContentReady` so WebOnOne overlay dismisses correctly |
| When Email shows core nav | `rewriteEmailOriginLinks` maps absolute Email URLs to local `/send` / `/queue` |

Optional: add `/send` and `/queue` icons in `email/.../coreNavItems.ts` `CORE_ICON_BY_PATH_SUFFIX`.

## Satellite outbound (Data / Identity)

`isEmailNavSentinel` expansion is enough for Data when nav `to` is already a sentinel. Identity (and any absolute-URL rewrite) must map peer paths:

| Email path | Sentinel |
|------------|----------|
| `/send` | `EMAIL_NAV_SENTINELS.send` |
| `/queue` | `EMAIL_NAV_SENTINELS.queue` |
| `/history` | `EMAIL_NAV_SENTINELS.history` |
| `/templates` | `EMAIL_NAV_SENTINELS.templates` |

| File | Action |
|------|--------|
| `identity/.../shell/config/navItems.ts` | Extend `emailHrefToSentinel` (+ icons for `/send`, `/queue`) |
| `data/.../shell/utils/externalNavActions.ts` | Prefer `isEmailNavSentinel(pathname)` for absolute/core paths (or map `/email/send` + `/email/queue`) |

`redirectToEmail.ts` already uses `emailSentinelToExternalPath` — no signature change.

## Behaviour after change

```text
User on WebOnOne (super admin or company admin)
  → expands Email → clicks Send Email
  → navigate('/email/send')
  → PlatformPeerFrame peer=email
  → iframe src = {emailOrigin}/send?embed=platform&parentOrigin&core_nav&theme
  → postMessage webonone:platform:init { accessToken }
  → Email PlatformEmbedLayout shows Send FeaturePage
  → sidebar/header stay on WebOnOne
```

```text
User on Data (platform mode)
  → clicks Email → Queue
  → handleEmailNavClick('/email/queue')
  → POST Identity /auth/code
  → window.location → {emailOrigin}/queue?code&return_url&core_nav=…
  → Email bootstrap exchanges code
  → Queue page
```

## Role and data scoping

Nav visibility is role-based in `platform-nav` variants. **API scoping** remains on Email BE (company_id / platform scope from JWT) — WebOnOne does not proxy Email APIs.

## Acceptance

| Step | Expected |
|------|----------|
| Super admin — Email group | Four children in order; each embeds correct Email path |
| Company admin — Email group | Same four children; company-scoped data from Email API |
| Member | No Email group |
| WebOnOne → Send Email | Iframe `/send`; shell chrome remains |
| WebOnOne → Queue | Iframe `/queue` |
| Switch Send → History | Iframe path updates; no full WebOnOne reload |
| Data → Email → Queue | Lands on Email `/queue` (redirect) |
| Standalone Email | Unchanged admin nav |
| Type-check | platform-nav, webonone-v2-root, touched satellites |

## ClickUp

Subtask TBD — Email Send + Queue left nav under WebOnOne.
