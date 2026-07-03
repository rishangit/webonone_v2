---
name: data-agent
description: Data service agent for webonone-platform. Handles data/ frontend, backend, migrations — catalog CRUD for tags, units, attributes, products, services, spaces. Use when tasks touch data/, Data API, or WebOnOne Data nav handoff.
---

# Data agent skill

## Scope

- `data/frontend`, `data/backend`, `data/backend/migrations`
- WebOnOne consumer: `webonone-v2/frontend/src/features/data/`
- Platform nav: `packages/platform-nav/src/coreNav.ts` (Data external service)

## Ports and env

| Layer | Port | Env file |
|-------|------|----------|
| Frontend | 3005 | `data/frontend/.env` |
| Backend | 4005 | `data/backend/.env` |

`JWT_SECRET` must match Identity backend. Database: `webonone_data`.

## Key paths

- API routes: `data/backend/src/routes/`
- Services: `data/backend/src/services/`
- Admin UI: `data/frontend/src/features/{tags,units,attributes,products,services,spaces}/`
- WebOnOne config: `webonone-v2/frontend/src/features/data/utils/dataConfig.ts`

## Verification

```bash
npm run type-check -w data-root
npm run migrate -w data-root
npm run build -w data-root
```

Platform nav handoff: WebOnOne `AppLayout` → `redirectToData.ts` with `VITE_DATA_ORIGIN`.
