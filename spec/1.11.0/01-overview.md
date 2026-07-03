# 01 — Overview (1.11.0)

## Vision

Platform services need shared reference data — tags, measurable attributes, products, services, and spaces — with consistent status workflows and discoverability. A dedicated **Data** microservice owns this catalog: standalone admin UI, versioned REST API, and MySQL persistence. Consumers (WebOnOne, future services) integrate via JWT-authenticated HTTP — never by querying Data's database directly.

## User story

As a developer, I want a standalone data service that manages all predefined data (tags, attributes, products, services, spaces, units of measure) so that other services have flexible, reusable reference data for the platform core.

## Goals (1.11.0)

1. **Standalone service** — `data/` runs with `npm run dev` (FE + BE + DB); `/health` without peer services.
2. **Six entity types** — Tags, Units of measure, Attributes, Products, Services, Spaces — each with full CRUD.
3. **Status workflow** — Every entity supports `verified` | `pending` (extensible enum in DB).
4. **List UX** — Search, filter (status, tags, text), and server-side pagination on every collection.
5. **Platform alignment** — Identity auth-code login, `@webonone/ui-kit` shell, `@webonone/theme` accents, microservice env conventions.
6. **Deploy target** — `data.webonone.com` (IIS pattern matching Email/Media).

## Entity summary (from ClickUp)

| Entity | Fields |
|--------|--------|
| **Tag** | Name, Description, Color, Status (`verified` \| `pending`) |
| **Unit of measure** | Name, Symbol, Base unit (boolean or FK to canonical UOM), Status |
| **Attribute** | Name, Description, Value data type (`number` \| `text`), Unit of measure (optional FK), Status |
| **Product** | Name, Description, Tags (M:N), Attributes list (M:N with values), Status |
| **Service** | Name, Description, Tags (M:N), Attributes list (M:N with values), Status |
| **Space** | Name, Description, Tags (M:N), Attributes list (M:N with values), Status |

## Scope (1.11.0)

### In scope

- New `data/` microservice scaffold (frontend, backend, migrations, deploy stub).
- MySQL schema and Knex migrations for all six entities and junction tables.
- REST API `/api/v1/...` with Zod validation, JWT auth, list query params (`q`, `status`, `page`, `pageSize`, entity-specific filters).
- Admin SPA: left nav per entity type; list + create/edit forms; `ItemList`, `Pagination`, `ListFilterPanel`.
- Root workspace wiring (`dev:data`, `build:data`).
- WebOnOne core nav **Data** link (redirect handoff).
- IIS deploy notes for `data.webonone.com`.

### Out of scope (1.11.0)

- Event bus / `UserRegistered`-style sync to consumers (future spec).
- Embedding Data picker in other SPAs via iframe (future; API read is sufficient for 1.11.0).
- Import/export CSV, bulk approve, audit trail beyond `updated_at`.
- Company-scoped data partitions (global catalog in 1.11.0; `company_id` nullable column reserved for future).
- GraphQL or public unauthenticated API.

## Glossary

| Term | Definition |
|------|------------|
| **Reference data** | Platform-managed catalog entries reused across services |
| **Verified** | Approved for use in downstream features |
| **Pending** | Draft or awaiting review |
| **Attribute value** | Typed value on Product/Service/Space link row (`number` or `text` per attribute definition) |
| **Base unit** | Canonical UOM; other UOMs may reference it for conversion (display only in 1.11.0) |

## Success criteria

1. `npm run dev:data` starts Data FE (:3005) and BE (:4005) without other services (Identity optional for login).
2. `GET /health` returns 200 on Data BE alone.
3. CRUD works for all six entity types via API and admin UI.
4. List endpoints return `{ items, total, page, pageSize }` with search and status filter.
5. JWT from Identity is verified locally on Data BE; login flow matches Email/Media.
6. `npm run build -w data-root` succeeds with package `dist/` chain (`platform-nav`, `theme`, `ui-kit`).
7. `npm run type-check -w data-root` passes.
8. WebOnOne nav opens Data origin with auth-code handoff.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — Data microservice | 86ey5f6vq | All docs |

### Source requirements (from ClickUp parent)

1. CRUD for tags, units of measure, attributes, products, services, spaces.
2. Search and filter features on collections.
3. Pagination on lists.
4. Deploy as `data.webonone.com`.
5. Align with platform rules, theme, and accents.
