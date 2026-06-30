# WebOnOne Platform — Specification (1.9.3)

Adds a reusable **`UserSelectionDialog`** to `@webonone/ui-kit` and consolidates WebOnOne user permissions into a **`users_roles`** table (replacing `super_admins` and `company_memberships`).

**Spec No:** 1.9.3

Implementation branch: **`spec/1.9.3`**

## What changed from 1.9.2

| Area | 1.9.2 | 1.9.3 |
|------|-------|-------|
| User pickers | Ad-hoc or none | Shared `UserSelectionDialog` in UI Kit |
| List loading | Pagination for static lists | Infinite scroll for large user directories |
| Search / filter | Per-screen | Built-in name search + optional role filter |
| Dialog pattern | Custom per feature | Standard `CustomDialog` shell |
| Cross-service reuse | — | Injectable `loadUsers` callback; showcase + reference consumer |
| User permissions | `super_admins` + `company_memberships` | Single `users_roles` table; multi-company / multi-role |

## Projects affected

| Project | Role in 1.9.3 |
|---------|----------------|
| **UI Kit** (`ui-kit/`) | `UserSelectionDialog` component; Dialogs tab demo |
| **WebOnOne v2** (`webonone-v2/`) | Reference consumer; **`users_roles`** migration and backend refactor |
| **Email** (`email/`) | Optional second consumer when role assignment needs user pick |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-ui-kit-user-selection-dialog.md](./02-ui-kit-user-selection-dialog.md) | Component API, infinite scroll, filters, selection |
| [03-showcase-dialogs-demo.md](./03-showcase-dialogs-demo.md) | Dialogs tab demo with mock users |
| [04-service-integration.md](./04-service-integration.md) | Consumer wiring pattern across services |
| [05-webonone-users-roles.md](./05-webonone-users-roles.md) | `users_roles` schema, migration, backend refactor |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No.1.9.3 Need to have the user selection dialog box | 86ey40acd | Dialog docs |
| need to have the user role table | 86ey40ya9 | [05-webonone-users-roles.md](./05-webonone-users-roles.md), Phase 6 |

## Revision history

- **2026-06-30** — Added `users_roles` consolidation (subtask 86ey40ya9); replaces `super_admins` / `company_memberships`.

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.3.0/05-dialogs.md](../1.3.0/05-dialogs.md) | `CustomDialog` sizing, scroll, footer rules |
| [../1.9.2/02-ui-kit-pagination.md](../1.9.2/02-ui-kit-pagination.md) | List UX patterns (contrast: infinite scroll here) |
| [../1.8.0/02-feature-page-layout.md](../1.8.0/02-feature-page-layout.md) | Feature pages that host selection triggers |

## Rules reference

| Topic | Rule |
|-------|------|
| UI Kit scope | `ui-kit-project.mdc` |
| Consumer usage | `ui-kit-consumption.mdc` |
| List rows | `item-list` skill — selectable rows without 3-dot menu |

## Local dev

```bash
npm run dev:ui-kit       # Showcase — UserSelectionDialog demo on Dialogs tab
npm run dev:webonone     # Reference consumer smoke test
```
