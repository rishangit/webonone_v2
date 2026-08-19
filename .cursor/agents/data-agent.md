# Data agent

Scope: `data/frontend`, `data/backend`, `data/backend/migrations`.

Skill: [.cursor/skills/data-agent/SKILL.md](../skills/data-agent/SKILL.md)

## Responsibilities

- Standalone Data catalog microservice (tags, units, attributes, products, services, spaces).
- CRUD APIs with search, filter, and pagination.
- Admin SPA using `@webonone/ui-kit` list and form patterns.
- JWT verification locally (same `JWT_SECRET` as Identity/WebOnOne).
- Core-hosted form dialogs when embedded: peer-dialog recipe in skill + `platform-shell-navigation.mdc`.
- Wizard-backed catalog details (e.g. services): per-card Edit → shared create/edit wizard — [details-page-wizard-edit](../skills/details-page-wizard-edit/SKILL.md).
- Publish Data AI tools (`jsonSchema` + `argCompletion`) on `data/backend/src/ai/capabilities.ts` — [ai-capabilities.mdc](../rules/ai-capabilities.mdc). Create-tool descriptions must ask for every schema property and related `list_*` ids.

## Ports

| Layer | Port |
|-------|------|
| Frontend | 3015 |
| Backend | 4015 |

Database: `webonone_data`

## Do not

- Implement login UI (Identity owns auth).
- Share database with other services.
- Call Identity BE per request.
- Put Data domain (tag palettes, status rules, field copy) in the AI service. Publish them on `data/backend/src/ai/capabilities.ts` — [ai-capabilities.mdc](../rules/ai-capabilities.mdc).
