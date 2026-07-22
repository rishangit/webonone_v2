# WebOnOne Platform — Specification (1.13.1)

Extends [1.13.0](../1.13.0/README.md) by refining the **post-login account selection** gate in WebOnOne. After Identity login succeeds and before the dashboard loads, users who can assume more than Default User must choose which **account** to use for the session: **Default User**, optional **Super Admin**, and each **company they own**.

**Spec No:** 1.13.1

Implementation branch: **`spec/1.13.1`**

## What changed from 1.13.0

| Area | 1.13.0 | 1.13.1 |
|------|--------|--------|
| Post-login gate | Existing `RoleSelectionDialog` / session-role bootstrap (auto-pick when ≤1 role or no company membership) | Explicit **Choose account** dialog rules |
| When dialog shows | Roughly when `hasCompanyMembership` and `roles.length > 1` | Show when user has **Super Admin** and/or **owned companies**; **never** when only Default User |
| Dialog contents | Assumable roles as returned (may omit Default User when companies exist; may include per-company member options) | Always list: **Default User** + **Super Admin** (if any) + **each owned company**; Default User **pre-selected** |
| Super Admin only | Auto-applies Super Admin (single role) | Dialog with Default User + Super Admin |
| Mid-session company Login | All Companies 3-dot Login (1.13.0) | Unchanged — still available after session starts |

## Projects affected

| Project | Role in 1.13.1 |
|---------|----------------|
| **WebOnOne v2** (`webonone-v2/`) | Account selection dialog UX + when to open; session-role bootstrap rules |
| **WebOnOne backend** | `GET /company/me/assumable-roles` shape for selection (Default User always when multi-account; owned companies only) |
| **Identity** | No schema change — reuse `POST /auth/session-role` reissue |
| **UI Kit** | No new primitive required — reuse `CustomDialog` + selectable cards |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-account-selection-dialog.md](./02-account-selection-dialog.md) | Dialog UX, card list, default selection, skip rules |
| [03-assumable-roles-for-selection.md](./03-assumable-roles-for-selection.md) | Assumable-roles API contract for the gate |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.13.1 Choose account after login | TBD | All docs |
| Subtask: Account selection dialog + skip when Default User only | TBD | [02](./02-account-selection-dialog.md), [03](./03-assumable-roles-for-selection.md) |

## Revision history

- **2026-07-22** — Initial spec: post-login Choose account dialog (Default User / Super Admin / owned companies).

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.13.0/06-company-owner-login.md](../1.13.0/06-company-owner-login.md) | Company Owner; mid-session Login from All Companies |
| [../1.13.0/04-multi-company-api.md](../1.13.0/04-multi-company-api.md) | Assumable roles + session reissue |
| [../1.6.0/04-super-admin-approval.md](../1.6.0/04-super-admin-approval.md) | Super admin via Identity login |

## Rules / skills reference

| Topic | Rule / skill |
|-------|----------------|
| Dialogs | `.cursor/rules/dialog-windows.mdc` |
| Loading gate | `.cursor/rules/loading-empty-states.mdc` (SessionRoleGate overlay) |
| WebOnOne scope | `.cursor/rules/webonone-v2-project.mdc` |

## Local dev

```bash
npm run dev:webonone
npm run dev:identity
```

Manual test: Default-User-only → no dialog → dashboard. Company owner → dialog with Default User (selected) + company cards. Super admin → dialog includes Super Admin card. Continue → JWT reissue → dashboard for that account.
