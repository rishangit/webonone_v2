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
| Email admin nav | History + Templates at service nav | Same routes; **role scoping** enforced — super admin sees all system history/templates; company admin sees company-scoped only |

## Projects affected

| Project | Role in 1.9.1 |
|---------|----------------|
| **Identity** (`identity/`) | Multi-step forgot-password UI; OTP generate/store/verify APIs; call Email internal send |
| **Email** (`email/`) | `password_reset_otp` template seed; History/Templates API scope rules; optional nav label clarity |
| **WebOnOne v2** | No direct change — users reach forgot-password via Identity embed/login |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-identity-otp-reset.md](./02-identity-otp-reset.md) | OTP flow, APIs, Identity FE screens, Email trigger |
| [03-email-history-templates.md](./03-email-history-templates.md) | Role-scoped History/Templates, OTP template editor |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.9.1 | 86ey3hef6 | All docs |

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
