# WebOnOne Platform — Specification (1.2.0)

Extends [1.1.0](../1.1.0/README.md) with **WebOnOne core app shell** (responsive left navigation) and **System Theme** (user-created accent palettes, light/dark mode, cross-service styling). Implementation follows [`.cursor/rules/README.md`](../../.cursor/rules/README.md) and [microservice-architecture.mdc](../../.cursor/rules/microservice-architecture.mdc).

**Database naming:** the WebOnOne core live database is **`webonone_v2`** (MySQL schema name). The service folder is `webonone-v2/`. Earlier specs used `webonone_db`; 1.2.0 and onward use `webonone_v2` only.

## What changed from 1.1.0

| Area | 1.1.0 | 1.2.0 |
|------|-------|-------|
| WebOnOne layout | `PageShell` — header + centered content | **`AppShell`** — header + collapsible left nav + main content |
| Navigation | Inline links only | **Icon + label nav**, Settings submenu, mobile drawer |
| Theming | Static UI Kit tokens in `globals.css` | **System Theme** — DB-backed palettes, light/dark mode, runtime CSS variables |
| Dialogs | Ad-hoc or none | **`Dialog`** component — shared `sm` / `md` / `lg` / `xl` sizes for forms and confirms |
| Cross-service styling | Each FE uses same static UI Kit preset | **Theme propagation** — iframe `postMessage` + **URL redirect query params** |
| Shared packages | `platform-nav`, `media-embed`, `ui-kit` | + **`@webonone/theme`**; `platform-nav` gains login `extraSearchParams` |
| `webonone_v2` | References only (media) | + **`system_themes`**, **`user_preferences`** |

## Projects affected

| Project | Role in 1.2.0 |
|---------|----------------|
| **WebOnOne v2** | Owns theme CRUD API, preferences, app shell routes, nav config |
| **UI Kit** | `AppShell`, `AppSidebar`, nav primitives, **`Dialog` (sized)**, theme-aware tokens, scrollbar styles |
| **Identity** | Embed `postMessage` listener + URL redirect theme bootstrap |
| **Media** | Embed `postMessage` listener + URL redirect theme bootstrap |
| **`packages/theme`** | Shared theme DTO, CSS mapping, embed + redirect helpers |
| **`packages/platform-nav`** | `extraSearchParams` on login redirect (theme handoff) |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Goals, scope, glossary, success criteria |
| [02-architecture.md](./02-architecture.md) | Topology, ownership, connection layers |
| [03-app-shell-navigation.md](./03-app-shell-navigation.md) | Left nav, hamburger, collapse, Settings menu |
| [04-system-theme.md](./04-system-theme.md) | Theme model, colors, light/dark, DB, API, UI |
| [05-theme-propagation.md](./05-theme-propagation.md) | Core → peers: iframe + URL redirect, CSS contract |
| [08-theme-url-redirect-integration.md](./08-theme-url-redirect-integration.md) | **Theme ↔ `@webonone/platform-nav` redirect** (auth-code, login, relay) |
| [06-ui-kit-extensions.md](./06-ui-kit-extensions.md) | New layouts, token mapping, component coverage |
| [07-webonone-v2-implementation.md](./07-webonone-v2-implementation.md) | Routes, features, migrations, acceptance criteria |

## Inherited from earlier specs

These remain authoritative; 1.2.0 does not replace them:

| Doc | Topic |
|-----|-------|
| [../1.0.0/03-identity-project.md](../1.0.0/03-identity-project.md) | Identity service |
| [../1.0.0/06-frontend-standards.md](../1.0.0/06-frontend-standards.md) | Shared front-end rules |
| [../1.0.0/07-identity-webonone-integration.md](../1.0.0/07-identity-webonone-integration.md) | Identity ↔ WebOnOne auth |
| [../1.1.0/03-media-project.md](../1.1.0/03-media-project.md) | Media service |
| [../1.1.0/08-media-consumer-integration.md](../1.1.0/08-media-consumer-integration.md) | Media ↔ consumer embed |

## Rules reference

| Topic | Rule |
|-------|------|
| Service boundaries | `microservice-architecture.mdc` |
| MySQL / nanoid | `mysql-database-architecture.mdc` |
| Express + JWT | `nodejs-express.mdc` |
| Tailwind + tokens | `tailwind-css.mdc` |
| UI Kit scope | `ui-kit-project.mdc` |
| WebOnOne scope | `webonone-v2-project.mdc` |

## Local ports (unchanged)

| Service | FE | BE |
|---------|----|----|
| WebOnOne v2 | `:3000` | `:4000` |
| Identity | `:3001` | `:4001` |
| UI Kit showcase | `:3002` | — |
| Media | `:3003` | `:4003` |
