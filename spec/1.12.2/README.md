# WebOnOne Platform — Specification (1.12.2)

Extends [1.12.1](../1.12.1/README.md) by adding **Send Email** and **Queue** to the existing **Email** left-nav group in WebOnOne — the same iframe embed channel already used for Email History and Templates. Super admins and company admins see four Email sub-items; the Email microservice continues to own the pages and APIs.

**Spec No:** 1.12.2

Implementation branch: **`spec/1.12.2`**

## What changed from 1.12.1

| Area | 1.12.1 | 1.12.2 |
|------|--------|--------|
| Email core sub-nav | History, Templates | **Send Email**, **Queue**, History, Templates |
| `@webonone/platform-nav` | `EMAIL_NAV_SENTINELS` history + templates | Also `send` + `queue` |
| WebOnOne peer default | Email iframe default `/history` | Default `/send` (first sub-item) |
| SMS / other peers | Unchanged | Unchanged |

## Projects affected

| Project | Role in 1.12.2 |
|---------|----------------|
| **packages/platform-nav** | Extend Email sentinels + Email group children |
| **WebOnOne v2** (`webonone-v2/frontend/`) | Icons for send/queue; peer default path |
| **Email** (`email/frontend/`) | Confirm embed for `/send` and `/queue` (pages already exist) |
| **Data / Identity FEs** | Path→sentinel maps for new Email children when showing core nav |
| **Root** | No new workspace or env keys |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-webonone-email-send-queue-nav.md](./02-webonone-email-send-queue-nav.md) | Sentinels, order, embed wiring, satellite hops |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.12.2 | TBD | All docs |
| Subtask: Email Send + Queue under WebOnOne | TBD | [02-webonone-email-send-queue-nav.md](./02-webonone-email-send-queue-nav.md); Phase 1–2 |

## Revision history

- **2026-07-21** — Initial spec: Email Send + Queue in WebOnOne core nav.

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.9.1/03-email-history-templates.md](../1.9.1/03-email-history-templates.md) | Original Email History / Templates core group |
| [../1.12.1/02-webonone-sms-nav.md](../1.12.1/02-webonone-sms-nav.md) | SMS group pattern (Send / Queue parity) |
| [../1.11.2/02-cross-service-nav-fix.md](../1.11.2/02-cross-service-nav-fix.md) | Satellite peer outbound handlers |

## Rules reference

| Topic | Rule |
|-------|------|
| Embed vs redirect | `platform-shell-navigation.mdc` |
| Service boundaries | `microservice-architecture.mdc` |
| WebOnOne scope | `webonone-v2-project.mdc` |
| Email scope | `email-project.mdc` |

## Local dev

```bash
npm run dev:webonone   # Core shell — Email group with four children
npm run dev:email      # Email FE :3014 + BE :4014 (iframe target)
npm run dev:identity   # JWT / session
```

Manual test: sign in as super admin or company admin → expand **Email** → **Send Email** and **Queue** load inside WebOnOne without leaving the shell.
