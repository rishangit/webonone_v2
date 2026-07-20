# 01 — Overview (1.12.0)

## Vision

The platform gains the ability to send **SMS text messages and OTPs** without a paid SMS aggregator. A standalone **SMS microservice** owns queueing, OTP generation/verification, templates, and a device API. The actual sender is an **Android phone running the WebOnOne mobile app**: it registers as a gateway device, pulls pending messages by polling, and sends each one over its real SIM (Dialog / Mobitel / Hutch / Airtel), then reports delivery status back.

The mobile app is used by two kinds of operator:

- **Super admin** — sets up one or more **platform** devices to send **system SMS** (e.g. verification/OTP for the platform itself).
- **Company owner/admin** — sets up their **own** device(s) to send **their company's SMS**, using their company's SIM.

## User story

As a system operator or company owner on the WebOnOne platform, I want to install a mobile app, log in, and turn my phone into an SMS gateway, so that the platform can send OTPs and text messages to customers over my own SIM — with system SMS routed to platform devices and each company's SMS routed to that company's own devices — without paying an SMS aggregator or coupling other services to a provider.

## Goals (1.12.0)

1. **Standalone SMS service** — `sms/frontend`, `sms/backend`, `sms/backend/migrations`, own MySQL schema `webonone_sms`; `npm run dev:sms` and `/health` without other services.
2. **Identity auth handoff** — JWT from Identity; role claims (`platform_role`, `company_id`) drive nav, device scope, and API authorization.
3. **Queue + OTP engine** — enqueue text/OTP messages; generate + verify hashed OTPs; retries and history; a lightweight reaper worker.
4. **Device API** — register/approve/revoke devices; device polling to claim messages; delivery status callback; heartbeat/online tracking.
5. **Scope routing** — platform devices send system SMS (`company_id` null); company devices send that company's SMS.
5b. **Templates for system + companies** — super admin owns platform default templates; company owners author their own company templates and override platform defaults for their company (see [06-sms-templates.md](./06-sms-templates.md)).
6. **Mobile app (v1)** — Expo (RN + RN Web) app: login, register this phone as a gateway, select SIM, run an Android foreground service that sends queued SMS. Built with gluestack-ui + NativeWind on shared theme tokens.
7. **Admin UI** — SMS service FE: Dashboard, Devices, Queue, History, Templates, Send/Test — role-gated.

## Scope (1.12.0)

### In scope

- New `sms/` workspace registered in root `package.json` (FE **3016**, BE **4016**).
- New `mobile/` Expo workspace (login + SMS gateway configuration only).
- DB tables: users mirror (id only), companies mirror, devices, templates (+ versions), queue, history, OTPs, audit log.
- Internal API: `POST /api/v1/internal/send`, `POST /api/v1/internal/otp/send`, `POST /api/v1/internal/otp/verify` (service key).
- Public API: JWT-protected send/test, OTP send/verify, device admin (approve/revoke), templates CRUD, queue/history read — scoped by role.
- Templates: platform (system) defaults owned by super admin + company-authored templates and per-company overrides — scope/`company_id` server-derived (see [06-sms-templates.md](./06-sms-templates.md)).
- Device API: register, heartbeat, claim messages, report status (device key auth).
- Android native SMS send via `SmsManager`; multi-SIM selection via `SubscriptionManager`; `SEND_SMS` permission; foreground service.

### Out of scope (1.12.0)

- Mobile app features for other services (media, data, email, core) — deferred; shell is built to add them later.
- iOS SMS gateway sending (Apple forbids programmatic SMS) — iOS shows an unsupported state.
- Delivery receipts from the telco / two-way inbound SMS handling (basic sent/failed only for v1).
- Load balancing across many devices beyond simple scope routing + round-robin claim.
- Paid SMS aggregator fallback (Twilio etc.).

## Glossary

| Term | Definition |
|------|------------|
| **Gateway device** | An Android phone running the mobile app, registered to send SMS over its SIM |
| **Platform device** | Device registered by a super admin; sends system SMS (`company_id` null) |
| **Company device** | Device registered by a company admin; sends that company's SMS |
| **Device key** | Per-device secret issued at registration; sent as `X-Sms-Device-Key` on device API calls |
| **Queue item** | Pending SMS job with status (`pending`, `processing`, `sent`, `failed`), retry count, scope |
| **OTP** | One-time passcode generated + hashed by the SMS service; delivered as an SMS |
| **Internal send** | Server-to-server request from Identity/WebOnOne BE to SMS BE |
| **Service API key** | Shared secret in each consumer `backend/.env` and SMS `backend/.env` for internal routes |

## Success criteria

1. `npm run dev:sms` serves SMS admin UI at `:3016` and API at `:4016/health`.
2. Super admin registers a platform device; company admin registers a company device; each appears in the admin Devices list for approval.
3. A queued message with `company_id = null` is delivered only to a platform device; a company-scoped message only to that company's device.
4. From a physical Android phone: login → register device → approve in admin → test send → SMS received → row shows `sent` in `sms_history`.
5. OTP send/verify works: code hashed at rest, expires, and enforces max attempts.
5b. Super admin manages platform templates; a company owner creates a company template and overrides a platform slug for their company only.
6. iOS build hides gateway sending and shows an unsupported state; app still logs in.
7. `npm run type-check -w sms-root` passes; migrations apply cleanly; `mobile` type-checks.

## Subtask mapping (ClickUp)

| Subtask | ID | Spec section |
|---------|-----|----------------|
| Parent — SMS microservice + gateway app | TBD | All |
| SMS service repo scaffold | TBD | [02-sms-service-scaffold.md](./02-sms-service-scaffold.md) |
| SMS gateway + sending engine | TBD | [03-gateway-and-sending-engine.md](./03-gateway-and-sending-engine.md) |
| SMS templates (system + company) | TBD | [06-sms-templates.md](./06-sms-templates.md) |
| Mobile app (login + gateway) | TBD | [04-mobile-app.md](./04-mobile-app.md) |
| Platform integration and release | TBD | [05-platform-integration.md](./05-platform-integration.md) |
