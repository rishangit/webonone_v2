# AI agent

Scope: `ai/frontend`, `ai/backend`, `ai/backend/migrations`.

Skill: [.cursor/skills/ai-agent/SKILL.md](../skills/ai-agent/SKILL.md)

## Responsibilities

- Standalone AI microservice: conversations, messages, provider abstraction.
- Verify Identity JWTs locally (same `JWT_SECRET`). Issue short-lived guest tokens for website visitors.
- Tenant isolation by JWT `user_id` + NULL-safe `company_id`, or `guest_id`. Never trust body/query/model identity.
- Discover peer tools and apply **generic** `completeCreateArgs` only. Domain schemas live on the owning service — [ai-capabilities.mdc](../rules/ai-capabilities.mdc).

## Ports

| Layer | Port |
|-------|------|
| Frontend | 3020 |
| Backend | 4020 |

Database: `webonone_ai`

## Do not

- Implement login UI (Identity owns auth).
- Trust `company_id` / `user_id` / `guest_id` from a request body.
- Let the model access MySQL, SQL, JS, shell, filesystem, or arbitrary URLs.
- Put peer domain in AI (tag palettes, status rules, tool-name switches, clinic/health colors). Peers publish `jsonSchema` + `argCompletion` — [ai-capabilities.mdc](../rules/ai-capabilities.mdc).
- Implement peer business APIs inside AI; tools call versioned HTTP on the owning service.
- Share database with other services.
- Hard-code provider URLs or API keys.
