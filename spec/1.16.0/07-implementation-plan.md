# 07 — Implementation Plan

Phased delivery for **Payment 1.16.0** on branch **`spec/1.16.0`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.16.0
```

| Rule | Detail |
|------|--------|
| Base branch | `master` |
| Spec branch | `spec/1.16.0` |
| Scope | `payment/`, `webonone-v2/` (sync + env + redirect), `packages/platform-nav/`, root `package.json`, optional `.cursor/agents` + skill |

---

## Phase 0 — Spec (this document)

- [x] `spec/1.16.0/*` documentation
- [ ] Branch `spec/1.16.0`

---

## Phase 1 — Payment service scaffold

**Goal:** Standalone service shell, auth, roles, DB base, root wiring. See [02-payment-service-scaffold.md](./02-payment-service-scaffold.md).

| Task | Detail |
|------|--------|
| Scaffold `payment/` | Clone `sms/` or `email/` structure; ports FE **3017** / BE **4017**; DB `webonone_payment` |
| Middleware | `auth.ts`, `internalAuth.ts` (`X-Payment-Service-Key`), `validateBody.ts`, `errorHandler.ts`, `requireRole.ts` |
| Base migrations | `payment_users` (optional), `payment_companies`, `payment_plans` (+ seed), `payment_audit_log` |
| Nav + AppLayout | Dashboard + Invoices; platform shell three-layer pattern |
| Root workspace | workspaces + `dev:payment`, `build:payment`, `migrate:payment`; append to root `dev` |
| Agent | Add `payment-agent` + skill; update `AGENTS.md` |

**Exit criteria:** `npm run dev:payment` serves login shell and `/health`.

---

## Phase 2 — System billing + invoices engine

**Goal:** Subscriptions, invoices, generator worker, APIs. See [03-system-billing-and-invoices.md](./03-system-billing-and-invoices.md).

| Task | Detail |
|------|--------|
| Migrations | `payment_subscriptions`, `payment_invoices`, `payment_invoice_lines`; unique `(company_id, kind, period_start)` |
| Company upsert | Internal upsert + activate/cancel subscription |
| Period math | Activation-anchored months; timezone `Asia/Colombo` |
| Generator worker | Backfill + overdue; idempotent |
| Public API | list/detail/mark-paid/void/dashboard |
| Amount | Always LKR **3,000** from plan (`SYSTEM_MONTHLY_AMOUNT_LKR` / seed) |

**Exit criteria:** Upsert company → generate → invoices exist without duplicates; mark paid works via API.

---

## Phase 3 — Super-admin invoices UI

**Goal:** Invoices list + detail in Payment FE. See [04-super-admin-invoices-ui.md](./04-super-admin-invoices-ui.md).

| Task | Detail |
|------|--------|
| InvoicesPage | FeaturePage + ItemList + filters + pagination |
| InvoiceDetailPage | Lines, amounts, actions |
| Dashboard summary | Outstanding / overdue counts |
| Status display | Kit tags / consistent status chips |
| Feature store | Prefer `@webonone/store-kit` paginated list |

**Exit criteria:** Super admin UI shows all companies' invoices; mark paid/void from UI.

---

## Phase 4 — Platform integration and release

**Goal:** WebOnOne sync + nav. See [05-platform-integration.md](./05-platform-integration.md).

| Task | Detail |
|------|--------|
| WebOnOne BE | On approve/reject → Payment internal upsert |
| Env | `PAYMENT_*` on WebOnOne BE; `VITE_PAYMENT_ORIGIN` on FE |
| platform-nav | Payment group on super-admin nav |
| WebOnOne FE | `paymentConfig` + redirect handoff |
| Security + checklist | Run [05](./05-platform-integration.md) release checklist |

**Exit criteria:** Approve company → invoices appear → super-admin nav opens list.

---

## Cross-service integration

- **Auth:** Payment verifies Identity JWT locally (shared `JWT_SECRET`).
- **Internal:** WebOnOne → Payment via `X-Payment-Service-Key` HTTP (no event bus required in this repo for v1).
- **UI connect:** WebOnOne → Payment via platform-nav + auth-code handoff.
- **No shared DB**; `company_id` / `user_id` are CHAR(21) copies.

---

## ClickUp traceability

| Subtask | ID | Phase |
|---------|-----|-------|
| [User Story] Spec No 1.16.0 | TBD | All |
| Payment service scaffold | TBD | Phase 1 |
| System billing + invoices engine | TBD | Phase 2 |
| Super-admin invoices UI | TBD | Phase 3 |
| Platform integration and release | TBD | Phase 4 |

---

## Risks and open items

- **Payment down on approve:** Prefer non-blocking sync + later backfill; document ops `generate` endpoint.
- **Timezone / month-end days:** Document clamp rules; add unit tests for period math.
- **Historical approvals:** One-time backfill script for companies already `approved` before Payment ships.
- **Customer payments / gateways:** Explicitly deferred — do not scope-creep into 1.16.0.
- **ClickUp IDs:** Placeholders `TBD` until the 1.16.0 user story + subtasks are created.

---

## Final verification

```bash
npm run migrate -w payment-root
npm run type-check -w payment-root
npm run build -w payment-root
npm run build:platform-nav
npm run type-check -w webonone-v2-root
```

Manual: Approve company → Payment subscription active → invoices at **Rs 3,000**/month from `approved_at` → super admin opens **Payment → Invoices** → mark paid.
