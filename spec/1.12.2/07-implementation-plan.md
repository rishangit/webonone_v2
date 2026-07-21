# 07 — Implementation Plan

Phased delivery for **1.12.2** on branch **`spec/1.12.2`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.12.2
```

| Rule | Detail |
|------|--------|
| Base branch | `master` (or current integration branch that includes 1.12.1 SMS nav) |
| Spec branch | `spec/1.12.2` |
| Scope | `packages/platform-nav/`, `webonone-v2/frontend/`, `email/frontend/` (embed verify), Data/Identity FE path maps |

---

## Phase 0 — Spec (this document)

- [x] `spec/1.12.2/*` documentation
- [ ] Branch `spec/1.12.2`

---

## Phase 1 — platform-nav Email send + queue

**Goal:** Shared sentinels + four Email children ([02-webonone-email-send-queue-nav.md](./02-webonone-email-send-queue-nav.md)).

| Task | Detail |
|------|--------|
| `EMAIL_NAV_SENTINELS` | Add `send`, `queue` |
| Helpers | Extend `isEmailNavSentinel`, `emailSentinelToExternalPath` |
| Nav defs | Four children on Email group (main + superAdmin) |
| Tests | `coreNav.test.ts` — four URLs; member hides group |

**Exit criteria:** Tests pass; package type-check ok.

---

## Phase 2 — WebOnOne + satellites

**Goal:** Icons + default peer path; Identity/Data rewrite maps.

| Task | Detail |
|------|--------|
| `PlatformPeerFrame` | Email default external path `/send` |
| `navItems.ts` | Icons for send + queue sentinels |
| Identity | `emailHrefToSentinel` + icons |
| Data | `parseEmailNavSentinelFromTarget` covers new sentinels |
| Email FE | Optional icons; confirm embed pages |

**Exit criteria:** Manual: WebOnOne → Send Email / Queue load iframe; shell stays.

**Verify:** `npm run type-check -w webonone-v2-root` (+ identity-root / data-root / email-root as touched)

---

## Acceptance checklist

- [ ] Super admin / company admin see Email group with Send Email, Queue, Email History, Templates (that order)
- [ ] Member does not see Email
- [ ] WebOnOne embed: Send Email → `/send`, Queue → `/queue`
- [ ] Sub-item switches do not unload WebOnOne shell
- [ ] Satellite → Email Send / Queue redirect lands on correct path
- [ ] Standalone Email nav unchanged
- [ ] `platform-nav` tests updated and green
- [ ] Type-check: platform-nav, webonone-v2-root, touched satellites

---

## Final verification

```bash
npm run type-check -w @webonone/platform-nav
npm run type-check -w webonone-v2-root
# plus identity-root / data-root / email-root if Phase 2 touched them
```

Manual: `npm run dev:webonone` + `npm run dev:email` + `npm run dev:identity` — exercise Send Email and Queue inside the shell.
