# Shared packages

Cross-service libraries that are **not** microservices and **not** UI Kit.

| Location | Purpose | Examples |
|----------|---------|----------|
| **`packages/`** | Versioned contracts and platform utilities | `@webonone/platform-nav` |
| **`ui-kit/`** | Visual components and layouts | `@webonone/ui-kit` |
| **`identity/`, `webonone-v2/`, …** | Standalone microservices | Auth, product shell |

## npm naming

All packages here use the `@webonone/` scope:

| Folder | Package | Purpose |
|--------|---------|---------|
| `platform-nav/` | `@webonone/platform-nav` | Cross-service redirect, auth code handoff, return URL |
| `platform-embed/` | `@webonone/platform-embed` | Platform iframe/JWT contract, host-dialog bridge, Identity user-picker frame, shared service auth storage |
| `media-embed/` | `@webonone/media-embed` | Media iframe embed URL builder + postMessage contract |
| `theme/` | `@webonone/theme` | System theme CSS variables, URL redirect handoff, embed postMessage |
| `store-kit/` | `@webonone/store-kit` | Redux Toolkit slice + redux-observable epics factories for list/detail CRUD (`createCatalogFeatureStore`, `createPaginatedFeatureStore`), cache utils, catalog hooks |
| *(future)* `event-schemas/` | `@webonone/event-schemas` | Shared event DTO types |
| *(future)* `api-types/` | `@webonone/api-types` | REST contract types |

**Prefix rule:** `platform-*` for cross-cutting mechanics; domain names for business contracts.

## Adding a new package

1. Create `packages/<name>/` with `package.json` (`name`: `@webonone/<name>`).
2. Root workspaces already include `"packages/*"` — no root edit needed.
3. Add `"@webonone/<name>": "*"` to consuming service frontends/backends.
4. Run `npm install` from repo root.
5. Build: `npm run build -w @webonone/<name>`.

## Build

```bash
npm run build -w @webonone/platform-nav
npm run build -w @webonone/platform-embed
npm run build -w @webonone/media-embed
npm run build -w @webonone/theme
npm run build -w @webonone/store-kit
```

## Store kit

`@webonone/store-kit` is build-time state plumbing (no domain logic, no store instance) shared across service frontends. Consumers add the workspace dep, alias `@webonone/store-kit` to its `src/` in `vite.config.ts` (dev), and chain `build:store-kit` before the frontend build (prod). Standard list/detail CRUD features use `createCatalogFeatureStore`; list-only reads use `createPaginatedFeatureStore`. See [redux-store-and-epics.mdc](../.cursor/rules/redux-store-and-epics.mdc) and the [feature-store skill](../.cursor/skills/feature-store/SKILL.md).

## Identity user picker

`@webonone/platform-embed` exposes `IdentityUserPickerFrame` for consumers that
need to select a canonical Identity user. The consumer supplies
`identityOrigin`, its own `parentOrigin`, a request `scope`, and its access token
when available. The token is delivered with `postMessage`; it is never included
in the iframe URL. An existing non-expired Identity browser session can also
authenticate the frame. Identity owns `/user-picker`, validates the parent
origin, queries its own user directory, and returns a typed select or cancel
message.

Consumer frontends configure only `VITE_IDENTITY_ORIGIN` (and their normal
Identity API base where otherwise required). The picker path is derived by
`buildIdentityUserPickerUrl`; do not add a per-route environment variable.
Identity must include each consumer origin in `VITE_ALLOWED_PARENT_ORIGINS`;
local showcase development uses `http://localhost:3012`.

Consumers resolve source via Vite alias during dev; production builds use `dist/`.
