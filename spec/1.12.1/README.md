# WebOnOne Platform — Specification (1.12.1)

Extends [1.12.0](../1.12.0/README.md) by embedding the **SMS** admin surfaces inside the **WebOnOne** left navigation — the same **iframe embed channel** used for Email and Data. Super admins and company admins see an expandable **SMS** group with **Send SMS**, **Devices**, **Queue**, **History**, and **Templates**; the SMS microservice continues to own the pages and APIs.

**Spec No:** 1.12.1

Implementation branch: **`spec/1.12.1`**

## What changed from 1.12.0

| Area | 1.12.0 | 1.12.1 |
|------|--------|--------|
| WebOnOne SMS entry | Optional single redirect handoff (scaffold note only) | Full **SMS** nav **group** in core left nav |
| Sub-nav | N/A in core | **Send SMS**, **Devices**, **Queue**, **History**, **Templates** |
| Shell channel | Redirect-only (optional) | **Embed** in `#main-content` via `PlatformPeerFrame` (mirror Email/Data) |
| `@webonone/platform-nav` | No SMS sentinels | `SMS_NAV_SENTINELS` + `externalService: 'sms'` |
| Role visibility | Documented on SMS standalone only | Same roles in core: super_admin + company_admin; hidden for member |

## Projects affected

| Project | Role in 1.12.1 |
|---------|----------------|
| **packages/platform-nav** | SMS sentinels, `ExternalServiceId`, core nav groups |
| **WebOnOne v2** (`webonone-v2/frontend/`) | `smsConfig`, router `sms/*`, `PlatformPeerFrame` peer, icons, env |
| **SMS** (`sms/frontend/`) | Confirm embed path works for all five routes; CSP / allowed parents |
| **Email / Data / Identity FEs** | Outbound SMS sentinel handlers when showing core nav (redirect channel) |
| **Root** | No new workspace; document `VITE_SMS_ORIGIN` on WebOnOne FE |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-webonone-sms-nav.md](./02-webonone-sms-nav.md) | Core nav group, sentinels, embed wiring, satellite hops |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.12.1 | TBD | All docs |
| Subtask: SMS left nav under WebOnOne (Send / Devices / Queue / History / Templates) | TBD | [02-webonone-sms-nav.md](./02-webonone-sms-nav.md); Phase 1–3 |

## Revision history

- **2026-07-21** — Initial spec: WebOnOne SMS nav group + iframe embed (Email parity).

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.12.0/02-sms-service-scaffold.md](../1.12.0/02-sms-service-scaffold.md) | SMS standalone nav, ports, roles |
| [../1.12.0/05-platform-integration.md](../1.12.0/05-platform-integration.md) | Optional WebOnOne SMS entry (superseded for nav by this spec) |
| [../1.9.1/03-email-history-templates.md](../1.9.1/03-email-history-templates.md) | Email core nav **group** pattern |
| [../1.11.0/06-platform-integration.md](../1.11.0/06-platform-integration.md) | Data core nav + peer config |
| [../1.11.2/02-cross-service-nav-fix.md](../1.11.2/02-cross-service-nav-fix.md) | Satellite peer outbound handlers |

## Rules reference

| Topic | Rule |
|-------|------|
| Embed vs redirect | `platform-shell-navigation.mdc` |
| Service boundaries | `microservice-architecture.mdc` |
| SMS scope | `.cursor/skills/sms-agent/SKILL.md` |
| WebOnOne scope | `webonone-v2-project.mdc` |

## Local dev

```bash
npm run dev:webonone   # Core shell — SMS group in left nav
npm run dev:sms        # SMS FE :3016 + BE :4016 (iframe target)
npm run dev:identity   # JWT / session
```

Manual test: sign in as super admin or company admin → expand **SMS** → each sub-item loads the matching SMS page inside WebOnOne without leaving the shell.
