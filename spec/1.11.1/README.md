# WebOnOne Platform — Specification (1.11.1)

Consolidate platform **user roles** into the **Identity** microservice as the single source of truth. Remove duplicated role tables from WebOnOne v2, Email, and Data; consumers resolve permissions from JWT claims and Identity APIs — not local MySQL copies.

**Spec No:** 1.11.1

Implementation branch: **`spec/1.11.1`**

## What changed from 1.11.0

| Area | 1.11.0 | 1.11.1 |
|------|--------|--------|
| Role ownership | `users_roles` in WebOnOne; `email_user_roles` in Email; `data_user_roles` in Data | **`users_roles` in Identity only** |
| Consumer auth | Each service loads role from its own DB on every request | JWT carries **session role** + optional `company_id`; no per-service role tables |
| Role sync handoff | WebOnOne writes copies to Email/Data internal APIs | Handoff passes session role via JWT re-issue or signed claims — **no DB write** in consumers |
| Company roles | WebOnOne owns company-scoped role rows | Identity owns rows; WebOnOne queries Identity for assumable roles and company flows |

## Projects affected

| Project | Role in 1.11.1 |
|---------|------------------|
| **Identity** (`identity/`) | New `users_roles` table, migrations, role CRUD/internal API, JWT claim enrichment |
| **WebOnOne v2** (`webonone-v2/`) | Remove `users_roles`; delegate role reads/writes to Identity; update middleware and company flows |
| **Email** (`email/`) | Remove `email_user_roles`; auth reads JWT claims only |
| **Data** (`data/`) | Remove `data_user_roles`; auth reads JWT claims only; remove internal role sync route |
| **Root** (`package.json`) | No new workspace; env docs for Identity ↔ consumer JWT contract |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-identity-user-roles.md](./02-identity-user-roles.md) | Canonical schema, Identity API, events |
| [03-consumer-migration.md](./03-consumer-migration.md) | Remove local tables; middleware and handoff changes per service |
| [04-jwt-session-role.md](./04-jwt-session-role.md) | JWT claims contract, token re-issue, handoff without DB duplication |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.11.1 | 86ey5n9zt | All docs |

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.9.3/05-webonone-users-roles.md](../1.9.3/05-webonone-users-roles.md) | Original `users_roles` schema and semantics (now owned by Identity) |
| [../1.9.4/04-email-role-handoff.md](../1.9.4/04-email-role-handoff.md) | Session role handoff pattern (updated — no Email DB copy) |
| [../1.11.0/02-data-scaffold.md](../1.11.0/02-data-scaffold.md) | Data service scaffold (remove `data_user_roles` added in 1.11.0) |
| [../1.0.0/02-architecture.md](../1.0.0/02-architecture.md) | Microservice boundaries, JWT verify locally, no shared DB |

## Rules reference

| Topic | Rule |
|-------|------|
| Service boundaries | `microservice-architecture.mdc` |
| Express handlers | `nodejs-express.mdc` |
| Identity scope | `.cursor/skills/identity-agent/SKILL.md` |
| WebOnOne scope | `.cursor/skills/webonone-agent/SKILL.md` |

## Local dev

```bash
npm run dev:identity      # Identity FE + BE (role source)
npm run dev:webonone      # WebOnOne — reads roles from Identity
npm run dev:email         # Email — JWT claims only
npm run dev:data          # Data — JWT claims only
```
