# Data agent

Scope: `data/frontend`, `data/backend`, `data/backend/migrations`.

Skill: [.cursor/skills/data-agent/SKILL.md](../skills/data-agent/SKILL.md)

## Responsibilities

- Standalone Data catalog microservice (tags, units, attributes, products, services, spaces).
- CRUD APIs with search, filter, and pagination.
- Admin SPA using `@webonone/ui-kit` list and form patterns.
- JWT verification locally (same `JWT_SECRET` as Identity/WebOnOne).

## Ports

| Layer | Port |
|-------|------|
| Frontend | 3005 |
| Backend | 4005 |

Database: `webonone_data`

## Do not

- Implement login UI (Identity owns auth).
- Share database with other services.
- Call Identity BE per request.
