# 01 — Overview

## Vision

WebOnOne v2 is split into **three runnable projects** and one **shared UI library**. Identity and WebOnOne v2 each ship their own frontend, backend, and database. WebOnOne v2 starts as an **empty project**; login is delegated to Identity via an **iframe**.

## Goals (1.0.0)

1. **Identity runs standalone** — own UI, API, and MySQL database.
2. **WebOnOne v2 runs standalone** — own UI, API, and MySQL database; works while Identity is running.
3. **Login via iframe** — WebOnOne v2 route `/login` embeds Identity’s login page; no duplicate login UI in WebOnOne.
4. **UI Kit runs standalone** — showcase app lists every shared component.
5. **Shared UI only from UI Kit** — Identity and WebOnOne v2 import `@webonone/ui-kit`; no local copies of Button, Input, etc.

## Scope (1.0.0)

### In scope

- Identity: register, login, reset password, JWT, own database.
- WebOnOne v2: empty app shell, health/home route, `/login` iframe host, JWT verification on API.
- UI Kit: component library + runnable showcase.
- Iframe + `postMessage` + JWT contract between WebOnOne and Identity (see [07-identity-webonone-integration.md](./07-identity-webonone-integration.md)).

### Out of scope

- Sites, pages, page builder, accounts (future WebOnOne features).
- API gateway (each project exposes its own API).
- OAuth / MFA.
- Shared database across projects.

## Glossary

| Term | Definition |
|------|------------|
| **Identity** | Standalone auth project (`identity/`) |
| **WebOnOne v2** | Standalone core product shell (`webonone-v2/`) — empty in 1.0.0 |
| **UI Kit** | Shared components (`ui-kit/`) + showcase |
| **Embed mode** | Identity `/login?parentOrigin=...` — same route as standalone, minimal layout + `postMessage` |

## Success criteria

- `npm run dev` in each project starts frontend + backend + database connection independently.
- WebOnOne `/login` shows Identity login inside an iframe; successful login loads WebOnOne home with a welcome message.
- UI Kit showcase runs alone and displays all exported components.
- Identity and WebOnOne frontends use `@webonone/ui-kit` for base UI.
