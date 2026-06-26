# WebOnOne Platform — Specification (1.6.0)

Extends [1.5.0](../1.5.0/README.md) with a **Company microservice** for company registration, admin approval workflow, and **platform user roles** scoped to companies. WebOnOne v2 gains a **Basic Settings** page where logged-in users register a company (name + logo), see pending/approved status, and company admins manage details after approval. A **super admin** (seeded credentials in the Company service) approves pending registrations.

Implementation branch: **`spec/1.6.0`**

**Spec No:** 1.6.0

## Revision history

- **Registration UX polish (subtask 86ey2punp):** Remove logo from registration wizard; fix Select z-index inside dialogs; icon-only Previous/Next footer buttons; `CountrySelect` and `PhoneInput` from UI Kit; make state/region and postal code optional.
- **Wizard registration (subtask 86ey2pmp2):** Replace single-step register dialog with a **3-step wizard** (basics → location/contact → summary/welcome). Extend `companies` schema and register API with description, company size, location, and contact fields. Logo upload remains on step 1.

## What changed from 1.5.0

| Area | 1.5.0 | 1.6.0 |
|------|-------|-------|
| Company domain | None | New **`company/`** microservice with own DB |
| WebOnOne settings | System Theme only | **Basic Settings** — company registration prompt, **3-step register wizard**, company section |
| User roles (platform) | None in WebOnOne | `member` (default), `company_admin` (after approval), `super_admin` (seeded) |
| Logo upload | N/A | Media **upload** embed scoped to company logo path |
| Super admin | N/A | Hard-coded seed account in Company DB; pending-companies approval UI |

## Projects affected

| Project | Role in 1.6.0 |
|---------|----------------|
| **Company** (`company/`) | New service — companies, memberships, roles, super-admin auth, approval API |
| **WebOnOne v2** (`webonone-v2/`) | Basic Settings page, register-company dialog, company section, super-admin pending list |
| **Media** (`media/`) | Logo upload via existing upload embed (no schema changes) |
| **`@webonone/media-embed`** (`packages/media-embed/`) | Consumer URL builder for logo upload (existing upload embed) |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Goals, scope, glossary, success criteria |
| [02-company-service.md](./02-company-service.md) | Company microservice — schema, roles, API, super-admin seed |
| [03-webonone-company-ui.md](./03-webonone-company-ui.md) | Basic Settings, register dialog, company section, Media logo |
| [04-super-admin-approval.md](./04-super-admin-approval.md) | Super-admin login, pending list, approve → role update |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| Subtask | ID | Spec doc / phase |
|---------|-----|------------------|
| [User Story] Spec No 1.6.0 Register my company | 86ey2nrgd | All docs |
| Core project need to have the user roles | 86ey2p61f | [02](./02-company-service.md), [03](./03-webonone-company-ui.md), [04](./04-super-admin-approval.md) |
| comapny registration need to improve | 86ey2pmp2 | [03](./03-webonone-company-ui.md) — wizard; [02](./02-company-service.md) — extended fields |
| comapny regitration improvements | 86ey2punp | [03](./03-webonone-company-ui.md) — registration UX polish; [ui-kit](../../ui-kit/package/) — overlay z-index |

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.5.0/02-identity-profile-page.md](../1.5.0/02-identity-profile-page.md) | Media consumer patterns in platform apps |
| [../1.4.0/08-media-consumer-integration.md](../1.4.0/08-media-consumer-integration.md) | JWT init, postMessage, scope/folderPath |
| [../1.0.0/07-identity-webonone-integration.md](../1.0.0/07-identity-webonone-integration.md) | JWT verification on consumer backends |
| [../1.0.0/02-architecture.md](../1.0.0/02-architecture.md) | Standalone microservice layout |

## Rules reference

| Topic | Rule |
|-------|------|
| Service boundaries | `microservice-architecture.mdc` |
| Cross-service auth | JWT verified locally; `user_id` CHAR(21) foreign copy only |
| Media embed | iframe + postMessage; logo via upload embed |
| Env | Per-service `frontend/.env` and `backend/.env`; `VITE_MEDIA_ORIGIN` + `VITE_COMPANY_API_BASE_URL` in WebOnOne |

## Local dev

```bash
npm run dev:company    # Company FE + BE (new)
npm run dev:webonone   # WebOnOne consumer
npm run dev:media      # Logo upload embed
npm run build:media-embed
```
