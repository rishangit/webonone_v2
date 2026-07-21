# 01 — Overview (1.12.2)

## Vision

Platform operators send mail and inspect the queue the same way they already open Email History and Templates: from the **WebOnOne** left sidebar, without bookmarking the Email origin. WebOnOne keeps the chrome; Email pages load **in-place** via the platform iframe embed channel.

## User story

As a super admin or company admin on WebOnOne, I want **Send Email** and **Queue** in the **Email** left-nav group (alongside History and Templates), so I can compose mail and monitor the queue without leaving the core shell — the same experience as **SMS → Send SMS / Queue**.

## Goals (1.12.2)

1. **Extend Email nav group** in `@webonone/platform-nav` for `main` and `superAdmin` — still hidden for `member`.
2. **Four sub-items** map to Email service routes:

   | Core label | Sentinel (WebOnOne path) | Email external path |
   |------------|--------------------------|---------------------|
   | Send Email | `/email/send` | `/send` |
   | Queue | `/email/queue` | `/queue` |
   | Email History | `/email/history` | `/history` |
   | Templates | `/email/templates` | `/templates` |

3. **Embed channel unchanged** — local `navigate` to sentinels → `PlatformPeerFrame` peer `email` → iframe (JWT via `postMessage`).
4. **Satellite hops** — Data / Identity continue to intercept `isEmailNavSentinel` (now includes send + queue).
5. **No Email page duplication** — WebOnOne does not reimplement Send/Queue; Email FE owns UI + API.

## Scope (1.12.2)

### In scope

- `packages/platform-nav`: extend `EMAIL_NAV_SENTINELS`, helpers, Email group children on `MAIN_PLATFORM_NAV` and `SUPER_ADMIN_PLATFORM_NAV`
- `webonone-v2/frontend`: icons for send/queue; `PlatformPeerFrame` email default → `/send`
- `email/frontend`: confirm `/send` and `/queue` work under embed (`FeaturePage` + content-ready); optional icon polish on core nav rewrite
- Data / Identity frontends: path→sentinel maps for `/send` and `/queue` when rewriting absolute Email URLs
- Unit tests in `platform-nav` for four Email URL resolutions

### Out of scope

- New Email backend APIs or schema
- Adding Dashboard, Test Email, Providers, or Settings to the **core** Email group (remain standalone-Email-only)
- Member-facing Email UI
- SMS or Data nav changes

## Glossary

| Term | Definition |
|------|------------|
| **Sentinel path** | Core-shell path such as `/email/send` that WebOnOne routes to an iframe peer |
| **Embed channel** | WebOnOne owns chrome; peer loads in iframe with `embed=platform` + JWT `postMessage` |
| **Email peer** | `email` value of `PlatformPeerId` / `ExternalServiceId` |

## Success criteria

1. Super admin and company admin see **Email** group with Send Email, Queue, Email History, Templates (that order); members do not.
2. Each new sub-item loads the correct Email page inside the shell.
3. Switching among Email sub-items updates the iframe path without full-page reload of WebOnOne.
4. From Data or Identity platform mode, clicking Send Email / Queue lands on the matching Email route (auth-code redirect).
5. Standalone `npm run dev:email` nav unchanged.
6. `npm run type-check` passes for `platform-nav`, `webonone-v2-root`, and touched satellites.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — Spec No 1.12.2 | TBD | All docs |
| Subtask — Email Send + Queue in WebOnOne | TBD | [02-webonone-email-send-queue-nav.md](./02-webonone-email-send-queue-nav.md) |
