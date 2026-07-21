# 07 — Implementation Plan

Phased delivery for **1.12.1** on branch **`spec/1.12.1`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.12.1
```

| Rule | Detail |
|------|--------|
| Base branch | `master` (or current integration branch that includes 1.12.0 SMS) |
| Spec branch | `spec/1.12.1` |
| Scope | `packages/platform-nav/`, `webonone-v2/frontend/`, `sms/frontend/` (embed verify), Email/Data/Identity FE outbound handlers |

---

## Phase 0 — Spec (this document)

- [x] `spec/1.12.1/*` documentation
- [ ] Branch `spec/1.12.1`

---

## Phase 1 — platform-nav SMS contract

**Goal:** Shared sentinels + SMS group in core nav defs ([02-webonone-sms-nav.md](./02-webonone-sms-nav.md)).

| Task | Detail |
|------|--------|
| `ExternalServiceId` | Add `'sms'` |
| `SMS_NAV_SENTINELS` | send, devices, queue, history, templates |
| Helpers | `isSmsNavSentinel`, `smsSentinelToExternalPath` |
| Nav defs | SMS group on `MAIN_PLATFORM_NAV` and `SUPER_ADMIN_PLATFORM_NAV` |
| Exports | `packages/platform-nav/src/index.ts` |
| Tests | `coreNav.test.ts` — resolve URLs; member hides group |

**Exit criteria:** Tests pass; package type-check / build ok.

---

## Phase 2 — WebOnOne embed host

**Goal:** Left-nav SMS items embed SMS FE in `#main-content`.

| Task | Detail |
|------|--------|
| `smsConfig.ts` | Origin + URL helper |
| `.env.example` | `VITE_SMS_ORIGIN` |
| Router | `sms/*` → `PlatformPeerFrame peer="sms"` |
| `PlatformPeerFrame` | Peer id, path, origin, label |
| `navItems.ts` | Group + leaf icons; SMS externalService |
| `AppLayout` / prefetch | `isPlatformPeerEmbedPath` + SMS sentinel prefetch |

**Exit criteria:** Manual: WebOnOne → each SMS sub-item loads iframe; shell stays.

**Verify:** `npm run type-check -w webonone-v2-root`

---

## Phase 3 — SMS embed verify + satellite outbound

**Goal:** Embed polish on SMS; satellites can hop to SMS without falling to core Home.

| Task | Detail |
|------|--------|
| SMS FE | Confirm five routes under `PlatformEmbedLayout` + FeaturePage + content-ready |
| SMS env / CSP | WebOnOne in allowed parents / frame-ancestors |
| Email FE | `smsConfig` + `redirectToSms` + AppLayout sentinel handler |
| Data FE | Same |
| Identity FE | Same if Identity shows Email/Data-style core nav with SMS group |

**Exit criteria:** Data → SMS → Templates works; SMS standalone unchanged.

**Verify:** `npm run type-check -w sms-root` and touched satellite roots.

---

## Acceptance checklist

- [ ] Super admin / company admin see SMS group with Send SMS, Devices, Queue, History, Templates (that order)
- [ ] Member does not see SMS
- [ ] WebOnOne embed: each sub-item shows correct SMS page
- [ ] Sub-item switches do not unload WebOnOne shell
- [ ] Satellite → SMS redirect lands on correct path
- [ ] Standalone SMS nav unchanged
- [ ] `platform-nav` tests updated and green
- [ ] Type-check: platform-nav, webonone-v2-root, sms-root, touched satellites

---

## ClickUp subtask traceability

| ClickUp | ID | Phase |
|---------|-----|-------|
| Parent: [User Story] Spec No 1.12.1 | TBD | All phases |
| Subtask: SMS left nav in WebOnOne | TBD | Phase 1–3 |

---

## Final verification

```bash
npm run type-check -w @webonone/platform-nav   # or package script used in repo
npm run type-check -w webonone-v2-root
npm run type-check -w sms-root
# plus email-root / data-root / identity-root if Phase 3 touched them
```

Manual: `npm run dev:webonone` + `npm run dev:sms` + `npm run dev:identity` — exercise all five SMS nav children inside the shell.
