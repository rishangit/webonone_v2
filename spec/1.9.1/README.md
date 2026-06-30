# WebOnOne Platform — Specification (1.9.1)

Extends [1.9.0](../1.9.0/README.md) with **OTP-based password reset** (4-digit code, 1-minute expiry) sent via the Email microservice, and clarified **History** and **Templates** admin surfaces scoped by role (super admin: platform/system; company admin: company-scoped).

**Spec No:** 1.9.1

Implementation branch: **`spec/1.9.1`**

## What changed from 1.9.0

| Area | 1.9.0 | 1.9.1 |
|------|-------|-------|
| Password reset | Email with **reset link** (1-hour token) | Email with **4-digit OTP**; 1-minute expiry; **3-attempt** lockout; multi-step Identity UI |
| Reset validation | Single `/reset-password?token=` page | Email entry → OTP entry (countdown) → new password |
| Email template | `password_reset` with `actionUrl` | `password_reset_otp` with `userName`, `otp` placeholders |
| Email admin nav | History + Templates at service nav | **Email** core nav **group** with **Email History** + **Templates** sub-items (no dashboard redirect); role scoping unchanged |

## Projects affected

| Project | Role in 1.9.1 |
|---------|----------------|
| **Identity** (`identity/`) | Multi-step forgot-password UI; OTP generate/store/verify APIs; **four-step registration** with email OTP; call Email internal send |
| **Email** (`email/`) | `password_reset_otp` template seed; History/Templates API scope rules; optional nav label clarity |
| **UI Kit** (`ui-kit/`) | `OtpInput` — multi-box OTP entry control (default 4 digits, length prop) |
| **WebOnOne v2** | No direct change — users reach forgot-password via Identity embed/login |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-identity-otp-reset.md](./02-identity-otp-reset.md) | OTP flow, APIs, Identity FE screens, Email trigger |
| [03-email-history-templates.md](./03-email-history-templates.md) | Role-scoped History/Templates, OTP template editor |
| [04-ui-kit-otp-input.md](./04-ui-kit-otp-input.md) | Shared OTP digit-box control + showcase |
| [05-identity-registration-otp.md](./05-identity-registration-otp.md) | Four-step registration with email OTP |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## Revision history

- **Subtask 86ey3t18g** — Four-step registration: email → OTP verify → profile → password; `email_verification_otp` template; user created with verified email.
- **Subtask 86ey3rq8b** — Add `OtpInput` to UI Kit (configurable digit boxes); showcase on Controls tab; use on Identity verify-reset OTP step.
- **Subtask 86ey3j67h** — Email left nav becomes an expandable group (**Email History**, **Templates**) in platform shell for super admin and company admin; remove dashboard as the Email nav target.

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.9.1 | 86ey3hef6 | All docs |
| left navigation need to have the sub navigation | 86ey3j67h | [03-email-history-templates.md](./03-email-history-templates.md), Phase 5 in [07-implementation-plan.md](./07-implementation-plan.md) |
| need to have the control for OTP | 86ey3rq8b | [04-ui-kit-otp-input.md](./04-ui-kit-otp-input.md), Phase 6 in [07-implementation-plan.md](./07-implementation-plan.md) |
| need to email virification for the user regitration | 86ey3t18g | [05-identity-registration-otp.md](./05-identity-registration-otp.md), Phase 7 in [07-implementation-plan.md](./07-implementation-plan.md) |

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.9.0/03-sending-engine.md](../1.9.0/03-sending-engine.md) | Queue, SMTP, internal send API, placeholder rendering |
| [../1.9.0/04-management-screens.md](../1.9.0/04-management-screens.md) | History and Templates pages (baseline UI) |
| [../1.9.0/05-platform-integration.md](../1.9.0/05-platform-integration.md) | Identity → Email internal API pattern |
| [../1.0.0/07-identity-webonone-integration.md](../1.0.0/07-identity-webonone-integration.md) | Auth embed; Identity owns password flows |

## Rules reference

| Topic | Rule |
|-------|------|
| Service boundaries | `microservice-architecture.mdc` |
| Identity scope | `identity-project.mdc` |
| Email scope | `email-project.mdc` |
| Forms | `.cursor/skills/form-creation/SKILL.md` |
| Item lists | `.cursor/skills/item-list/SKILL.md` |

## Local dev

```bash
npm run dev:identity    # Forgot-password OTP UI + APIs
npm run dev:email       # Template + history admin
npm run migrate -w identity-root
npm run migrate -w email-root
```
