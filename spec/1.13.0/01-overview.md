# 01 — Overview (1.13.0)

## Vision

A logged-in WebOnOne user opens **Settings → All Companies** and sees every company they belong to as a **glass-card item list**, each with a UI Kit **`StatusTag`** (**Pending**, **Approved**, or **Rejected**) and a **3-dot menu**. Registering a company makes them the **Company Owner** (`company_admin` in Identity) for that company. From the row menu they **Login** to an **approved** company and the session switches to company-owner rights for it. Every client registration starts as **Pending** until a **super admin** approves or rejects it from the top-level **Companies** queue. All Companies is the **user-owned** collection; super-admin **Companies** is the approval queue. Status chips come from the UI Kit **Tags** tab primitive — not hand-rolled badges.

## User story

As a normal WebOnOne user, I want an **All Companies** item under **Settings** so I can see my companies in a list, register one or more companies, and **Login** to a company I own so I have company-owner rights for that company. After I submit a registration, I am already the **Company Owner** membership, but the company stays **Pending** until a super admin approves it; only then can I Login. Status labels use the shared UI Kit company status tags.

## Goals (1.13.0)

1. **Nav** — Add **All Companies** under Settings for `member`, `main` (company admin / owner), and `superAdmin` platform nav variants.
2. **List page** — Route `/settings/companies` uses UI Kit list-page composition (`FeaturePage` → `ListPageBody` → `ItemList` / `ItemListEmpty` → `Pagination`) per the item-list skill.
3. **Multi-company** — Users may register **multiple** companies; each registration creates a **pending** company + Identity `users_roles` row for that company as **Company Owner** (`company_admin`).
4. **Company status** — Every company has exactly one of: `pending`, `approved`, `rejected`. Client register **always** sets `pending`. Only super admin may transition to `approved` or `rejected` (or back to `pending`).
5. **UI Kit company status tags** — Upgrade the showcase **Tags** tab with company status tags (`StatusTag`); use them on All Companies and super-admin Companies lists.
6. **Register CTA** — Header **Add company** (icon + text) opens the existing `RegisterCompanyDialog` wizard; after submit, the list refreshes showing the new row as **Pending** + **Company Owner**.
7. **3-dot Login** — Each company row has a 3-dot menu with **Login**; enabled for **Approved** companies the user owns; switches session to company-owner rights for that company ([06-company-owner-login.md](./06-company-owner-login.md)).
8. **Basic Settings cleanup** — Remove the single-company registration prompt / detail section from Basic Settings (or replace with a short link to All Companies) so Settings does not duplicate company UX.
9. **API** — Expose a **list my companies** endpoint; keep `GET /company/me` for primary/session compatibility or document deprecation for list consumers.
10. **No confusion with super-admin Companies** — Top-level `/companies` remains the only place normal users’ pending companies are **approved / rejected**.

## Scope (1.13.0)

### In scope

- `@webonone/platform-nav`: Settings child **All Companies** → `/settings/companies`
- `webonone-v2/frontend`: `AllCompaniesPage` (or rename from a dedicated page), `MyCompaniesList` using ItemList primitives + **3-dot Login**, route + icon wiring
- `webonone-v2/backend`: `GET /api/v1/company/me/companies` (or equivalent) returning the current user’s companies + role + status
- Confirm `POST /company/register` allows an additional company when the user already has one (no 409 “already has company”), **always** persists `status = pending`, and assigns registrant **`company_admin` (Company Owner)**
- Status lifecycle: `pending` ↔ `approved` / `rejected` only via super-admin APIs (`PATCH /company/admin/:id/status` / approve shortcut); All Companies UI is read-only for status
- **Company Login** from All Companies row menu via existing session-role reissue (`company_admin` + `companyId`); only **approved** companies unlock owner session
- Migrate register / company detail UX off Basic Settings into All Companies
- Client search (optional) + client or server pagination consistent with other list pages
- Redux / store-kit pattern for the my-companies list (align with existing `companiesStore` or extend it)
- **UI Kit:** upgrade Tags showcase with **Company status tags**; ensure `StatusTag` variants map to company status
- **WebOnOne:** render company status only via `<StatusTag variant={status} />` (All Companies + super-admin `CompaniesList`)

### Out of scope

- Editing company profile / logo upload (still deferred from 1.6.0)
- Inviting other users into a company / team management
- Letting registrants self-approve or change status
- Header company switcher chrome (All Companies **Login** is the in-scope switcher)
- New Identity role enum value (keep storing `company_admin`; UI may say Company Owner)
- New microservice — company remains a WebOnOne v2 feature
- Identity schema migration (unique on `user_id, company_id, role` already supports multi-company)
- Redesigning super-admin approval **actions** (reuse existing `/companies` menu); only the status **chip** migrates to `StatusTag`
- Non-company tag systems (Data catalog tags, `SelectTag` picker) beyond documenting them separately on the Tags tab if already present

## Glossary

| Term | Definition |
|------|------------|
| **All Companies** | Settings submenu and page listing companies the signed-in user is linked to |
| **My company row** | One list row: name, **StatusTag**, role, optional logo, **3-dot menu** |
| **Company Owner** | Registrant of the company; Identity role `company_admin` for that `company_id`; UI label on All Companies |
| **Login (to company)** | 3-dot action that reissues the session as Company Owner for that company |
| **Company status** | Enum: `pending`, `approved`, `rejected` — only valid values on `companies.status` |
| **StatusTag** | UI Kit company status tag (`variant` = status); shown on showcase **Tags** tab |
| **Pending** | Default after client registration; waiting for super-admin decision |
| **Approved** | Super admin accepted the registration; Login becomes available |
| **Rejected** | Super admin declined the registration |
| **Register Company wizard** | Existing 3-step dialog from 1.6.0 |
| **Companies (super admin)** | Top-level nav `/companies` — platform-wide list where status is set to approve / reject / pending |
| **Primary company** | Optional single company used by session / `GET /company/me` (first `company_admin` or earliest membership) |

## Success criteria

1. Member, company admin / owner, and super admin see **Settings → All Companies**.
2. Empty state shows `ItemListEmpty` copy and **Add company** still available in the header.
3. User can register company A, then company B; both appear in the list as **Pending** via `StatusTag` with role **Company Owner**.
4. Company status is only `pending`, `approved`, or `rejected` — never a fourth value and never auto-approved on register.
5. Super admin can **Approve** or **Reject** from `/companies`; registrant’s All Companies `StatusTag` updates accordingly; until then the company remains **Pending**.
6. Showcase **Tags** tab documents company status tags (Pending / Approved / Rejected).
7. No hand-rolled company status pills remain on All Companies or super-admin Companies lists.
8. List uses UI Kit `ItemList*` primitives (no hand-rolled row chrome); primary CTA is `Button size="sm"` with `Plus` + label; every row has a **3-dot menu**.
9. After approval, **Login** from the 3-dot menu switches the session to company-owner rights for that company; Login stays disabled while Pending/Rejected.
10. Basic Settings no longer hosts the only path to register a company.
11. `npm run type-check` passes for `ui-kit-root`, `webonone-v2-root`, and platform-nav tests.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — Spec No 1.13.0 | TBD | All docs |
| Subtask — All Companies list + multi register | TBD | [02](./02-settings-all-companies-nav.md), [03](./03-my-companies-list-ui.md), [04](./04-multi-company-api.md) |
| Subtask — UI Kit Tags company status tags | TBD | [05-ui-kit-company-status-tags.md](./05-ui-kit-company-status-tags.md) |
| Subtask — Company Owner + Login from list | TBD | [06-company-owner-login.md](./06-company-owner-login.md) |
