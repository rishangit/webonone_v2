# 02 — Data service scaffold (1.11.0)

Service layout, authentication, ports, and root workspace wiring. Mirrors [Email](../1.9.0/02-email-scaffold.md) and [Media](../../media/) patterns.

## Service folder layout

```text
data/
  package.json              # data-root — dev, build, migrate
  frontend/
    .env.example            # VITE_API_BASE_URL, VITE_IDENTITY_*, VITE_WEBONONE_*
    src/
      app/                  # AppLayout, router, store, LazyRoute
      features/
        auth/               # callback, JWT storage, identityConfig
        shell/              # navItems, buildAppNav
        tags/
        units/
        attributes/
        products/
        services/
        spaces/
        dashboard/          # optional summary counts
  backend/
    .env.example            # DATABASE_URL, PORT, JWT_SECRET
    migrations/
    src/
      config/env.ts
      middleware/auth.ts
      middleware/validateBody.ts
      routes/
      controllers/
      services/
      schemas/              # Zod per entity
  deploy/                   # IIS web.config + IIS.md
```

## Ports and env

| Layer | Port | Env file |
|-------|------|----------|
| Frontend | **3005** | `data/frontend/.env` |
| Backend | **4005** | `data/backend/.env` |

| Variable | Layer | Purpose |
|----------|-------|---------|
| `JWT_SECRET` | BE | Verify Identity-issued JWT (duplicate from Identity BE) |
| `DATABASE_URL` | BE | MySQL `webonone_data` |
| `PORT` | BE | `4005` local |
| `VITE_IDENTITY_ORIGIN` | FE | Login redirect |
| `VITE_IDENTITY_API_BASE_URL` | FE | Auth code exchange |
| `VITE_API_BASE_URL` | FE | `http://localhost:4005/api/v1` |
| `VITE_WEBONONE_ORIGIN` | FE | Return link when opened from core |
| `VITE_WEBONONE_API_BASE_URL` | FE | Role sync optional |
| `VITE_ALLOWED_PARENT_ORIGINS` | FE | postMessage allowlist if needed |

Reference: `email/frontend/src/features/auth/utils/identityConfig.ts`, `microservice-architecture.mdc`.

## Root workspace wiring

Add to root `package.json`:

- Workspaces: `data`, `data/frontend`, `data/backend`
- Scripts: `dev:data`, `install:data`, `build:data`
- Append `dev:data` to root `dev` concurrently command

## Package build chain

Data frontend imports `@webonone/ui-kit`, `@webonone/theme`, `@webonone/platform-nav`.

| Step | Location |
|------|----------|
| Root | `build:platform-nav`, `build:theme`, `build:ui-kit` |
| `data/package.json` `build` | Chain `npm run build:platform-nav --prefix .. && npm run build:theme --prefix .. && npm run build:ui-kit --prefix ..` before FE/BE builds |
| `data/frontend/vite.config.ts` | Aliases to package `src/` for dev |

## Authentication

1. Unauthenticated users → Identity `/login?redirect_uri={dataCallback}`.
2. `/callback` exchanges auth code for JWT (same pattern as Email/Media).
3. Data BE verifies `Authorization: Bearer` on all routes except `/health`.
4. JWT claims: `sub`, `email`; optional platform role from local `user_roles` copy.

## Roles and authorization

| Role | Access |
|------|--------|
| **Super admin** | Full CRUD on all entities |
| **Company admin** | Read all; create/edit `pending` items (optional 1.11.0 — default super_admin only for writes if role sync deferred) |
| **Member** | Read-only lists and detail |

**1.11.0 default:** Require `super_admin` for create/update/delete; authenticated read for all roles. Document extension point for company_admin in `user_roles` table.

## Left navigation

`data/frontend/src/features/shell/config/navItems.ts`:

| Label | Path | Notes |
|-------|------|-------|
| Dashboard | `/` | Entity counts by status |
| Tags | `/tags` | List + CRUD |
| Units of measure | `/units` | List + CRUD |
| Attributes | `/attributes` | List + CRUD |
| Products | `/products` | List + CRUD |
| Services | `/services` | List + CRUD |
| Spaces | `/spaces` | List + CRUD |

Use `@webonone/ui-kit` `AppShell` + `buildAppNav` pattern from Email.

## Health and standalone

```typescript
// GET /health — no auth
{ "status": "ok", "service": "data" }
```

Service must start when Identity is down; connected login degrades (redirect fails gracefully).

## Deploy

- Production origin: `https://data.webonone.com`
- API base: `https://data.webonone.com/api/v1`
- Follow `email/deploy/IIS.md` structure: Node handler, static FE, `web.config`.

## Acceptance (scaffold)

- [ ] `data/package.json` exposes `dev`, `build`, `migrate`
- [ ] Root `dev:data` and root `dev` include Data
- [ ] `frontend/.env.example` and `backend/.env.example` committed
- [ ] `backend/src/config/env.ts` loads only `backend/.env`
- [ ] `/health` returns 200 without JWT
