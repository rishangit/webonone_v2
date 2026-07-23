# 01 — Overview (1.13.6)

## Vision

Company owners grow their company directory without leaving Identity. From **Identity → Users** they see **customers** already linked to the active company, **Add** new ones from the platform user directory via the shared selection dialog, and the platform greets each new customer with a **welcome email** and — when the company runs an SMS gateway — a **welcome text**. Every new company starts with ready-to-edit **welcome** templates for both channels.

## User stories

1. As a **company owner** (`company_admin` with session `companyId`), under **Identity → Users** I see the list of customers belonging to my company.
2. As a company owner, I click **Add**, pick a registered user from the **UserSelectionDialog**, and that user becomes a customer of my company.
3. As a newly added customer, I receive a **welcome email** from the company.
4. As a newly added customer, if the company has an **SMS gateway** and I have a phone number on file, I also receive a **welcome SMS**.
5. As a company owner registering a company, my company automatically gets default **welcome** Email and SMS templates I can later customize.

## Goals (1.13.6)

1. **Company-scoped Users list** — Identity Users page supports company_admin mode (customers of session company).
2. **Add via UserSelectionDialog** — Reuse `@webonone/ui-kit` dialog; Identity `loadUsers`; exclude existing company members.
3. **Membership write** — Persist Identity `users_roles` row: `role = member`, `company_id = session company`.
4. **Welcome email on add** — Always enqueue Email `welcome` for the company after successful add.
5. **Welcome SMS on add (conditional)** — Enqueue SMS `welcome` only when company SMS gateway is configured and user has a phone.
6. **Default templates on register** — WebOnOne company registration provisions company-scoped Email + SMS `welcome` templates (idempotent).

## Scope (1.13.6)

### In scope

- Identity FE: Users page dual mode (super_admin directory vs company_admin customers)
- Identity FE: Add button + `UserSelectionDialog` wiring
- Identity BE: List company customers; assign company member (JWT-auth, company_admin guard)
- Identity BE: After add → call Email internal send; optionally SMS internal send
- SMS BE: Endpoint or query to answer “does this company have a gateway configured?”
- Email + SMS BE: Internal provision of company-scoped `welcome` templates
- WebOnOne BE: On `registerCompany`, call Email + SMS provision APIs
- Platform SMS `welcome` seed if missing (so company copies have a source)

### Out of scope

- Inviting users who are **not** already registered on the platform (no email-invite signup flow)
- Multi-select add / bulk import
- Removing or demoting customers from the Users list UI (can be a follow-up)
- Changing JWT/session role of the added user automatically (they keep Default User until they choose the company account)
- Redesigning `UserSelectionDialog` (reuse as-is from [1.9.3](../1.9.3/02-ui-kit-user-selection-dialog.md))
- Company-scoped partitions of the global Identity user directory for super admin
- Custom welcome copy editor on the Add flow (templates are edited in Email/SMS admin UIs)

## Glossary

| Term | Definition |
|------|------------|
| **Customer** | Business label for a platform user with Identity role `member` and `company_id` = this company |
| **Company owner** | Session role `company_admin` with a non-null session `companyId` |
| **UserSelectionDialog** | Shared UI Kit dialog ([1.9.3](../1.9.3/02-ui-kit-user-selection-dialog.md)) |
| **SMS gateway configured** | Company has at least one **active** registered gateway device in the SMS service |
| **Welcome templates** | Company-scoped Email and SMS templates with slug `welcome` |

## Permission matrix (delta)

| Action | `member` | `company_admin` (session company) | `super_admin` |
|--------|----------|-----------------------------------|---------------|
| Identity → Users nav | existing rules | **yes — company customers** | yes — all users |
| List company customers | no | **yes (own company)** | optional / via SA directory |
| Add customer to company | no | **yes** | out of scope for v1 (owners only) |
| Assign `member` for other companies | no | no | via existing internal role APIs only |

## Success criteria

1. Company owner opens Identity → Users and sees only their company’s customers.
2. Add → select user → user appears on the list; Identity has `users_roles` (`member`, that `company_id`).
3. Welcome email is queued for the user’s email using company `welcome` (or platform fallback).
4. With SMS gateway + phone: welcome SMS queued; without gateway or phone: no SMS, add still succeeds.
5. New company registration creates Email + SMS company `welcome` templates (idempotent on retry).
6. `npm run type-check` passes for Identity, WebOnOne, Email, and SMS workspaces touched.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — Spec No 1.13.6 | 86eyd50u3 | All docs |
| Company customers list | 86eyd50vy | [02](./02-company-customers-list.md) |
| Add via UserSelectionDialog | 86eyd50w9 | [03](./03-add-customer-user-selection.md) |
| Welcome email and SMS | 86eyd50we | [04](./04-welcome-notifications.md) |
| Seed welcome templates | 86eyd50wt | [05](./05-default-welcome-templates.md) |
