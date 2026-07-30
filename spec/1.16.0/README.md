# WebOnOne Platform — Specification (1.16.0)

Extends the platform with a standalone **Payment microservice** that owns all payment-related work for the system and (later) customers. **Initial stage (this release)** covers **system payments only**: monthly company subscription invoices at **LKR 3,000** per month, with billing starting from each company's **activation date** (`approved_at`). Super admins see a full **companies invoices** list.

**Spec No:** 1.16.0

Implementation branch: **`spec/1.16.0`**

## What changed from current platform

| Area | Before (current) | 1.16.0 |
|------|------------------|--------|
| Payment / billing | None (explicitly out of scope since 1.6.0) | Dedicated **`payment/`** microservice — own FE, BE, DB |
| Company subscription | Free after approve | System invoices **LKR 3,000 / month** from activation |
| Super-admin visibility | Companies list only | **Invoices** list — all companies' system invoices |
| Customer payments | N/A | **Out of scope** (deferred to a later payment release) |
| Payment gateway (card / bank) | N/A | **Out of scope** — manual / recorded payment status in v1 |

## Projects affected

| Project | Role in 1.16.0 |
|---------|----------------|
| **Payment** (`payment/`) | New service — FE (admin) + BE + migrations; primary scope |
| **WebOnOne v2** (`webonone-v2/`) | On company **approve**: notify Payment of activation; super-admin nav → Payment Invoices; env keys |
| **platform-nav** (`packages/platform-nav/`) | Super-admin **Payment** nav group (Invoices) |
| **Identity / Media / Email / Data / SMS** | No domain changes (JWT already shared) |
| **Root** (`package.json`) | Register `payment/` workspaces; `dev:payment`, `build:payment`, `migrate:payment` |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-payment-service-scaffold.md](./02-payment-service-scaffold.md) | Service layout, ports, auth, roles, nav, DB base |
| [03-system-billing-and-invoices.md](./03-system-billing-and-invoices.md) | Plans, activation sync, invoice periods, generation worker, API |
| [04-super-admin-invoices-ui.md](./04-super-admin-invoices-ui.md) | Invoices list UI (Payment FE + WebOnOne nav entry) |
| [05-platform-integration.md](./05-platform-integration.md) | WebOnOne approve → Payment sync, nav, security, release checklist |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| Subtask | ID | Spec doc / phase |
|---------|-----|------------------|
| [User Story] Spec No 1.16.0 | TBD | All docs |
| Subtask 1 — Payment service scaffold | TBD | [02](./02-payment-service-scaffold.md); Phase 1 |
| Subtask 2 — System billing + invoices engine | TBD | [03](./03-system-billing-and-invoices.md); Phase 2 |
| Subtask 3 — Super-admin invoices UI | TBD | [04](./04-super-admin-invoices-ui.md); Phase 3 |
| Subtask 4 — Platform integration and release | TBD | [05](./05-platform-integration.md); Phase 4 |

## Revision history

- **2026-07-30** — Initial spec: Payment microservice; system subscription invoices LKR 3,000/month from company activation; super-admin all-companies invoice list. Customer payments and payment gateways deferred.

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.0.0/02-architecture.md](../1.0.0/02-architecture.md) | Microservice boundaries, JWT, no shared DB |
| [../1.6.0/04-super-admin-approval.md](../1.6.0/04-super-admin-approval.md) | Company approve → `approved_at` (activation) |
| [../1.9.0/02-email-scaffold.md](../1.9.0/02-email-scaffold.md) | Standalone service scaffold pattern |
| [../1.12.0/02-sms-service-scaffold.md](../1.12.0/02-sms-service-scaffold.md) | Latest peer service scaffold + root wiring |
| [../1.9.4/03-nav-and-permissions.md](../1.9.4/03-nav-and-permissions.md) | Session role → nav variant |

## Rules reference

| Topic | Rule / skill |
|-------|----------------|
| Service boundaries | `microservice-architecture.mdc` |
| Express handlers | `nodejs-express.mdc` |
| MySQL schema | `mysql-database-architecture.mdc` |
| Platform shell / peer nav | `platform-shell-navigation.mdc` |
| Item lists | `.cursor/skills/item-list/SKILL.md` |
| Feature store | `.cursor/skills/feature-store/SKILL.md` |
| Forms | `.cursor/skills/form-creation/SKILL.md` |
| Orchestration | `.cursor/skills/platform-orchestrator/SKILL.md` |

## Local dev

```bash
npm run dev:payment       # Payment admin FE :3017 + BE :4017
npm run migrate -w payment-root
npm run dev:webonone      # Approve company → Payment sync; super-admin Payment nav
npm run build:platform-nav
```

Manual test: Approve a company in WebOnOne → Payment receives activation → monthly invoice(s) appear → log in as **super admin** → **Payment → Invoices** shows all companies' system invoices.
