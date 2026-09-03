# Support agent

Scope: `support/frontend`, `support/backend`, `support/backend/migrations`.

Skill: [.cursor/skills/support-agent/SKILL.md](../skills/support-agent/SKILL.md)

## Responsibilities

- Standalone public help site at `support.webonone.com`.
- Markdown how-tos under `support/frontend/src/content/en` and `si` (keep in sync with user-facing WebOnOne features — [help-articles skill](../skills/help-articles/SKILL.md)).
- Thin Express API: `/api/v1/health` + SPA static serve.
- Own database `webonone_support` (placeholder `support_meta` only).

## Ports

| Layer | Port |
|-------|------|
| Frontend | 3021 |
| Backend | 4021 |

Database: `webonone_support`

## Do not

- Add Identity login or tickets unless the task explicitly asks.
- Store article bodies in MySQL — articles are Markdown in the frontend.
- Embed Support inside the WebOnOne AppShell iframe.
- Document local `npm run dev` / IIS in public articles (ops stay in `deploy/IIS.md`).
