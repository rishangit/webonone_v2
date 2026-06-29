# 07 — Implementation Plan

Phased delivery for **Email 1.9.0** on branch **`spec/1.9.0`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.9.0
```

| Rule | Detail |
|------|--------|
| Base branch | `master` |
| Spec branch | `spec/1.9.0` |
| Scope | `email/`, `identity/backend/`, `webonone-v2/`, `packages/platform-nav/`, root `package.json` |

---

## Phase 0 — Spec (this document)

- [ ] `spec/1.9.0/*` documentation
- [ ] Branch `spec/1.9.0`

---

## Phase 1 — Email scaffold

**Goal:** Standalone service shell, auth, nav, DB base, root wiring.

| Task | Detail |
|------|--------|
| Scaffold `email/` | Mirror `media/` package structure |
| Migrations | users, companies, user_roles tables |
| Auth | Identity redirect + JWT middleware |
| Nav + AppLayout | Role-filtered nav items |
| WebOnOne Email link | `emailConfig.ts` + nav entry |
| Root workspace | `dev:email`, workspaces |

**Exit criteria:** `npm run dev:email` serves login shell and `/health`.

---

## Phase 2 — Sending engine

**Goal:** SMTP, queue, templates, internal API.

| Task | Detail |
|------|--------|
| Template + queue migrations | Seed platform templates |
| MailSender + QueueWorker | nodemailer, retry logic |
| Internal send route | API key auth |
| Template render | Placeholders + branding |
| Public API stubs | templates list, history read |

**Exit criteria:** Internal POST enqueues and sends test mail in dev.

---

## Phase 3 — Management screens

**Goal:** Admin UI per [04-management-screens.md](./04-management-screens.md).

| Task | Priority |
|------|----------|
| Dashboard + stats API | P0 |
| Templates list/editor/preview | P0 |
| History + Queue pages | P0 |
| Send + Test pages | P1 |
| Providers + Settings/branding | P1 |

**Exit criteria:** Super admin manages templates from UI; history shows sends.

---

## Phase 4 — Platform integration

**Goal:** Identity + WebOnOne triggers.

| Task | Priority |
|------|----------|
| Identity forgot-password → Email | P0 |
| Identity verification → Email | P0 |
| WebOnOne company emails | P0 |
| Role sync endpoint | P1 |
| Audit logging | P1 |

**Exit criteria:** Full release checklist in [05-platform-integration.md](./05-platform-integration.md) passes.

---

## ClickUp subtask traceability

| Subtask | ID | Phase |
|---------|-----|-------|
| [User Story] Spec No 1.9.0 | 86ey30c9y | All |
| Subtask 1 — Email service repo scaffold | 86ey38567 | Phase 1 |
| Subtask 2 — Transactional email sending engine | 86ey38852 | Phase 2 |
| Subtask 3 — Email management screens | 86ey3887z | Phase 3 |
| Subtask 4 — Platform integrations and release readiness | 86ey388eg | Phase 4 |

---

## Acceptance checklist

- [ ] Email runs standalone (`dev:email`, `/health`)
- [ ] Role-gated nav and API
- [ ] WebOnOne Email menu entry
- [ ] Queue + retries + history
- [ ] Six required templates seeded
- [ ] Identity reset (1h) and verify (24h) mail
- [ ] Company approval/rejection mail
- [ ] No SMTP secrets in consumer services
- [ ] Type-check passes for affected workspaces

---

## Final verification commands

```bash
npm run migrate -w email-root
npm run type-check -w email-root
npm run type-check -w identity-root
npm run type-check -w webonone-v2-root
npm run build:platform-nav
npm run build:ui-kit
npm run build -w email-root
```
