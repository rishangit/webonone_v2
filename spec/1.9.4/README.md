# WebOnOne Platform — Specification (1.9.4)

Post-login **session role selection** so users with multiple platform hats (super admin, company admin, default user) pick one role per login session. The chosen role drives WebOnOne shell navigation, route guards, and Email service handoff scope.

**Spec No:** 1.9.4

Implementation branch: **`spec/1.9.4`**

## What changed from 1.9.3

| Area | 1.9.3 | 1.9.4 |
|------|-------|-------|
| Active platform role | Implicit from `isSuperAdmin` boolean | Explicit **session role** chosen after login |
| Role selection UI | None | Modal dialog when user has company membership and multiple assumable roles |
| Navigation | `main` vs `superAdmin` only | `superAdmin`, `companyAdmin`, `member` variants |
| Email menu | Visible in both nav variants | Hidden for **default user** (`member` session); company vs system scope via sync |
| Email role sync | Derived from DB primary role | Uses **session-selected** role + company context |

## Projects affected

| Project | Role in 1.9.4 |
|---------|----------------|
| **WebOnOne v2** (`webonone-v2/`) | Role dialog, session store, nav guards, backend roles API, email sync |
| **Platform nav** (`packages/platform-nav/`) | New `companyAdmin` nav variant; member nav without Email group |
| **Email** (`email/`) | Consumes synced role from existing `sync-email-role` contract (no schema change) |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-session-role-selection.md](./02-session-role-selection.md) | Dialog UX, session persistence, backend roles API |
| [03-nav-and-permissions.md](./03-nav-and-permissions.md) | Nav variants, route guards, Email visibility |
| [04-email-role-handoff.md](./04-email-role-handoff.md) | Session-aware `sync-email-role` |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan (implementation) |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No.1.9.4 | 86ey41tfh | All docs |

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.9.3/05-webonone-users-roles.md](../1.9.3/05-webonone-users-roles.md) | `users_roles` schema and repository |
| [../1.8.0/02-feature-page-layout.md](../1.8.0/02-feature-page-layout.md) | Feature pages under AppShell |
| [../1.9.0/05-platform-integration.md](../1.9.0/05-platform-integration.md) | Email auth-code handoff |

## Rules reference

| Topic | Rule |
|-------|------|
| Shell navigation | `platform-shell-navigation.mdc` |
| WebOnOne scope | `webonone-v2-project.mdc` |
| Microservice boundaries | `microservice-architecture.mdc` |

## Local dev

```bash
npm run dev:webonone     # Role dialog after login; nav varies by session role
npm run dev:email        # History/templates scoped to synced role
```
