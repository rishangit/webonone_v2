# 02 — WebOnOne Data catalog navigation (1.12.3)

Expand the **Data** left-nav group with all six catalog features, matching the Email / SMS multi-child embed pattern. Implements the 1.12.3 user story.

## Reference implementations (do not invent a third pattern)

| Pattern | Path |
|---------|------|
| Current Data / Email / SMS sentinels + groups | `packages/platform-nav/src/coreNav.ts` |
| SMS / Email multi-child order precedent | `SMS_NAV_SENTINELS` / `EMAIL_NAV_SENTINELS` in same file |
| Peer iframe host | `webonone-v2/frontend/src/features/shell/pages/PlatformPeerFrame.tsx` |
| Peer routes | `webonone-v2/frontend/src/app/router.tsx` (`data/*` — already present) |
| Peer origin config | `webonone-v2/frontend/src/features/data/utils/dataConfig.ts` |
| Data standalone nav | `data/frontend/src/features/shell/config/navItems.ts` |
| Data pages | `data/frontend` `/tags`, `/units`, `/attributes`, `/products`, `/services`, `/spaces` |
| Canonical rules | `.cursor/rules/platform-shell-navigation.mdc` |

## Navigation contract

### Platform shell (WebOnOne)

When **super_admin** or **company_admin** uses the core left nav, **Data** is a **nav group** with six children:

| Sub-nav label | Sentinel (`path`) | Data service route (`externalPath`) | Roles |
|---------------|-------------------|--------------------------------------|-------|
| **Tags** | `/data/tags` | `/tags` | super_admin, company_admin |
| **Units** | `/data/units` | `/units` | super_admin, company_admin |
| **Attributes** | `/data/attributes` | `/attributes` | super_admin, company_admin |
| **Products** | `/data/products` | `/products` | super_admin, company_admin |
| **Services** | `/data/services` | `/services` | super_admin, company_admin |
| **Spaces** | `/data/spaces` | `/spaces` | super_admin, company_admin |

**Order** in the group must match the table (Tags first, then Units, Attributes, Products, Services, Spaces) — same order as standalone Data nav entity items (excluding Dashboard).

**Do not** add **Dashboard** / **Data Catalog** to the core Data group in 1.12.3 — that stays on the standalone Data service nav ([1.11.0/05-admin-ui.md](../1.11.0/05-admin-ui.md)), matching Email/SMS Dashboard exclusion.

**Remove** the existing core child **Data Catalog** (`DATA_NAV_SENTINELS.dashboard` → `/`) from `MAIN_PLATFORM_NAV` and `SUPER_ADMIN_PLATFORM_NAV`. Keep the sentinel helper only if needed for backward-compatible redirects; prefer deleting unused `dashboard` sentinel once no callers remain.

**Member** variant (`MEMBER_PLATFORM_NAV`) — no Data group (unchanged).

### Standalone Data service nav

Unchanged. When opened without embed / without `return_url`, Data FE keeps its own nav (Dashboard, Tags, Units, Attributes, Products, Services, Spaces).

## Channel selection

| Context | Channel | Behaviour |
|---------|---------|-----------|
| WebOnOne left-nav Data sentinels | **Embed** | `navigate('/data/…')` → `PlatformPeerFrame` → iframe |
| Satellite (Email/SMS/Identity) → Data | **Redirect** | Auth-code → `{dataOrigin}{path}?return_url&core_nav&theme` |
| Direct bookmark of Data origin | Standalone / redirect bootstrap | Existing Data auth |

WebOnOne must **not** use auth-code `window.location.assign` for its own Data left-nav clicks.

## packages/platform-nav

### Sentinels and helpers

```typescript
export const DATA_NAV_SENTINELS = {
  tags: '/data/tags',
  units: '/data/units',
  attributes: '/data/attributes',
  products: '/data/products',
  services: '/data/services',
  spaces: '/data/spaces',
} as const

export function isDataNavSentinel(to: string): boolean {
  // any of the six
}

export function dataSentinelToExternalPath(sentinel: string): string | null {
  // /data/tags → /tags, /data/units → /units, …
}
```

Export from `packages/platform-nav/src/index.ts` (existing symbol names; no new export names required beyond current helpers).

If `dashboard` is removed: grep callers of `DATA_NAV_SENTINELS.dashboard` / `/data/dashboard` and update or delete.

### Core nav defs

Replace Data group children on `MAIN_PLATFORM_NAV` and `SUPER_ADMIN_PLATFORM_NAV`:

```typescript
{
  kind: 'group',
  label: 'Data',
  children: [
    { kind: 'item', path: DATA_NAV_SENTINELS.tags, label: 'Tags', externalService: 'data', externalPath: '/tags' },
    { kind: 'item', path: DATA_NAV_SENTINELS.units, label: 'Units', externalService: 'data', externalPath: '/units' },
    { kind: 'item', path: DATA_NAV_SENTINELS.attributes, label: 'Attributes', externalService: 'data', externalPath: '/attributes' },
    { kind: 'item', path: DATA_NAV_SENTINELS.products, label: 'Products', externalService: 'data', externalPath: '/products' },
    { kind: 'item', path: DATA_NAV_SENTINELS.services, label: 'Services', externalService: 'data', externalPath: '/services' },
    { kind: 'item', path: DATA_NAV_SENTINELS.spaces, label: 'Spaces', externalService: 'data', externalPath: '/spaces' },
  ],
}
```

### Tests

Extend `packages/platform-nav/src/coreNav.test.ts`:

- Resolves six Data sub-nav URLs when `externalOrigins.data` is set (order: tags, units, attributes, products, services, spaces).
- `isDataNavSentinel` / `dataSentinelToExternalPath` cover all six paths.
- Member still omits Data group.
- Core Data group no longer includes dashboard / Data Catalog.

## WebOnOne v2 frontend

### Router / peer frame

`data/*` → `PlatformPeerFrame peer="data"` already exists. Update only:

1. `resolvePeerPath`: `dataSentinelToExternalPath(pathname) ?? '/tags'` (default first sub-item).
2. `navItems.ts`: icons for each sentinel (mirror Data standalone: Tag, Ruler, Shapes, Package, Wrench, Layers — do **not** reuse Mail for Tags).

No new env keys — `VITE_DATA_ORIGIN` already documented.

`AppLayout` / `routePrefetch` already use `isDataNavSentinel` — they pick up the new paths automatically once helpers expand.

### Optional cleanup

Remove icon / special-case for `DATA_NAV_SENTINELS.dashboard` if that sentinel is deleted.

## Data frontend (embed peer)

Confirm for 1.12.3 (pages already ship from 1.11.0):

| Check | Requirement |
|-------|-------------|
| Routes | `/tags`, `/units`, `/attributes`, `/products`, `/services`, `/spaces` render under embed outlet with **`FeaturePage`** |
| Content-ready | `usePlatformEmbedContentReady` so WebOnOne overlay dismisses correctly |
| Auth storage | Existing Data platform embed auth unchanged |
| CSP / allowed parents | WebOnOne already allowlisted from prior Data embed work |
| When Data shows core nav | Rewrite absolute Data URLs / path maps cover all six sentinels |

Optional: ensure `data/.../coreNavItems.ts` (or equivalent) icon map includes units / attributes / products / services / spaces if core nav is rewritten locally.

## Satellite outbound (Email / SMS / Identity)

`isDataNavSentinel` expansion is enough when nav `to` is already a sentinel. Identity (and any absolute-URL rewrite) must map peer paths:

| Data path | Sentinel |
|-----------|----------|
| `/tags` | `DATA_NAV_SENTINELS.tags` |
| `/units` | `DATA_NAV_SENTINELS.units` |
| `/attributes` | `DATA_NAV_SENTINELS.attributes` |
| `/products` | `DATA_NAV_SENTINELS.products` |
| `/services` | `DATA_NAV_SENTINELS.services` |
| `/spaces` | `DATA_NAV_SENTINELS.spaces` |

| File | Action |
|------|--------|
| `identity/.../shell/config/navItems.ts` | Extend `dataHrefToSentinel` (+ icons for six paths) |
| `email/.../shell/utils/externalNavActions.ts` (or coreNav rewrite) | Prefer `isDataNavSentinel` / map new `/data/*` sentinels |
| `sms/...` equivalent if SMS shows core nav with Data group | Same |

`redirectToData.ts` already uses `dataSentinelToExternalPath` — no signature change once the helper covers six paths.

## Behaviour after change

```text
User on WebOnOne (super admin or company admin)
  → expands Data → clicks Products
  → navigate('/data/products')
  → PlatformPeerFrame peer=data
  → iframe src = {dataOrigin}/products?embed=platform&parentOrigin&core_nav&theme
  → postMessage webonone:platform:init { accessToken }
  → Data PlatformEmbedLayout shows Products FeaturePage
  → sidebar/header stay on WebOnOne
```

```text
User on Email (platform mode)
  → clicks Data → Units
  → handleDataNavClick('/data/units')
  → POST Identity /auth/code
  → window.location → {dataOrigin}/units?code&return_url&core_nav=…
  → Data bootstrap exchanges code
  → Units page
```

## Role and data scoping

Nav visibility is role-based in `platform-nav` variants. **API scoping** remains entirely on Data BE (JWT roles / write rules from 1.11.x) — WebOnOne does not proxy Data APIs from the browser for these pages.

## Acceptance

| Step | Expected |
|------|----------|
| Super admin — Data group | Six children in order; each embeds correct Data path |
| Company admin — Data group | Same six children |
| Member | No Data group |
| WebOnOne → Tags | Iframe `/tags`; shell chrome remains |
| WebOnOne → Units / Attributes / Products / Services / Spaces | Matching iframe paths |
| Switch Tags → Products | Iframe path updates; no full WebOnOne reload |
| Email → Data → Spaces | Lands on Data `/spaces` (redirect) |
| Standalone Data | Unchanged admin nav (still has Dashboard) |
| Type-check | platform-nav, webonone-v2-root, data-root, touched satellites |

## ClickUp

Subtask TBD — Data catalog features left nav under WebOnOne.
