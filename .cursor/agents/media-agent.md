# Media agent

Scope: `media/frontend`, `media/backend`, `media/backend/migrations`, `packages/media-embed` (Media-owned contract).

Skill: [.cursor/skills/media-agent/SKILL.md](../skills/media-agent/SKILL.md)

## Responsibilities

- Standalone Media microservice (upload, folders, public file URLs, embed picker/upload).
- `@webonone/media-embed` iframe + postMessage contract for consumers.
- JWT verification locally (same `JWT_SECRET` as Identity/WebOnOne).

## Ports

| Layer | Port |
|-------|------|
| Frontend | 3013 |
| Backend | 4013 |

## Do not

- Implement login UI (Identity owns auth).
- Store blobs in consumer databases.
- Call Identity BE per request.
