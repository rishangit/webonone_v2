# 01 — Overview (1.6.0)

## Vision

A logged-in WebOnOne user can **register their company** from **Basic Settings** via a **3-step wizard**, and wait for **admin approval**. A **super admin** (email allowlisted in `super_admins`) signs in via the default `/login` page and manages all registered companies from the **Companies** nav. On approval, the registering user's platform role becomes **company admin**. Users can return to the company section anytime to view company details, optional logo thumbnail, and role status.

## Goals (1.6.0)

1. **Company feature in WebOnOne v2** — Registration, memberships, roles, and approval API under `webonone-v2/`; tables in **WebOnOne core DB** (`webonone_v2`).
2. **Register company flow** — Basic Settings shows a prompt when the user has no company; **Register Company** opens a **3-step wizard** (basics → location/contact → summary/welcome). No logo step in registration (subtask 86ey2punp).
3. **Pending state** — After submit, company status is `pending`; user sees notification that admin approval is required.
4. **Super admin (interim)** — Email allowlisted in `super_admins`; signs in via default `/login` (Identity) with matching account.
5. **Approval** — Super admin uses **Companies** nav to view all companies and set status to `approved`, `rejected`, or `pending`.
6. **Company section** — User can view company name, logo (if `logo_url` set), status, and their role at any time. Read-only in 1.6.0.
7. **JWT trust** — Company backend verifies Identity-issued JWT locally; stores `user_id` copies only.

## Architecture (core feature)

Company registration is a **WebOnOne v2 core feature** — backend logic, API routes, and UI all live under `webonone-v2/`. Company tables are in the **`webonone_v2`** schema alongside themes and user preferences.

| Rule | Detail |
|------|--------|
| Migrations owner | `webonone-v2/backend/migrations/` |
| Backend code | `webonone-v2/backend/src/services/company.service.ts`, `repositories/`, `routes/company.routes.ts` |
| Seed super admin | `npm run seed -w @webonone/webonone-backend` |

## Scope (1.6.0)

### In scope

- Company backend under `webonone-v2/backend/`; company tables migrated in **`webonone-v2/backend/migrations/`**.
- Tables: `companies`, `company_memberships`, `super_admins` (or equivalent role storage).
- REST API: register company, get my company/membership, list pending (super admin), approve company.
- WebOnOne **Basic Settings** route (`/settings/basic`) with registration prompt, wizard dialog, and company detail section.
- Super-admin UI in WebOnOne (or Company FE) for pending list and approve action.
- Root workspace wiring unchanged (four services).

### Out of scope (1.6.0)

- Identity schema or role changes — Identity remains auth-only; platform roles live in Company service.
- UI to promote arbitrary users to super admin (deferred; seed only for now).
- Multi-company membership per user (one company per user in 1.6.0).
- Company billing, teams, or site editor integration.
- **Media logo upload** during registration or post-approval edit (deferred; `logo_url` column retained for display).
- Async events (`CompanyApproved` to other services) — optional follow-up; 1.6.0 uses sync API + local membership read.
- Email notifications on approval.

## Glossary

| Term | Definition |
|------|------------|
| **Company** | Business entity registered on the platform; has name, optional logo URL, status |
| **Company status** | `pending`, `approved`, or `rejected` |
| **Platform role** | Role within Company service: `member`, `company_admin`, `super_admin` |
| **Super admin** | Platform operator who approves pending companies; seeded in `webonone_v2` |
| **Company admin** | User who registered the company; gains admin role after approval |
| **Basic Settings** | WebOnOne settings page for company registration and company details |
| **Logo URL** | Optional Media public URL stored on `companies.logo_url`; upload deferred in 1.6.0 |

## Success criteria

1. Logged-in user without a company sees registration prompt on Basic Settings.
2. Register wizard accepts company basics + location/contact fields; submit creates `pending` company and membership (`logoUrl` optional).
3. User sees “approval required” message and can return to view pending status.
4. Super admin logs in at `/login` (Identity) with seeded email and sees **Companies** nav with all registered companies.
5. Status actions set company `approved` (registrant → `company_admin`), `rejected`, or `pending`.
6. Approved user sees company details and admin role in company section.
7. `npm run dev:webonone` serves company feature; no separate company process required.
8. `npm run type-check` passes for `webonone-v2-root`.
9. Company backend reads/writes `webonone_v2` schema natively.

## Subtask mapping (ClickUp)

| Subtask | ID | Spec section |
|---------|-----|----------------|
| Parent — register company user story | 86ey2nrgd | All docs |
| Core project need to have the user roles | 86ey2p61f | [02](./02-company-service.md), [03](./03-webonone-company-ui.md), [04](./04-super-admin-approval.md) |
| comapny registration need to improve | 86ey2pmp2 | [03](./03-webonone-company-ui.md) wizard; [02](./02-company-service.md) extended company fields |
| comapny regitration improvements | 86ey2punp | [03](./03-webonone-company-ui.md) — registration UX polish |
