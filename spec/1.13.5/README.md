# WebOnOne Platform — Specification (1.13.5)

Extends the Data catalog ([1.11.0](../1.11.0/README.md), nav in [1.12.3](../1.12.3/README.md)) so **company owners** can **add** catalog items on every entity list. Owner-created rows start as **Unverified** (`pending`); only a **super admin** can verify them. Every list/detail row exposes a **reference count** — how many times that entity is used elsewhere in the Data catalog.

**Spec No:** 1.13.5

Implementation branch: **`spec/1.13.5`**

## What changed from 1.11.0 / current Data

| Area | Before | 1.13.5 |
|------|--------|--------|
| Add button (list pages) | Shown only for `super_admin` | Shown for **`company_admin` and `super_admin`** on all six entities |
| POST create auth | Tags: company_admin OK; Units / Attributes / Products / Services / Spaces: **super_admin only** | **All six** POST: `company_admin` **or** `super_admin` |
| Create status (owner) | Client may send `status` (often ignored / default `pending`) | Company owner create **always** stores **`pending`** (UI: **Unverified**); cannot self-verify |
| Verify | Super admin edits `status` in form | Super admin **Verify** action (list menu + editor); only SA may set `verified` |
| Reference / usage | Delete blocked by FK only; no count in UI | **`referenceCount`** on list + detail DTOs; shown on each row |

## Projects affected

| Project | Role in 1.13.5 |
|---------|----------------|
| **Data** (`data/`) | Primary — FE Add permissions, create status rules, verify UX, `referenceCount` API |
| **WebOnOne v2** | None required (Data embeds already; same peer session role) |
| **Identity / UI Kit / Media** | No change |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-company-owner-create.md](./02-company-owner-create.md) | Enable Add; POST auth; forced Unverified status |
| [03-super-admin-verify.md](./03-super-admin-verify.md) | Verify workflow; who may set `verified` |
| [04-reference-counts.md](./04-reference-counts.md) | Usage counts per entity; list/detail display |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.13.5 Company owner Data catalog create + verify | TBD | All docs |
| Subtask: Enable Add for company owners on all entities | TBD | [02](./02-company-owner-create.md) |
| Subtask: Super admin verify Unverified items | TBD | [03](./03-super-admin-verify.md) |
| Subtask: Reference / usage count on entities | TBD | [04](./04-reference-counts.md) |

## Revision history

- **2026-07-23** — Initial spec: company-owner create (Unverified), super-admin verify, reference counts.

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.11.0/01-overview.md](../1.11.0/01-overview.md) | Data microservice vision |
| [../1.11.0/03-domain-entities.md](../1.11.0/03-domain-entities.md) | Status `verified` \| `pending`; FK delete rules |
| [../1.11.0/04-crud-api.md](../1.11.0/04-crud-api.md) | REST CRUD shape |
| [../1.11.0/05-admin-ui.md](../1.11.0/05-admin-ui.md) | List + editor patterns |
| [../1.12.3/02-webonone-data-catalog-nav.md](../1.12.3/02-webonone-data-catalog-nav.md) | Core Data nav for company_admin + super_admin |

## Rules / skills reference

| Topic | Rule / skill |
|-------|----------------|
| Data service | `.cursor/skills/data-agent/SKILL.md` |
| Forms | `.cursor/skills/form-creation/SKILL.md` |
| Item lists | `.cursor/skills/item-list/SKILL.md` |
| Feature pages | `.cursor/rules/feature-page-layout.mdc` |
| Microservice boundaries | `.cursor/rules/microservice-architecture.mdc` |

## Local dev

```bash
npm run dev:data       # Data FE + BE
npm run dev:webonone   # Optional — embed Data lists in core shell
npm run dev:identity   # JWT / role claims
```

Manual test: Sign in as **company owner** → Data → each entity → **Add** enabled → create → row shows **Unverified** and `referenceCount` → sign in as **super admin** → **Verify** → status **Verified**.
