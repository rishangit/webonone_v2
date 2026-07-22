# 07 — Implementation Plan

Phased delivery for **1.13.0** on branch **`spec/1.13.0`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.13.0
```

| Rule | Detail |
|------|--------|
| Base branch | `master` (or integration branch that includes 1.12.3 + company feature from 1.6.0) |
| Spec branch | `spec/1.13.0` |
| Scope | `packages/platform-nav/`, `ui-kit/`, `webonone-v2/frontend/`, `webonone-v2/backend/` |

---

## Phase 0 — Spec (this document)

- [x] `spec/1.13.0/*` documentation
- [ ] Branch `spec/1.13.0`
- [ ] ClickUp parent + subtasks (create if missing; set to `speced` after sync)

---

## Phase 1 — Multi-company API

**Goal:** List all companies for the signed-in user; register allows multiples ([04-multi-company-api.md](./04-multi-company-api.md)).

| Task | Detail |
|------|--------|
| Service | `listMyCompanies(userId)` using Identity company roles + company rows |
| Route | `GET /api/v1/company/me/companies` |
| Register | Confirm no single-membership 409; always `company_admin` (Company Owner) on create; add regression test / manual check |
| Primary | Keep `GET /company/me` primary semantics |
| Assumable roles | Smoke with ≥2 **approved** companies; pending/rejected must not unlock owner session |

**Exit criteria:** API returns empty / multi items correctly; second register succeeds; registrant role is always `company_admin`.

**Verify:** backend unit/integration or manual via HTTP + Identity running.

---

## Phase 2 — UI Kit company status tags

**Goal:** Upgrade Tags showcase + ensure `StatusTag` contract ([05-ui-kit-company-status-tags.md](./05-ui-kit-company-status-tags.md)).

| Task | Detail |
|------|--------|
| Package | Confirm / polish `StatusTag` variants pending / approved / rejected |
| Showcase | `TagsPage` — **Company status tags** section with all three variants |
| Build | `npm run build -w @webonone/ui-kit` |

**Exit criteria:** Showcase Tags tab documents company status tags; package exports `StatusTag`.

**Verify:** `npm run type-check -w ui-kit-root`

---

## Phase 3 — platform-nav Settings child

**Goal:** **All Companies** under Settings on all variants ([02-settings-all-companies-nav.md](./02-settings-all-companies-nav.md)).

| Task | Detail |
|------|--------|
| Nav defs | Insert `/settings/companies` as first Settings child |
| Tests | Assert member / main / superAdmin Settings children |
| Do not touch | Top-level `/companies` for super admin |

**Exit criteria:** platform-nav tests green.

---

## Phase 4 — All Companies list UI + StatusTag rollout + Basic Settings cleanup

**Goal:** List page + register CTA; migrate UX off Basic Settings; use `StatusTag`; wire 3-dot **Login** ([03-my-companies-list-ui.md](./03-my-companies-list-ui.md), [05](./05-ui-kit-company-status-tags.md), [06-company-owner-login.md](./06-company-owner-login.md)).

| Task | Detail |
|------|--------|
| Page + list | `AllCompaniesPage`, `MyCompaniesList` with ItemList + `StatusTag` + `ItemListMenu` |
| Row menu | **Login** (approved + Company Owner) → `sessionRoleApi.reissueSessionRole('company_admin', companyId)` |
| Role label | Show **Company Owner** for `company_admin` on All Companies |
| Super-admin list | Replace hand-rolled status chips in `CompaniesList` with `StatusTag` |
| Store | Load my companies; register → refresh list |
| Router / icons / prefetch | Wire `/settings/companies` |
| Wizard | Reuse `RegisterCompanyDialog` |
| Basic Settings | Remove sole register path; optional link Callout |

**Exit criteria:** Manual acceptance checklist below.

**Verify:** `npm run type-check -w webonone-v2-root` (+ platform-nav package tests; ui-kit already built)

---

## Acceptance checklist

- [ ] Member sees Settings → **All Companies**
- [ ] Company admin and super admin also see All Companies
- [ ] Empty list shows `ItemListEmpty`; **Add company** in header
- [ ] Register wizard creates company with status **Pending**; row shows `StatusTag` Pending + **Company Owner**
- [ ] Second registration creates a second **Pending** row (multi-company); Identity role is `company_admin` each time
- [ ] Until super admin acts, status remains **Pending** (no auto-approve)
- [ ] Super admin Approve / Reject on `/companies` → user All Companies shows **Approved** / **Rejected** `StatusTag`
- [ ] Status values are only pending / approved / rejected
- [ ] Showcase **Tags** tab shows Company status tags (three variants)
- [ ] No hand-rolled company status pills on All Companies or super-admin Companies
- [ ] Rows use UI Kit ItemList (glass, gap, **3-dot menu** with **Login**)
- [ ] **Login** disabled for Pending/Rejected; enabled after Approve → session becomes company owner for that company
- [ ] Pagination pinned to bottom of `ListPageBody`
- [ ] All Companies has no Approve/Reject actions (super-admin page only)
- [ ] Basic Settings is not the primary register entry
- [ ] Type-check: ui-kit-root, webonone-v2-root; platform-nav tests pass

---

## ClickUp subtask traceability

| ClickUp | ID | Phase |
|---------|-----|-------|
| Parent — Spec No 1.13.0 | TBD | All |
| Subtask — All Companies nav + list + multi register | TBD | Phases 1, 3–4 |
| Subtask — UI Kit Tags company status tags | TBD | Phase 2 (+ Phase 4 consume) |
| Subtask — Company Owner + Login from list | TBD | Phases 1, 4 |

---

## Open items

- Create ClickUp `[User Story]` parent with `Spec No: 1.13.0` and ready subtasks when product tracking is required.
- Decide whether row **View details** is required in 1.13.0 or deferred (default: optional read-only dialog).
- Confirm whether assumable-roles API **filters** non-approved companies or only Login UI disables them (recommended: both — API + UI).