# 01 — Overview (1.12.3)

## Vision

Platform operators manage reference catalog data the same way they manage Email and SMS: from the **WebOnOne** left sidebar, without bookmarking the Data origin. WebOnOne keeps the chrome (sidebar + header); Data pages load **in-place** in `#main-content` via the platform iframe embed channel.

## User story

As a super admin or company admin on WebOnOne, I want a **Data** menu in the left navigation with **Tags**, **Units**, **Attributes**, **Products**, **Services**, and **Spaces**, so I can administer the Data catalog without leaving the core shell — the same experience as **Email → Send / Queue / History / Templates** and **SMS → Send / Devices / Queue / History / Templates**.

## Goals (1.12.3)

1. **Expand Data nav group** in `@webonone/platform-nav` for `main` (company admin) and `superAdmin` variants — not shown for `member`.
2. **Six sub-items** map to Data service routes:

   | Core label | Sentinel (WebOnOne path) | Data external path |
   |------------|--------------------------|--------------------|
   | Tags | `/data/tags` | `/tags` |
   | Units | `/data/units` | `/units` |
   | Attributes | `/data/attributes` | `/attributes` |
   | Products | `/data/products` | `/products` |
   | Services | `/data/services` | `/services` |
   | Spaces | `/data/spaces` | `/spaces` |

3. **Embed channel unchanged** — local `navigate` to sentinels → `PlatformPeerFrame` peer `data` → iframe (JWT via `postMessage`).
4. **Peer config** — reuse existing `VITE_DATA_ORIGIN` + `webonone-v2/.../data/utils/dataConfig.ts` (no new env keys).
5. **Satellite hops** — Email / SMS / Identity AppLayouts intercept expanded Data sentinels with auth-code redirect (same pattern as 1.11.2 / 1.12.1).
6. **No Data page duplication** — WebOnOne does not reimplement list/editor pages; Data FE owns UI + API.

## Scope (1.12.3)

### In scope

- `packages/platform-nav`: extend `DATA_NAV_SENTINELS`, helpers, Data group children on `MAIN_PLATFORM_NAV` and `SUPER_ADMIN_PLATFORM_NAV`; remove **Data Catalog** (`/data/dashboard` → `/`) from the **core** Data group
- `webonone-v2/frontend`: icons for six sentinels; `PlatformPeerFrame` data default → `/tags`
- `data/frontend`: confirm six list routes work under embed (`FeaturePage` + content-ready); optional icon polish on core nav rewrite
- Email / SMS / Identity frontends: path→sentinel maps for the new Data children when rewriting absolute Data URLs
- Unit tests in `platform-nav` for six Data URL resolutions

### Out of scope

- New Data backend APIs or schema changes (reuse 1.11.0)
- Adding Dashboard (Data Catalog) to the **core** Data group (remains standalone-Data-only, same as Email/SMS Dashboard exclusion)
- Member-facing Data UI in WebOnOne core nav
- Email or SMS nav changes
- Nested editor deep-links as separate core nav items (`/tags/new`, `/products/:id`, etc.) — list sentinels only; in-iframe navigation within Data FE handles editors

## Glossary

| Term | Definition |
|------|------------|
| **Sentinel path** | Core-shell path such as `/data/tags` that WebOnOne routes to an iframe peer, not a local page |
| **Embed channel** | WebOnOne owns chrome; peer loads in iframe with `embed=platform` + JWT `postMessage` |
| **Redirect channel** | Full-page auth-code hop used from satellites (and bookmarks) to Data origin |
| **Data peer** | `data` value of `PlatformPeerId` / `ExternalServiceId` |

## Success criteria

1. Super admin and company admin see **Data** group with the six sub-items in WebOnOne left nav (that order); members do not.
2. Each sub-item loads the correct Data list page inside the shell (sidebar/header stay mounted).
3. Switching between Data sub-items updates the iframe path without full-page reload of WebOnOne.
4. From Email or SMS platform mode, clicking a Data sub-item lands on the matching Data route (auth-code redirect).
5. Standalone `npm run dev:data` nav and routes unchanged (still includes Dashboard).
6. `npm run type-check` passes for `platform-nav`, `webonone-v2-root`, `data-root`, and touched satellite roots.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — Spec No 1.12.3 | TBD | All docs |
| Subtask — Data catalog left nav in WebOnOne | TBD | [02-webonone-data-catalog-nav.md](./02-webonone-data-catalog-nav.md) |
