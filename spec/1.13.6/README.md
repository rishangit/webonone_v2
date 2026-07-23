# WebOnOne Platform — Specification (1.13.6)

Company owners manage **customers** for their company from **Identity → Users**: browse the company customer list, **Add** a user via the shared **UserSelectionDialog**, and persist membership in Identity `users_roles`. Adding a customer sends a **welcome email** and, when the company has an **SMS gateway** configured, a **welcome SMS**. On **company registration**, the platform seeds company-scoped **welcome** templates for both Email and SMS.

**Spec No:** 1.13.6

Implementation branch: **`spec/1.13.6`**

## What changed from current platform

| Area | Before | 1.13.6 |
|------|--------|--------|
| Identity → Users | Super admin only — all platform users | **Company owner** sees **customers of the session company**; SA unchanged |
| Add customer | None | **Add** opens `UserSelectionDialog`; assigns `member` + `company_id` |
| Welcome on add | N/A | **Welcome email** always; **welcome SMS** if SMS gateway configured |
| Company registration templates | Platform email templates only; no company welcome SMS seed | Seed company-scoped **`welcome`** Email + SMS templates on register |

## Projects affected

| Project | Role in 1.13.6 |
|---------|----------------|
| **Identity** (`identity/`) | Primary UI (Users list + Add); company-scoped customer list API; assign `member` role; orchestrate welcome sends |
| **WebOnOne v2** (`webonone-v2/`) | On company register, call Email + SMS to seed company welcome templates |
| **Email** (`email/`) | Internal provision welcome company template; send welcome on add |
| **SMS** (`sms/`) | Internal provision welcome company template; gateway-configured check; send welcome on add |
| **UI Kit** (`ui-kit/`) | Reuse existing `UserSelectionDialog` — no new component required |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-company-customers-list.md](./02-company-customers-list.md) | Identity → Users list for company owners |
| [03-add-customer-user-selection.md](./03-add-customer-user-selection.md) | UserSelectionDialog + membership assign API |
| [04-welcome-notifications.md](./04-welcome-notifications.md) | Welcome email + conditional SMS on add |
| [05-default-welcome-templates.md](./05-default-welcome-templates.md) | Seed welcome Email/SMS templates on company registration |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.13.6 Company owners add customers | [86eyd50u3](https://app.clickup.com/t/86eyd50u3) | All docs |
| Subtask: Company customers list under Identity → Users | [86eyd50vy](https://app.clickup.com/t/86eyd50vy) | [02](./02-company-customers-list.md) |
| Subtask: Add customer via UserSelectionDialog | [86eyd50w9](https://app.clickup.com/t/86eyd50w9) | [03](./03-add-customer-user-selection.md) |
| Subtask: Welcome email and SMS on customer add | [86eyd50we](https://app.clickup.com/t/86eyd50we) | [04](./04-welcome-notifications.md) |
| Subtask: Seed company welcome Email + SMS templates on registration | [86eyd50wt](https://app.clickup.com/t/86eyd50wt) | [05](./05-default-welcome-templates.md) |

## Revision history

- **2026-07-23** — Initial spec: company customers list, UserSelectionDialog add, welcome email/SMS, default templates on registration.

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.11.1/02-identity-user-roles.md](../1.11.1/02-identity-user-roles.md) | Canonical Identity `users_roles` |
| [../1.9.3/02-ui-kit-user-selection-dialog.md](../1.9.3/02-ui-kit-user-selection-dialog.md) | `UserSelectionDialog` API |
| [../1.9.0/03-sending-engine.md](../1.9.0/03-sending-engine.md) | Email templates + internal send |
| [../1.9.1/06-registration-welcome-email.md](../1.9.1/06-registration-welcome-email.md) | Platform `welcome` email pattern |
| [../1.12.0/06-sms-templates.md](../1.12.0/06-sms-templates.md) | SMS company templates + resolution |
| [../1.13.0/04-multi-company-api.md](../1.13.0/04-multi-company-api.md) | Company registration creates owner role |
| [../1.6.0/02-company-service.md](../1.6.0/02-company-service.md) | Company domain baseline |

## Rules / skills reference

| Topic | Rule / skill |
|-------|----------------|
| Identity service | `.cursor/skills/identity-agent/SKILL.md` |
| WebOnOne service | `.cursor/skills/webonone-agent/SKILL.md` |
| Email / SMS | `.cursor/skills/sms-agent/SKILL.md` (SMS); Email follows microservice rules |
| Item lists | `.cursor/skills/item-list/SKILL.md` |
| Dialogs | `.cursor/rules/dialog-windows.mdc` |
| Microservice boundaries | `.cursor/rules/microservice-architecture.mdc` |

## Local dev

```bash
npm run dev:identity   # Identity FE + BE (Users list + Add)
npm run dev:webonone   # Company registration → template seed
npm run dev:email      # Welcome email + company template provision
npm run dev:sms        # Welcome SMS + gateway check + template provision
```

Manual test: Sign in as **company owner** → Identity → **Users** → **Add** → pick user → row appears → welcome email queued → with SMS gateway + phone, welcome SMS queued. Register a new company → Email + SMS each have company-scoped `welcome` template.
