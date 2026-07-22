# WebOnOne Platform — Specification (1.13.0)

Extends [1.12.3](../1.12.3/README.md) and company registration from [1.6.0](../1.6.0/README.md) by adding **All Companies** under the WebOnOne **Settings** menu. Logged-in **normal users** manage **one or more** companies they registered from a standard **list page** (UI Kit `FeaturePage` + item-list skill). Creating a company assigns **Company Owner** (`company_admin`). Each row’s **3-dot menu** includes **Login** so an owner can enter an **approved** company and receive company-owner rights for that session.

**Spec No:** 1.13.0

Implementation branch: **`spec/1.13.0`**

## What changed from 1.12.3 / 1.6.0

| Area | Before | 1.13.0 |
|------|--------|--------|
| Company UX entry | Basic Settings prompt / single company section | **Settings → All Companies** list page |
| Companies per user | Effectively one primary company in UI (`GET /company/me`) | **One or multiple** companies the user created / belongs to |
| Member nav | Settings: Basic Settings, System Theme | Settings adds **All Companies** |
| Super-admin approval list | Top-level **Companies** (`/companies`) | Unchanged — distinct from All Companies |
| Register flow | Basic Settings → Register Company wizard | **All Companies** primary CTA → same wizard |
| Company status | `pending` / `approved` / `rejected` (1.6.0) | **Required** on every company; client register always starts **Pending** until super admin approves or rejects |
| Status chip UI | Hand-rolled spans in WebOnOne company lists | UI Kit **`StatusTag`** (Tags tab) used for all company status |
| Owner role on create | Registrant `company_admin` (1.6.0) | **Required** — registrant is **Company Owner** (`company_admin`) for the new company |
| Enter company session | Post-login role dialog only | All Companies row **3-dot → Login** (approved + owner) reissues session as company owner |

## Projects affected

| Project | Role in 1.13.0 |
|---------|----------------|
| **packages/platform-nav** | Add Settings child **All Companies** (`/settings/companies`) for `member`, `main`, `superAdmin` |
| **WebOnOne v2** (`webonone-v2/`) | All Companies list page + 3-dot Login, store/API for my-companies list, migrate register CTA off Basic Settings; consume `StatusTag` |
| **UI Kit** (`ui-kit/`) | Upgrade **Tags** showcase with **company status tags**; ensure `StatusTag` is the shared primitive |
| **Identity** | No schema change — `users_roles` already allows multiple `(user_id, company_id, role)` rows; session-role reissue used for Login |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-settings-all-companies-nav.md](./02-settings-all-companies-nav.md) | Nav label, route, variants, icon |
| [03-my-companies-list-ui.md](./03-my-companies-list-ui.md) | List page composition, row content, 3-dot Login, register CTA, Basic Settings cleanup |
| [04-multi-company-api.md](./04-multi-company-api.md) | List-my-companies API, status lifecycle, register → pending + Company Owner, session Login |
| [05-ui-kit-company-status-tags.md](./05-ui-kit-company-status-tags.md) | Tags tab upgrade + `StatusTag` consumption for company status |
| [06-company-owner-login.md](./06-company-owner-login.md) | Company Owner on create; Login from All Companies 3-dot menu |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.13.0 All Companies under Settings | TBD | All docs |
| Subtask: Settings submenu All Companies + list page (multi-company register) | TBD | [02](./02-settings-all-companies-nav.md), [03](./03-my-companies-list-ui.md), [04](./04-multi-company-api.md) |
| Subtask: UI Kit Tags — company status tags + use in company lists | TBD | [05-ui-kit-company-status-tags.md](./05-ui-kit-company-status-tags.md) |
| Subtask: Company Owner role + Login from All Companies | TBD | [06-company-owner-login.md](./06-company-owner-login.md) |

## Revision history

- **2026-07-22** — Initial spec: Settings → All Companies list for normal users; multi-company registration; item-list + FeaturePage layout.
- **2026-07-22** — Clarify company status enum (`pending` / `approved` / `rejected`): client registration always creates **Pending**; only super admin may approve or reject.
- **2026-07-22** — Upgrade UI Kit Tags tab with company status tags (`StatusTag`); require WebOnOne company lists to use them.
- **2026-07-22** — Company Owner on register (`company_admin`); All Companies 3-dot **Login** to assume approved company owner session.

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.6.0/02-company-service.md](../1.6.0/02-company-service.md) | Company tables, register payload, approval statuses |
| [../1.6.0/03-webonone-company-ui.md](../1.6.0/03-webonone-company-ui.md) | 3-step Register Company wizard |
| [../1.6.0/04-super-admin-approval.md](../1.6.0/04-super-admin-approval.md) | Super-admin `/companies` approval list |
| [../1.11.0/08-list-page-layout-refinements.md](../1.11.0/08-list-page-layout-refinements.md) | `FeaturePage` + `ListPageBody` + bottom pagination |
| [../1.10.1/02-ui-kit-list-filter-panel.md](../1.10.1/02-ui-kit-list-filter-panel.md) | Header search / filter patterns |

## Rules / skills reference

| Topic | Rule / skill |
|-------|----------------|
| List rows + 3-dot menu | `.cursor/skills/item-list/SKILL.md` |
| Feature page layout | `.cursor/rules/feature-page-layout.mdc` |
| Dialog / register wizard | `.cursor/rules/dialog-windows.mdc` |
| Forms | `.cursor/skills/form-creation/SKILL.md` |
| WebOnOne scope | `.cursor/rules/webonone-v2-project.mdc` |
| UI Kit | `.cursor/skills/ui-kit-agent/SKILL.md` |

## Local dev

```bash
npm run dev:ui-kit     # Showcase — Tags tab company status tags
npm run dev:webonone   # WebOnOne FE + BE (All Companies + company API)
npm run dev:identity   # JWT + users_roles for multi-company memberships
```

Manual test: showcase **Tags** shows Pending / Approved / Rejected via `StatusTag` → sign in as a normal user → **Settings → All Companies** → register → row uses **Pending** + **Company Owner** → 3-dot **Login** disabled → super admin **Companies** Approve → user **Login** → session has company-owner rights for that company.
