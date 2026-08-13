---
name: sms-agent
description: >-
  SMS service agent for webonone-platform. Handles sms/ frontend, backend,
  migrations and the mobile/ Expo gateway app — OTP, SMS templates, queue, and
  device or Text.lk gateway delivery. Use when tasks touch sms/, mobile/, the
  SMS API, WebOnOne/Identity SMS integration, or SMS template/create/edit
  dialog boxes — also read core-hosted-peer-dialog and dialog-windows for any
  dialog or modal.
---

# SMS agent skill

## Scope

- `sms/frontend`, `sms/backend`, `sms/backend/migrations`
- `mobile/` — Expo app (React Native + RN Web): Identity login + Android SMS gateway
- Identity consumer (optional): `identity/backend/src/services/smsClient.service.ts` → `POST /internal/otp/send`

## Model

- **Server queues; delivery is per-scope.** Super-admin (platform) and company-admin each choose **one** mode: **mobile device** (Android app + SIM) or **Text.lk API**. Modes are mutually exclusive. No row in `sms_gateway_config` defaults to mobile device.
- **Mobile:** Android gateway app polls `GET /device/messages`, sends via `SmsManager`, then reports status.
- **Text.lk:** provider worker claims pending rows and `POST`s `https://app.text.lk/api/v3/sms/send` (Bearer token). API token and sender ID are stored per scope in `sms_gateway_config` (AES-256-GCM). Token is never returned to the frontend (`hasApiToken` only). Admins configure this on **Devices → Settings** (not via env vars).
- **Scope is server-derived** from the JWT role: `super_admin` → `platform` device/queue/gateway, `company_admin` → `company`. Never read `scope`/`company_id` from a request body.
- **Template resolution:** company override (`scope=company, company_id`) wins over platform default (`scope=platform`). Unique key `(slug, scope, company_id)`.
- **Device auth:** `X-Sms-Device-Key` header; only the SHA-256 hash is stored. The raw key is returned exactly once at registration.
- **Internal auth:** `X-Sms-Service-Key` for `/internal/*` (send, otp/send, otp/verify). Gateway status is configured when Text.lk is ready **or** an approved mobile device exists.

## Rules

- [redux-store-and-epics.mdc](../../rules/redux-store-and-epics.mdc) — pages dispatch actions only
- [feature-store skill](../feature-store/SKILL.md) — catalog CRUD via `@webonone/store-kit` factories
- [form-creation skill](../form-creation/SKILL.md) — matching Zod validation FE + BE
- [item-list skill](../item-list/SKILL.md) — device/queue/history list rows
- [details-page-cards skill](../details-page-cards/SKILL.md) — multi-section details/profile pages
- [platform-shell-navigation.mdc](../../rules/platform-shell-navigation.mdc) — embed in WebOnOne; core-hosted peer dialogs
- [dialog-windows.mdc](../../rules/dialog-windows.mdc) — CustomDialog header/body/footer; peer-dialog chrome split
- [code-cleanliness.mdc](../../rules/code-cleanliness.mdc) — `@/` imports

## Ports and env

| Layer | Port | Env file |
|-------|------|----------|
| Frontend | 3016 | `sms/frontend/.env` |
| Backend | 4016 | `sms/backend/.env` |

`JWT_SECRET` must match Identity backend. Database: `webonone_sms`.
Key backend env: `SMS_SERVICE_API_KEY`, `SMS_GATEWAY_ENCRYPTION_KEY`, `OTP_TTL_SECONDS`, `OTP_MAX_ATTEMPTS`, `DEVICE_STALE_MS`, `PROCESSING_TIMEOUT_MS`.

## Core-hosted form dialogs

Template create/edit dialogs use **peer-dialog** when embedded in WebOnOne: host owns sizes/header/footer; `/embed/dialogs/templates/…` is body-only.

**Follow:** [core-hosted-peer-dialog skill](../core-hosted-peer-dialog/SKILL.md) · [platform-shell-navigation.mdc](../../rules/platform-shell-navigation.mdc)

Reference: `sms/frontend/src/features/templates/components/TemplateFormDialog.tsx`, `…/pages/TemplateFormEmbedPage.tsx`.

## Key paths

- Migrations: `sms/backend/migrations/`
- Services: `sms/backend/src/services/` (`queue`, `template`, `otp`, `device`, `gatewayConfig`, `textLkProvider`)
- Workers: `sms/backend/src/workers/reaper.ts`, `providerWorker.ts`
- Device API: `sms/backend/src/routes/device.routes.ts` (+ `deviceAuth` middleware)
- Gateway API: `sms/backend/src/routes/gateway.routes.ts`
- Admin UI: `sms/frontend/src/features/{dashboard,devices,queue,history,templates,send}/` — gateway mode/credentials live on Devices → Settings (`GatewaySettingsCard`)
- Mobile: `mobile/src/features/{auth,gateway}/`, `mobile/modules/sms-sender`

## iOS note

Programmatic silent SMS sending is Android-only. The iOS build still logs in and administers, but shows an Android-only state on the gateway screen. Text.lk mode does not require the mobile app.

## Verification

```bash
npm run type-check -w sms-root
npm run migrate -w sms-root
npm run build -w sms-root
npm run type-check -w @webonone/mobile
```
