# 07 — Implementation Plan

Phased delivery for **1.6.0** on branch **`spec/1.6.0`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.6.0
```

| Rule | Detail |
|------|--------|
| Base branch | `master` |
| Spec branch | `spec/1.6.0` |
| Scope | `company/` (new), `webonone-v2/`, `packages/media-embed/` (consumer only), root workspace |

---

## Phase 0 — Spec (complete)

- [x] `spec/1.6.0/*` documentation
- [x] Branch `spec/1.6.0`

---

## Phase 1 — Company service scaffold (2 days)

**Goal:** Standalone Company microservice with DB, health, JWT verify, super-admin seed.

| Task | Detail |
|------|--------|
| Scaffold `company/` | FE :3004, BE :4004, migrations |
| Tables | `companies`, `company_memberships`, `super_admins` |
| Seed super admin | Env-driven bcrypt hash |
| `GET /health` | Public |
| Identity JWT middleware | `requireIdentityJwt` |
| `POST /auth/super-admin/login` | Returns super-admin token |
| Root wiring | `dev:company`, workspace, root `npm run dev` |

**Exit criteria:** `npm run dev:company` starts; `/health` 200; super-admin seed login works.

---

## Phase 2 — Company registration API (1 day)

| Task | Priority |
|------|----------|
| `POST /companies` | P0 |
| `GET /me/company` | P0 |
| Zod validation | P0 |
| One-company-per-user constraint | P0 |

**Exit criteria:** API tests or manual curl with Identity JWT.

---

## Phase 3 — Super admin approval API (1 day)

| Task | Priority |
|------|----------|
| `GET /admin/companies/pending` | P0 |
| `POST /admin/companies/:id/approve` | P0 |
| `requireSuperAdmin` middleware | P0 |
| Role promotion `company_admin` | P0 |

**Exit criteria:** Approve flow updates company status and membership role.

---

## Phase 4 — WebOnOne Basic Settings UI (2 days)

| Task | Priority |
|------|----------|
| `/settings/basic` route + nav | P0 |
| `BasicSettingsPage` states A/B/C | P0 |
| `RegisterCompanyDialog` | P0 |
| Media logo upload embed | P0 |
| WebOnOne BE proxy routes | P0 |
| `mediaConfig.ts` if missing | P0 |

**Exit criteria:** Manual test — register company → pending UI → toast.

---

## Phase 5 — Super admin UI in WebOnOne (1 day)

| Task | Priority |
|------|----------|
| Super-admin login page | P0 |
| Pending companies list + approve | P0 |
| BE proxy for admin routes | P0 |
| Session storage for super-admin token | P0 |

**Exit criteria:** Seed super admin approves pending company; user sees approved + admin role.

---

## Phase 6 — Verification (0.5 day)

```bash
npm run build:media-embed
npm run type-check -w company-root
npm run type-check -w webonone-v2-root
```

Manual QA:

| Check | Expected |
|-------|----------|
| No company | Prompt + Register button |
| Register | Dialog, logo upload, pending status |
| Super admin | Pending list, approve |
| After approve | Company admin role, approved badge |
| Standalone | Company starts without WebOnOne |

---

## Acceptance checklist (release)

### Company service

- [ ] Standalone `npm run dev:company`
- [ ] `webonone_company` migrations applied
- [ ] Super admin seeded from env
- [ ] Register + approve APIs work
- [ ] Identity JWT verified locally

### WebOnOne

- [ ] Basic Settings nav + page
- [ ] Register company dialog with Media logo
- [ ] Pending / approved states
- [ ] Super-admin pending list + approve
- [ ] Proxy routes to Company API

### Security

- [ ] Super-admin creds not in Identity
- [ ] No tokens in URLs
- [ ] JWT `iss`/`aud`/`exp` validated

---

## ClickUp subtask traceability

| Subtask | ID | Phase |
|---------|-----|-------|
| [User Story] Spec No 1.6.0 Register my company | 86ey2nrgd | Phases 0–6 |
| Core project need to have the user roles | 86ey2p61f | Phases 1–5 |
