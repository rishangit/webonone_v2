# SMS agent

Scope: `sms/frontend`, `sms/backend`, `sms/backend/migrations`, `mobile/`.

Skill: [.cursor/skills/sms-agent/SKILL.md](../skills/sms-agent/SKILL.md)

## Responsibilities

- Standalone SMS microservice: OTP, templates, queue, device gateway API, Text.lk provider.
- Delivery is per-scope: **mobile device** (Android SIM) **or** **Text.lk API** — mutually exclusive. Default is mobile when no gateway config exists.
- Device/gateway scope derived server-side from JWT role: `super_admin` → `platform`, `company_admin` → `company`.
- Admin SPA using `@webonone/ui-kit` list and form patterns.
- `mobile/` Expo app (React Native + RN Web): Identity login + gateway configuration.
- JWT verification locally (same `JWT_SECRET` as Identity/WebOnOne).
- Core-hosted template dialogs when embedded: peer-dialog recipe in skill + `platform-shell-navigation.mdc`.

## Ports

| Layer | Port |
|-------|------|
| Frontend | 3016 |
| Backend | 4016 |

Database: `webonone_sms`

## Do not

- Implement login UI in the admin SPA (Identity owns auth).
- Trust `scope`/`company_id` from a request body — always derive from JWT.
- Return Text.lk API tokens to the frontend after save.
- Share database with other services.
- Call Identity BE per request.
