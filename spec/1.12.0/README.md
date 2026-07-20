# WebOnOne Platform — Specification (1.12.0)

Extends [1.11.4](../1.11.4/README.md) with a standalone **SMS microservice** and a new **mobile app** that turns an Android phone into a self-hosted SMS gateway. Instead of a paid SMS aggregator, the platform generates the message/OTP, queues it, and a phone running the WebOnOne mobile app pulls pending messages and sends them over its **real SIM** (Dialog / Mobitel / Hutch / Airtel). Super admins register **platform** devices for system SMS; company owners register their own **company** devices for their SMS.

**Spec No:** 1.12.0

Implementation branch: **`spec/1.12.0`**

## What changed from 1.11.4

| Area | 1.11.4 | 1.12.0 |
|------|--------|--------|
| SMS delivery | None | Dedicated **`sms/`** microservice — own DB, queue, OTP, device API |
| Text transport | N/A | **Android SMS gateway** — phone SIM sends the message (no third-party SMS provider) |
| Mobile client | None | New **`mobile/`** Expo app (React Native + React Native Web) — v1 scope = login + gateway config |
| OTP over SMS | Email OTP only (Identity) | SMS OTP send/verify API; Identity can trigger phone OTP |
| Mobile UI | N/A | **gluestack-ui + NativeWind** on shared `@webonone/theme` tokens (Path A) |

## Projects affected

| Project | Role in 1.12.0 |
|---------|----------------|
| **SMS** (`sms/`) | New service — FE (admin) + BE + migrations; primary scope |
| **Mobile** (`mobile/`) | New Expo app — login + SMS gateway configuration (v1) |
| **Identity** (`identity/backend/`) | Optional: trigger phone OTP via SMS internal API |
| **WebOnOne v2** (`webonone-v2/`) | Optional: SMS entry in core nav (redirect handoff) |
| **Theme** (`packages/theme/`) | Token source reused by the mobile NativeWind config |
| **Root** (`package.json`) | Register `sms/` workspace + `mobile/` workspace; `dev:sms`, `build:sms`, `mobile*` scripts |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-sms-service-scaffold.md](./02-sms-service-scaffold.md) | Service layout, ports, auth, roles, device scope, nav, DB |
| [03-gateway-and-sending-engine.md](./03-gateway-and-sending-engine.md) | Queue, OTP, device polling API, routing, reaper worker, internal API |
| [04-mobile-app.md](./04-mobile-app.md) | Expo app, gluestack-ui + NativeWind, login, gateway config, native SMS module |
| [05-platform-integration.md](./05-platform-integration.md) | Identity phone OTP, WebOnOne nav, security, release checklist |
| [06-sms-templates.md](./06-sms-templates.md) | System (platform) + company-owner templates, scope/override, seeds, length rules, management API/UI |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| Subtask | ID | Spec doc / phase |
|---------|-----|------------------|
| [User Story] Spec No 1.12.0 | TBD | All docs |
| Subtask 1 — SMS service repo scaffold | TBD | [02](./02-sms-service-scaffold.md); Phase 1 |
| Subtask 2 — SMS gateway + sending engine | TBD | [03](./03-gateway-and-sending-engine.md), [06](./06-sms-templates.md); Phase 2 |
| Subtask 3 — Mobile app (login + gateway) | TBD | [04](./04-mobile-app.md); Phase 3 |
| Subtask 4 — Platform integration and release | TBD | [05](./05-platform-integration.md); Phase 4 |

## Revision history

- **2026-07-19** — Initial spec: SMS microservice + Android SMS gateway mobile app (v1 SMS-only).

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.0.0/02-architecture.md](../1.0.0/02-architecture.md) | Microservice boundaries, JWT, no shared DB |
| [../1.9.0/03-sending-engine.md](../1.9.0/03-sending-engine.md) | Queue + worker + internal send API pattern (email analogue) |
| [../1.9.1/02-identity-otp-reset.md](../1.9.1/02-identity-otp-reset.md) | OTP hashing/expiry/attempt pattern |
| [../1.10.1/05-ui-kit-mobile-shell.md](../1.10.1/05-ui-kit-mobile-shell.md) | Mobile layout conventions |

## Rules reference

| Topic | Rule / skill |
|-------|----------------|
| Service boundaries | `microservice-architecture.mdc` |
| Express handlers | `nodejs-express.mdc` |
| MySQL schema | `mysql-database-architecture.mdc` |
| Forms | `.cursor/skills/form-creation/SKILL.md` |
| Feature store | `.cursor/skills/feature-store/SKILL.md` |

## Local dev

```bash
npm run dev:sms          # SMS admin FE :3016 + BE :4016
npm run migrate -w sms-root
npm run mobile           # Expo dev server (mobile app)
npm run mobile:android   # Android dev build (gateway testing)
npm run mobile:web       # React Native Web sanity check
```
