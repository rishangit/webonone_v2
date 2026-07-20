---
name: sms-agent
description: SMS service agent for webonone-platform. Handles sms/ frontend, backend, migrations and the mobile/ Expo gateway app — OTP, SMS templates, queue, and device gateway API. SMS is sent by a phone SIM (Android), not a server provider. Use when tasks touch sms/, mobile/, the SMS API, or WebOnOne/Identity SMS integration.
---

# SMS agent skill

## Scope

- `sms/frontend`, `sms/backend`, `sms/backend/migrations`
- `mobile/` — Expo app (React Native + RN Web): Identity login + Android SMS gateway
- Identity consumer (optional): `identity/backend/src/services/smsClient.service.ts` → `POST /internal/otp/send`

## Model

- **Server queues; devices send.** There is no server-side SMS provider. The Android gateway app polls `GET /device/messages`, sends via `SmsManager`, then reports status.
- **Scope is server-derived** from the JWT role: `super_admin` → `platform` device/queue, `company_admin` → `company`. Never read `scope`/`company_id` from a request body.
- **Template resolution:** company override (`scope=company, company_id`) wins over platform default (`scope=platform`). Unique key `(slug, scope, company_id)`.
- **Device auth:** `X-Sms-Device-Key` header; only the SHA-256 hash is stored. The raw key is returned exactly once at registration.
- **Internal auth:** `X-Sms-Service-Key` for `/internal/*` (send, otp/send, otp/verify).

## Rules

- [redux-store-and-epics.mdc](../../rules/redux-store-and-epics.mdc) — pages dispatch actions only
- [feature-store skill](../feature-store/SKILL.md) — catalog CRUD via `@webonone/store-kit` factories
- [form-creation skill](../form-creation/SKILL.md) — matching Zod validation FE + BE
- [item-list skill](../item-list/SKILL.md) — device/queue/history list rows
- [code-cleanliness.mdc](../../rules/code-cleanliness.mdc) — `@/` imports

## Ports and env

| Layer | Port | Env file |
|-------|------|----------|
| Frontend | 3016 | `sms/frontend/.env` |
| Backend | 4016 | `sms/backend/.env` |

`JWT_SECRET` must match Identity backend. Database: `webonone_sms`.
Key backend env: `SMS_SERVICE_API_KEY`, `OTP_TTL_SECONDS`, `OTP_MAX_ATTEMPTS`, `DEVICE_STALE_MS`, `PROCESSING_TIMEOUT_MS`.

## Key paths

- Migrations: `sms/backend/migrations/`
- Services: `sms/backend/src/services/` (`queue`, `template`, `otp`, `device`)
- Reaper worker: `sms/backend/src/workers/reaper.ts` (re-queues stuck `processing`, purges expired OTPs)
- Device API: `sms/backend/src/routes/device.routes.ts` (+ `deviceAuth` middleware)
- Admin UI: `sms/frontend/src/features/{dashboard,devices,queue,history,templates,send}/`
- Mobile: `mobile/src/features/{auth,gateway}/`, `mobile/modules/sms-sender`

## iOS note

Programmatic silent SMS sending is Android-only. The iOS build still logs in and administers, but shows an Android-only state on the gateway screen.

## Verification

```bash
npm run type-check -w sms-root
npm run migrate -w sms-root
npm run build -w sms-root
npm run type-check -w @webonone/mobile
```
