---
name: media-agent
description: Media service agent for webonone-platform. Handles media/ frontend, backend, migrations, and packages/media-embed — upload, picker embed, blob storage, JWT verify. Use when tasks touch media/, Media API, or consumer embed integration.
---

# Media agent skill

## Scope

- `media/frontend`, `media/backend`, `media/backend/migrations`
- `packages/media-embed/` (shared iframe + postMessage contract)

Specs: `spec/1.1.0/03-media-project.md`, `spec/1.1.0/08-media-consumer-integration.md`

## Ports and env

| Layer | Port | Env file |
|-------|------|----------|
| Frontend | 3013 | `media/frontend/.env` |
| Backend | 4013 | `media/backend/.env` |

`JWT_SECRET` must match Identity backend.

## Rules

- [redux-store-and-epics.mdc](../../rules/redux-store-and-epics.mdc) — media features use slice + epics for folder/picker/upload API I/O

## Key paths

- Embed hooks: `media/frontend/src/features/media/hooks/`
- API routes: `media/backend/src/routes/`
- Storage: `media/backend/src/services/storage.service.ts`
- Shared contract: `packages/media-embed/src/`

## Verification

```bash
npm run type-check -w media-root
npm run migrate -w media-root
```

Consumer integration (WebOnOne demo): `webonone-v2/frontend/src/features/media/`
