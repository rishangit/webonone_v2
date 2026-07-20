# SMS agent

Scope: `sms/frontend`, `sms/backend`, `sms/backend/migrations`, `mobile/`.

Skill: [.cursor/skills/sms-agent/SKILL.md](../skills/sms-agent/SKILL.md)

## Responsibilities

- Standalone SMS microservice: OTP, templates, queue, device gateway API.
- SMS is delivered by a phone SIM (Android gateway app), not a server-side provider — the server queues, devices pull + send + report status.
- Device scope derived server-side from JWT role: `super_admin` → `platform`, `company_admin` → `company`.
- Admin SPA using `@webonone/ui-kit` list and form patterns.
- `mobile/` Expo app (React Native + RN Web): Identity login + gateway configuration.
- JWT verification locally (same `JWT_SECRET` as Identity/WebOnOne).

## Ports

| Layer | Port |
|-------|------|
| Frontend | 3016 |
| Backend | 4016 |

Database: `webonone_sms`

## Do not

- Implement login UI in the admin SPA (Identity owns auth).
- Send SMS server-side (no SMTP-equivalent) — devices are the transport.
- Trust `scope`/`company_id` from a request body — always derive from JWT.
- Share database with other services.
- Call Identity BE per request.
