# WebOnOne Platform — Specification (1.9.0)

Extends [1.8.0](../1.8.0/README.md) with a standalone **Email microservice** — async transactional mail (verification, password reset, welcome, company approval/rejection), template and branding management per company, queue with retries, send history and audit trail. WebOnOne adds an **Email** menu entry (redirect handoff); Identity and WebOnOne backends call Email over a versioned internal API — no SMTP credentials in consumer services.

**Spec No:** 1.9.0

Implementation branch: **`spec/1.9.0`**

## What changed from 1.8.0

| Area | 1.8.0 | 1.9.0 |
|------|-------|-------|
| Email delivery | Not centralized | Dedicated **`email/`** microservice with own DB, queue, SMTP |
| Platform menu | Identity, Media links | **Email** entry in core nav (redirect to Email origin) |
| Password reset / verification | Identity-only token storage; no mail send | Identity generates tokens → **Email service** sends templated mail |
| Company lifecycle mail | None | WebOnOne triggers registration / approval / rejection via Email API |
| Admin UI | N/A | Email FE: Dashboard, Send, Templates, History, Queue, Test, Providers, Settings |

## Projects affected

| Project | Role in 1.9.0 |
|---------|----------------|
| **Email** (`email/`) | New service — FE + BE + migrations; primary scope |
| **Identity** (`identity/backend/`) | Auth routes call Email internal API for reset/verification mail |
| **WebOnOne v2** (`webonone-v2/`) | Core nav Email link; company service triggers lifecycle emails |
| **Platform nav** (`packages/platform-nav/`) | Optional: shared Email path in core nav defs |
| **UI Kit** (`ui-kit/`) | Reuse `AppShell`, `FeaturePage`, form/list primitives — no new exports required |
| **Root** (`package.json`) | Register `email/` workspace; `dev:email`, root `dev` |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-email-scaffold.md](./02-email-scaffold.md) | Service layout, auth, roles, nav, WebOnOne entry |
| [03-sending-engine.md](./03-sending-engine.md) | SMTP, queue, templates, branding, internal send API |
| [04-management-screens.md](./04-management-screens.md) | Admin FE routes and role-gated screens |
| [05-platform-integration.md](./05-platform-integration.md) | Identity + WebOnOne triggers, security, release checklist |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| Subtask | ID | Spec doc / phase |
|---------|-----|------------------|
| [User Story] Spec No 1.9.0 | 86ey30c9y | All docs |
| Subtask 1 — Email service repo scaffold | 86ey38567 | [02](./02-email-scaffold.md); Phase 1 |
| Subtask 2 — Transactional email sending engine | 86ey38852 | [03](./03-sending-engine.md); Phase 2 |
| Subtask 3 — Email management screens | 86ey3887z | [04](./04-management-screens.md); Phase 3 |
| Subtask 4 — Platform integrations and release readiness | 86ey388eg | [05](./05-platform-integration.md); Phase 4 |

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.0.0/02-architecture.md](../1.0.0/02-architecture.md) | Microservice boundaries, JWT, no shared DB |
| [../1.0.0/07-identity-webonone-integration.md](../1.0.0/07-identity-webonone-integration.md) | Auth-code redirect, JWT verify locally |
| [../1.6.0/02-company-service.md](../1.6.0/02-company-service.md) | Company registration / approval flows |
| [../1.8.0/02-feature-page-layout.md](../1.8.0/02-feature-page-layout.md) | `FeaturePage` for Email admin pages |

## Rules reference

| Topic | Rule |
|-------|------|
| Service boundaries | `microservice-architecture.mdc` |
| Express handlers | `nodejs-express.mdc` |
| Forms | `.cursor/skills/form-creation/SKILL.md` |
| Item lists | `.cursor/skills/item-list/SKILL.md` |
| Feature pages | `feature-page-layout.mdc` |

## Local dev

```bash
npm run dev:email       # Email FE :3004 + BE :4004
npm run dev:identity    # Identity — reset/verify integration
npm run dev:webonone    # WebOnOne — Email nav + company mail
npm run migrate -w email-root
```
