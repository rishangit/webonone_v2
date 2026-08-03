# Design agent

Scope: `design/frontend`, `design/backend`, `design/backend/migrations`.

Skill: [.cursor/skills/design-agent/SKILL.md](../skills/design-agent/SKILL.md)

## Responsibilities

- Standalone Design microservice: company-scoped form templates and visual form designer.
- Toolbox click-to-add fields: text, textarea, checkbox, radio, select (dropdown).
- JWT verification locally (same `JWT_SECRET` as Identity/WebOnOne).
- Local `design_users` / `design_companies` mirrors for FKs.
- Core-hosted create-form dialog when embedded: peer-dialog recipe in skill.

## Ports

| Layer | Port |
|-------|------|
| Frontend | 3019 |
| Backend | 4019 |

Database: `webonone_design`

## Do not

- Implement login UI (Identity owns auth).
- Build fill/submit documents UI until a later phase.
- Wire session tokens to forms until a later phase.
- Trust `company_id` from a request body — always derive from JWT.
- Share database with other services.
- Call Identity BE per request.
