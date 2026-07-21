# 01 — Overview (1.12.1)

## Vision

Platform operators manage SMS the same way they manage Email: from the **WebOnOne** left sidebar, without bookmarking the SMS origin. WebOnOne keeps the chrome (sidebar + header); SMS pages load **in-place** in `#main-content` via the platform iframe embed channel.

## User story

As a super admin or company admin on WebOnOne, I want an **SMS** menu in the left navigation with **Send SMS**, **Devices**, **Queue**, **History**, and **Templates**, so I can operate the SMS gateway and templates without leaving the core shell — the same experience as **Email → History / Templates**.

## Goals (1.12.1)

1. **SMS nav group** in `@webonone/platform-nav` for `main` (company admin) and `superAdmin` variants — not shown for `member`.
2. **Five sub-items** map to SMS service routes:

   | Core label | Sentinel (WebOnOne path) | SMS external path |
   |------------|--------------------------|-------------------|
   | Send SMS | `/sms/send` | `/send` |
   | Devices | `/sms/devices` | `/devices` |
   | Queue | `/sms/queue` | `/queue` |
   | History | `/sms/history` | `/history` |
   | Templates | `/sms/templates` | `/templates` |

3. **Embed channel on WebOnOne** — local `navigate` to sentinels → `PlatformPeerFrame` peer `sms` → `PlatformServiceFrame` iframe (JWT via `postMessage`, no auth-code on embed).
4. **Peer config** — `VITE_SMS_ORIGIN` + `webonone-v2/.../sms/utils/smsConfig.ts` (origin only; paths derived).
5. **Satellite hops** — Email / Data / Identity AppLayouts intercept SMS sentinels with auth-code redirect (same pattern as Data ↔ Email in 1.11.2).
6. **No SMS page duplication** — WebOnOne does not reimplement Send/Devices/Queue/History/Templates; SMS FE owns UI + API.

## Scope (1.12.1)

### In scope

- `packages/platform-nav`: `SMS_NAV_SENTINELS`, helpers, `ExternalServiceId` includes `'sms'`, SMS group in `MAIN_PLATFORM_NAV` and `SUPER_ADMIN_PLATFORM_NAV`
- `webonone-v2/frontend`: sms config, router `sms/*`, peer frame + prefetch, nav icons, `.env.example`
- `sms/frontend`: embed readiness for the five routes (`FeaturePage` + content-ready); `frame-ancestors` / `VITE_ALLOWED_PARENT_ORIGINS` includes WebOnOne
- Email / Data / Identity frontends: `smsConfig` + `redirectToSms` + sentinel `onClick` (or shared attach helper) when core nav includes SMS
- Unit tests in `platform-nav` for SMS URL resolution

### Out of scope

- New SMS backend APIs or schema changes (reuse 1.12.0)
- Mobile app changes
- Identity phone-OTP wiring (already 1.12.0)
- Adding Dashboard or Test to the **core** SMS group (remain standalone-SMS-only unless a later spec adds them)
- Member-facing SMS UI

## Glossary

| Term | Definition |
|------|------------|
| **Sentinel path** | Core-shell path such as `/sms/history` that WebOnOne routes to an iframe peer, not a local page |
| **Embed channel** | WebOnOne owns chrome; peer loads in iframe with `embed=platform` + JWT `postMessage` |
| **Redirect channel** | Full-page auth-code hop used from satellites (and bookmarks) to SMS origin |
| **SMS peer** | `sms` value of `PlatformPeerId` / `ExternalServiceId` |

## Success criteria

1. Super admin and company admin see **SMS** group with the five sub-items in WebOnOne left nav; members do not.
2. Each sub-item loads the correct SMS page inside the shell (sidebar/header stay mounted).
3. Switching between SMS sub-items updates the iframe path without full-page reload of WebOnOne.
4. From Data or Email platform mode, clicking an SMS sub-item lands on the matching SMS route (auth-code redirect).
5. Standalone `npm run dev:sms` nav and routes unchanged.
6. `npm run type-check` passes for `platform-nav`, `webonone-v2-root`, `sms-root`, and touched satellite roots.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — Spec No 1.12.1 | TBD | All docs |
| Subtask — SMS left nav in WebOnOne | TBD | [02-webonone-sms-nav.md](./02-webonone-sms-nav.md) |
