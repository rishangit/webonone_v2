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
| `media-embed/` | `@webonone/media-embed` | Media iframe embed URL builder + postMessage contract |
| `theme/` | `@webonone/theme` | System theme CSS variables, URL redirect handoff, embed postMessage |
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
npm run build -w @webonone/media-embed
npm run build -w @webonone/theme
```

Consumers resolve source via Vite alias during dev; production builds use `dist/`.
