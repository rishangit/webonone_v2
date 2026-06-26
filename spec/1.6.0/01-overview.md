# 01 — Overview (1.6.0)

## Vision

A logged-in WebOnOne user can **register their company** from **Basic Settings**, upload a logo via the Media service, and wait for **admin approval**. A **super admin** (initially a seeded account in the Company service — not Identity) reviews pending companies and approves them. On approval, the registering user's platform role becomes **company admin** and they gain access to company management features. Users can return to the company section anytime to view company details and role status.

## Goals (1.6.0)

1. **Company microservice** — Standalone `company/` with own frontend, backend, MySQL DB, and `/health`.
2. **Register company flow** — Basic Settings shows a prompt when the user has no company; **Register Company** opens a **3-step wizard** (basics + logo → location/contact → summary/welcome).
3. **Pending state** — After submit, company status is `pending`; user sees notification that admin approval is required.
4. **Super admin (interim)** — Hard-coded super-admin credentials stored securely (hashed) in Company DB; not in Identity.
5. **Approval** — Super admin sees pending companies list; approve updates company to `approved` and sets registering user's role to `company_admin`.
6. **Company section** — User can view company name, logo, status, and their role at any time.
7. **JWT trust** — Company backend verifies Identity-issued JWT locally; stores `user_id` copies only.

## Scope (1.6.0)

### In scope

- New `company/` microservice scaffold (FE, BE, migrations, root `dev:company`).
- Tables: `companies`, `company_memberships`, `super_admins` (or equivalent role storage).
- REST API: register company, get my company/membership, list pending (super admin), approve company.
- WebOnOne **Basic Settings** route (`/settings/basic`) with registration prompt, dialog, and company detail section.
- Media upload embed for company logo (`scope=company:{companyId}`, `folderPath=/logo` or pre-registration temp path — see [03](./03-webonone-company-ui.md)).
- Super-admin UI in WebOnOne (or Company FE) for pending list and approve action.
- Root workspace wiring: `dev:company`, build scripts.

### Out of scope (1.6.0)

- Identity schema or role changes — Identity remains auth-only; platform roles live in Company service.
- UI to promote arbitrary users to super admin (deferred; seed only for now).
- Multi-company membership per user (one company per user in 1.6.0).
- Company billing, teams, or site editor integration.
- Async events (`CompanyApproved` to other services) — optional follow-up; 1.6.0 uses sync API + local membership read.
- Email notifications on approval.

## Glossary

| Term | Definition |
|------|------------|
| **Company** | Business entity registered on the platform; has name, logo URL, status |
| **Company status** | `pending` → `approved` (reject/cancel deferred) |
| **Platform role** | Role within Company service: `member`, `company_admin`, `super_admin` |
| **Super admin** | Platform operator who approves pending companies; seeded in Company DB |
| **Company admin** | User who registered the company; gains admin role after approval |
| **Basic Settings** | WebOnOne settings page for company registration and company details |
| **Logo URL** | Public Media URL returned from upload embed; stored on `companies.logo_url` |

## Success criteria

1. Logged-in user without a company sees registration prompt on Basic Settings.
2. Register dialog accepts company name + logo; submit creates `pending` company and membership.
3. User sees “approval required” message and can return to view pending status.
4. Super admin logs in with seeded credentials and sees pending companies list.
5. Approve action sets company `approved` and user role `company_admin`.
6. Approved user sees company details and admin role in company section.
7. `npm run dev` starts Company alongside other services; Company `/health` works standalone.
8. `npm run type-check` passes for `company-root` and `webonone-v2-root`.

## Subtask mapping (ClickUp)

| Subtask | ID | Spec section |
|---------|-----|----------------|
| Parent — register company user story | 86ey2nrgd | All docs |
| Core project need to have the user roles | 86ey2p61f | [02](./02-company-service.md), [03](./03-webonone-company-ui.md), [04](./04-super-admin-approval.md) |
| comapny registration need to improve | 86ey2pmp2 | [03](./03-webonone-company-ui.md) wizard; [02](./02-company-service.md) extended company fields |
