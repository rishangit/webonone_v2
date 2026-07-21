# WebOnOne Platform — Specification (1.12.3)

Extends [1.12.2](../1.12.2/README.md) by expanding the **Data** left-nav group in WebOnOne so operators can open every catalog feature — **Tags**, **Units**, **Attributes**, **Products**, **Services**, and **Spaces** — via the same **iframe embed channel** used for Email and SMS. The Data microservice continues to own the pages and APIs.

**Spec No:** 1.12.3

Implementation branch: **`spec/1.12.3`**

## What changed from 1.12.2

| Area | 1.12.2 (and prior Data nav) | 1.12.3 |
|------|-----------------------------|--------|
| Data core sub-nav | Data Catalog + Tags only | **Tags**, **Units**, **Attributes**, **Products**, **Services**, **Spaces** |
| `@webonone/platform-nav` | `DATA_NAV_SENTINELS` dashboard + tags | Six entity sentinels; Dashboard stays standalone-Data-only |
| WebOnOne peer default | Data iframe default `/` | Default `/tags` (first sub-item) |
| Email / SMS peers | Unchanged | Unchanged |

## Projects affected

| Project | Role in 1.12.3 |
|---------|----------------|
| **packages/platform-nav** | Extend Data sentinels + Data group children |
| **WebOnOne v2** (`webonone-v2/frontend/`) | Icons for six sentinels; peer default path |
| **Data** (`data/frontend/`) | Confirm embed for all six list routes (pages already exist) |
| **Email / SMS / Identity FEs** | Path→sentinel maps for new Data children when showing core nav |
| **Root** | No new workspace or env keys (`VITE_DATA_ORIGIN` already present) |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-webonone-data-catalog-nav.md](./02-webonone-data-catalog-nav.md) | Sentinels, order, embed wiring, satellite hops |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.12.3 | TBD | All docs |
| Subtask: Data catalog features under WebOnOne (Tags / Units / Attributes / Products / Services / Spaces) | TBD | [02-webonone-data-catalog-nav.md](./02-webonone-data-catalog-nav.md); Phase 1–2 |

## Revision history

- **2026-07-21** — Initial spec: Data catalog six-feature nav group in WebOnOne (Email/SMS parity).

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.11.0/05-admin-ui.md](../1.11.0/05-admin-ui.md) | Data standalone routes for six entities |
| [../1.11.0/06-platform-integration.md](../1.11.0/06-platform-integration.md) | Original Data peer / WebOnOne entry |
| [../1.12.1/02-webonone-sms-nav.md](../1.12.1/02-webonone-sms-nav.md) | SMS group pattern (multi-child embed) |
| [../1.12.2/02-webonone-email-send-queue-nav.md](../1.12.2/02-webonone-email-send-queue-nav.md) | Email group extend pattern |
| [../1.11.2/02-cross-service-nav-fix.md](../1.11.2/02-cross-service-nav-fix.md) | Satellite peer outbound handlers |

## Rules reference

| Topic | Rule |
|-------|------|
| Embed vs redirect | `platform-shell-navigation.mdc` |
| Service boundaries | `microservice-architecture.mdc` |
| WebOnOne scope | `webonone-v2-project.mdc` |
| Data scope | `.cursor/skills/data-agent/SKILL.md` |

## Local dev

```bash
npm run dev:webonone   # Core shell — Data group with six children
npm run dev:data       # Data FE :3005 + BE :4005 (iframe target)
npm run dev:identity   # JWT / session
```

Manual test: sign in as super admin or company admin → expand **Data** → each of Tags / Units / Attributes / Products / Services / Spaces loads inside WebOnOne without leaving the shell.
