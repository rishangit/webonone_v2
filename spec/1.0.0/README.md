# WebOnOne v2 — Specification (1.0.0)

Three **standalone projects** plus one **shared UI project**. Each runs independently on its own ports. Implementation follows [`.cursor/rules/README.md`](../../.cursor/rules/README.md).

## Projects

| Project | Folder | Runs alone | Contains |
|---------|--------|------------|----------|
| **Identity** | `identity/` | Yes | Frontend + backend + `identity_db` |
| **WebOnOne v2** | `webonone-v2/` | Yes (Identity also running for login) | Frontend + backend + `webonone_db` — **empty shell** in 1.0.0 |
| **UI Kit** | `ui-kit/` | Yes | Component library + **showcase app** |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Goals, scope, glossary |
| [02-architecture.md](./02-architecture.md) | Topology, iframe login, ports |
| [03-identity-project.md](./03-identity-project.md) | Standalone Identity project |
| [04-webonone-v2-project.md](./04-webonone-v2-project.md) | Empty core project + `/login` iframe |
| [05-ui-kit-project.md](./05-ui-kit-project.md) | Shared components + showcase |
| [06-frontend-standards.md](./06-frontend-standards.md) | Shared front-end rules |
| [07-identity-webonone-integration.md](./07-identity-webonone-integration.md) | **Identity ↔ WebOnOne connection** (iframe, postMessage, JWT) |

## Rules reference

| Topic | Rule |
|-------|------|
| Service boundaries | `microservice-architecture.mdc` |
| MySQL / nanoid | `mysql-database-architecture.mdc` |
| Express + JWT | `nodejs-express.mdc` |
| Feature folders | `front-end-structure.mdc` |
| React, Tailwind, Redux | `react-typescript.mdc`, `tailwind-css.mdc`, `redux-store-and-epics.mdc` |
