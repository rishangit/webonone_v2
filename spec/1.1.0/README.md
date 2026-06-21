# WebOnOne Platform — Specification (1.1.0)

Extends [1.0.0](../1.0.0/README.md) with a fourth **standalone microservice**: **Media** at `media.webonone.com`. Implementation follows [`.cursor/rules/README.md`](../../.cursor/rules/README.md) and [microservice-architecture.mdc](../../.cursor/rules/microservice-architecture.mdc).

## What changed from 1.0.0

| Area | 1.0.0 | 1.1.0 |
|------|-------|-------|
| Runnable services | Identity, WebOnOne v2, UI Kit showcase | + **Media** (`media/`) |
| Cross-service UI embed | Identity login only | + **Media picker / uploader** embed |
| Shared packages | `@webonone/platform-nav`, `@webonone/ui-kit` | + **`@webonone/media-embed`** (iframe + postMessage contract) |

## Projects

| Project | Folder | Runs alone | Contains |
|---------|--------|------------|----------|
| **Identity** | `identity/` | Yes | Auth UI, JWT issuance — unchanged from 1.0.0 |
| **WebOnOne v2** | `webonone-v2/` | Yes | Product shell — **consumes Media** |
| **UI Kit** | `ui-kit/` | Yes | Shared components — Media FE uses UI Kit |
| **Media** | `media/` | Yes | Frontend + backend + `webonone_media` — **new** |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Goals, scope, glossary |
| [02-architecture.md](./02-architecture.md) | Platform topology including Media |
| [03-media-project.md](./03-media-project.md) | Standalone Media service (API, DB, storage, UI) |
| [08-media-consumer-integration.md](./08-media-consumer-integration.md) | **Media ↔ consumer services** (iframe, postMessage, JWT, REST) |

## Inherited from 1.0.0

These remain authoritative; 1.1.0 does not replace them:

| Doc | Topic |
|-----|-------|
| [../1.0.0/03-identity-project.md](../1.0.0/03-identity-project.md) | Identity service |
| [../1.0.0/04-webonone-v2-project.md](../1.0.0/04-webonone-v2-project.md) | WebOnOne v2 scaffold |
| [../1.0.0/05-ui-kit-project.md](../1.0.0/05-ui-kit-project.md) | UI Kit |
| [../1.0.0/06-frontend-standards.md](../1.0.0/06-frontend-standards.md) | Shared front-end rules |
| [../1.0.0/07-identity-webonone-integration.md](../1.0.0/07-identity-webonone-integration.md) | Identity ↔ WebOnOne auth |

## Rules reference

| Topic | Rule |
|-------|------|
| Service boundaries | `microservice-architecture.mdc` |
| MySQL / nanoid | `mysql-database-architecture.mdc` |
| Express + JWT | `nodejs-express.mdc` |
| Feature folders | `front-end-structure.mdc` |
| React, Tailwind, Redux | `react-typescript.mdc`, `tailwind-css.mdc`, `redux-store-and-epics.mdc` |

## Local ports (1.1.0)

| Service | FE | BE | Production host |
|---------|----|----|-----------------|
| WebOnOne v2 | `:3000` | `:4000` | `app.webonone.com` |
| Identity | `:3001` | `:4001` | `identity.webonone.com` |
| UI Kit showcase | `:3002` | — | — |
| **Media** | **`:3003`** | **`:4003`** | **`media.webonone.com`** |
