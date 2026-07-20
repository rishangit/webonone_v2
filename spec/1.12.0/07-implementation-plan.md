# 07 — Implementation Plan

Phased delivery for **SMS 1.12.0** on branch **`spec/1.12.0`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.12.0
```

| Rule | Detail |
|------|--------|
| Base branch | `master` |
| Spec branch | `spec/1.12.0` |
| Scope | `sms/`, `mobile/`, `identity/backend/` (optional), `webonone-v2/` (optional), root `package.json` |

---

## Phase 0 — Spec (this document)

- [x] `spec/1.12.0/*` documentation
- [ ] Branch `spec/1.12.0`

---

## Phase 1 — SMS service scaffold

**Goal:** Standalone service shell, auth, roles, device scope, DB base, root wiring. See [02-sms-service-scaffold.md](./02-sms-service-scaffold.md).

| Task | Detail |
|------|--------|
| Scaffold `sms/` | Clone `email/` package structure (FE 3016 / BE 4016) |
| Migrations | users, companies mirror tables |
| Auth | Identity redirect + JWT middleware; `requireRole` |
| Nav + AppLayout | Role-filtered nav items |
| Root workspace | `dev:sms`, `build:sms`, `migrate:sms`, workspaces (+ `mobile`) |

**Exit criteria:** `npm run dev:sms` serves login shell and `/health`.

---

## Phase 2 — Gateway + sending engine

**Goal:** Queue, OTP, device API, scope routing, reaper, internal API. See [03-gateway-and-sending-engine.md](./03-gateway-and-sending-engine.md).

| Task | Detail |
|------|--------|
| Domain migrations | devices, templates(+versions), queue, history, otps, audit; seed platform `otp`/`phone_verification`/`password_reset`/`generic` |
| Templates (system + company) | Scope/override resolution, CRUD role-scoped (server-derived scope), char/segment counter — [06-sms-templates.md](./06-sms-templates.md) |
| Enqueue + render | Template resolve (company override → platform) + placeholder + required-keys |
| Device API | register/heartbeat/messages(claim)/status; `deviceAuth` |
| Scope routing | platform vs company claim queries |
| OTP service | generate/hash/verify (expiry + attempts) |
| Reaper worker | un-stick processing, retry backoff, offline devices, expire OTPs |
| Internal API | `send`, `otp/send`, `otp/verify` (service key) |

**Exit criteria:** A queued message is claimed by a scoped device (simulated) and status writes history; OTP verify works.

---

## Phase 3 — Mobile app (login + gateway)

**Goal:** Expo app: login + gateway config. See [04-mobile-app.md](./04-mobile-app.md).

| Task | Priority |
|------|----------|
| Expo scaffold + RN Web + monorepo Metro | P0 |
| NativeWind + gluestack + `@webonone/theme` tokens; `mobile/src/ui/` | P0 |
| Identity login + SecureStore JWT + apiClient | P0 |
| Native `sms-sender` module (SmsManager + SubscriptionManager, SEND_SMS) | P0 |
| Register device + approval-pending + SIM select | P0 |
| Foreground service polling loop + status + heartbeat | P0 |
| iOS Android-only gateway state | P1 |
| Admin Devices screen (approve/revoke) in `sms/frontend` | P0 |

**Exit criteria:** Physical Android: login → register → approve in admin → test send → SMS received → `sent` in history.

---

## Phase 4 — Platform integration and release

**Goal:** Identity phone OTP + optional WebOnOne + release. See [05-platform-integration.md](./05-platform-integration.md).

| Task | Priority |
|------|----------|
| Identity `smsClient.service.ts` + phone OTP path | P1 |
| WebOnOne optional SMS nav / company send | P2 |
| Security hardening (device key, scope isolation, audit) | P0 |
| Release checklist | P0 |

**Exit criteria:** Full release checklist in [05-platform-integration.md](./05-platform-integration.md) passes.

---

## ClickUp subtask traceability

| Subtask | ID | Phase |
|---------|-----|-------|
| [User Story] Spec No 1.12.0 | TBD | All |
| Subtask 1 — SMS service repo scaffold | TBD | Phase 1 |
| Subtask 2 — SMS gateway + sending engine | TBD | Phase 2 |
| Subtask 3 — Mobile app (login + gateway) | TBD | Phase 3 |
| Subtask 4 — Platform integration and release | TBD | Phase 4 |

---

## Acceptance checklist

- [ ] SMS runs standalone (`dev:sms`, `/health`)
- [ ] Role-gated nav and API; device scope from role
- [ ] Queue + OTP + device polling + scope routing
- [ ] Templates for system (platform) + company owners with override resolution
- [ ] Reaper: retries, offline devices, OTP expiry
- [ ] Mobile app: login + register + gateway send on Android
- [ ] iOS Android-only gateway state
- [ ] Identity phone OTP (if enabled) via SMS internal API
- [ ] Type-check passes for affected workspaces

---

## Final verification commands

```bash
npm run migrate -w sms-root
npm run type-check -w sms-root
npm run type-check -w identity-root   # if Identity integration done
npm run build:store-kit
npm run build:ui-kit
npm run build -w sms-root
npm run type-check -w @webonone/mobile
```
