# WebOnOne Platform — Specification (1.14.0)

Restore **iframe Identity login** on WebOnOne: keep route **`/login`**, load Identity’s login UI **inside an iframe**, and hand off the JWT via **`postMessage`** — no top-level redirect to the Identity origin. Matches how the shell already embeds peer pages (Email, Data, Profile, SMS).

**Spec No:** 1.14.0

Implementation branch: **`spec/1.14.0`**

## What changed from current platform

| Area | Before (current) | 1.14.0 |
|------|------------------|--------|
| WebOnOne `/login` | Auto `window.location.assign` to Identity `/login?redirect_uri=…` | Stays on WebOnOne; **iframe** loads Identity `/login?parentOrigin=…` |
| Auth handoff | Auth-code redirect → `/callback` → `POST /auth/exchange` | **Primary:** `webonone:auth:success` postMessage → Redux `loginSuccess` → navigate home |
| Identity login modes | Redirect mode only (for WebOnOne) | **Embed mode** (`parentOrigin`) + existing redirect mode for satellites / OAuth |
| Theme on login | URL theme params on redirect | **Channel A** embed `webonone:theme:apply` into the login iframe |
| `/callback` | Used by WebOnOne primary login | **Retained** for auth-code consumers; not required for WebOnOne iframe login |

## Projects affected

| Project | Role in 1.14.0 |
|---------|----------------|
| **WebOnOne v2** (`webonone-v2/`) | Primary — `/login` iframe host + auth message listener |
| **Identity** (`identity/`) | Embed login success via postMessage; preserve `parentOrigin` on register/forgot |
| **platform-embed** (`packages/platform-embed/`) | Optional shared auth message types/helpers |
| **UI Kit / Media / Email / Data / SMS** | No change |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-webonone-login-iframe-host.md](./02-webonone-login-iframe-host.md) | WebOnOne `/login` host, frame URL, listener |
| [03-identity-embed-login.md](./03-identity-embed-login.md) | Identity embed mode + postMessage on success |
| [04-auth-postmessage-contract.md](./04-auth-postmessage-contract.md) | Message shapes, security, theme channel A, `/callback` retention |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.14.0 WebOnOne iframe Identity login | [86eydjav3](https://app.clickup.com/t/86eydjav3) | All docs |
| Subtask: WebOnOne `/login` hosts Identity login iframe | [86eydjavt](https://app.clickup.com/t/86eydjavt) | [02](./02-webonone-login-iframe-host.md) |
| Subtask: Identity embed login postMessage on success | [86eydjavx](https://app.clickup.com/t/86eydjavx) | [03](./03-identity-embed-login.md) |
| Subtask: Auth postMessage contract and theme channel A | [86eydjaw3](https://app.clickup.com/t/86eydjaw3) | [04](./04-auth-postmessage-contract.md) |
| Subtask: Update Cursor rules for iframe login | [86eydjaw5](https://app.clickup.com/t/86eydjaw5) | [07](./07-implementation-plan.md) Phase 4 |

## Revision history

- **2026-07-25** — Initial spec: restore WebOnOne iframe login; Identity embed postMessage; keep `/callback` for redirect consumers.

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.0.0/02-architecture.md](../1.0.0/02-architecture.md) | Original iframe login topology |
| [../1.0.0/04-webonone-v2-project.md](../1.0.0/04-webonone-v2-project.md) | `/login` iframe host concept |
| [../1.0.0/03-identity-project.md](../1.0.0/03-identity-project.md) | Embed mode + postMessage payload |
| [../1.0.0/07-identity-webonone-integration.md](../1.0.0/07-identity-webonone-integration.md) | Auth-code redirect (retained for satellites) |
| [../1.2.0/05-theme-propagation.md](../1.2.0/05-theme-propagation.md) | Theme channel A for embeds |

## Rules / skills reference

| Topic | Rule / skill |
|-------|----------------|
| Microservice boundaries | `.cursor/rules/microservice-architecture.mdc` |
| WebOnOne service | `.cursor/skills/webonone-agent/SKILL.md` · `.cursor/rules/webonone-v2-project.mdc` |
| Identity service | `.cursor/skills/identity-agent/SKILL.md` · `.cursor/rules/identity-project.mdc` |
| Platform shell / peer iframes | `.cursor/rules/platform-shell-navigation.mdc` |

## Local dev

```bash
npm run dev:identity   # Identity FE + BE (login UI in iframe)
npm run dev:webonone   # WebOnOne FE + BE (/login host)
```

Manual test: Open `http://localhost:3010/login` → URL stays WebOnOne → Identity sign-in UI in iframe → after credentials, land on `/` signed in. Register / forgot-password links navigate **inside** the iframe only.
