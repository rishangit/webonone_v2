# WebOnOne Platform — Specification (1.17.0)

After a guest hits an action that requires sign-in, the platform must **remember the page they were on** and, after a successful login (Google or email/password), **return them to that exact page** instead of always dumping them on the WebOnOne home page. If the return target is missing or invalid, fall back to the default homepage.

**Spec No:** 1.17.0

Implementation branch: **`spec/1.17.0`**

## What changed from current platform

| Area | Before (current) | 1.17.0 |
|------|------------------|--------|
| Post-login navigation (WebOnOne) | Hardcoded `returnPath = '/'` after iframe Identity success | Honor validated **requested page** from login entry |
| Website `return_url` | Website can pass a full URL, but WebOnOne **`parseWebsiteReturnUrl` strips to origin root** | Preserve **path + safe query** on allowlisted website origins |
| Auth-required guest actions | Login often loses deep-link context | Capture current page **before** redirect to `/login` |
| Invalid / missing return | Always home | Explicit fallback to default homepage (website `/` or WebOnOne `/`) |

## Projects affected

| Project | Role in 1.17.0 |
|---------|----------------|
| **WebOnOne v2** (`webonone-v2/`) | Primary — parse/validate return target on `/login`; post-login navigate or auth-code handoff to full URL |
| **Website** (`website/`) | Ensure auth-required CTAs pass the **current page** into `getWebOnOneLoginUrl(...)` |
| **platform-nav** (`packages/platform-nav/`) | Prefer shared return-URL validation helpers if extended for path preservation |
| **Identity** (`identity/`) | No change to login methods; embed `returnPath` / postMessage flow already used by WebOnOne |
| **UI Kit / Media / Email / Data / SMS / Payment** | No domain changes |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-post-login-return-page.md](./02-post-login-return-page.md) | Capture → validate → restore after Google / email login |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.17.0 – Return User to Requested Page After Login | [86eyhz4mr](https://app.clickup.com/t/86eyhz4mr) | `01-overview.md`, `README.md` |
| Subtask: Remember current page before login; return after Google / email login; fallback homepage | [86eyhz6wv](https://app.clickup.com/t/86eyhz6wv) | [02-post-login-return-page.md](./02-post-login-return-page.md); Phase 1–2 |

## Revision history

- **2026-08-06** — Initial spec: post-login return to requested page (website deep links + WebOnOne protected entry); allowlisted validation; homepage fallback.

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.14.0/02-webonone-login-iframe-host.md](../1.14.0/02-webonone-login-iframe-host.md) | WebOnOne `/login` iframe host |
| [../1.14.0/03-identity-embed-login.md](../1.14.0/03-identity-embed-login.md) | Identity embed + `postMessage` success |
| [../1.14.0/04-auth-postmessage-contract.md](../1.14.0/04-auth-postmessage-contract.md) | Auth message shapes / security |
| [../1.0.0/07-identity-webonone-integration.md](../1.0.0/07-identity-webonone-integration.md) | Auth-code redirect handoff |

## Rules reference

| Topic | Rule / skill |
|-------|----------------|
| Service boundaries | `microservice-architecture.mdc` |
| WebOnOne login iframe | `webonone-v2-project.mdc` |
| Platform shell / peer nav | `platform-shell-navigation.mdc` |
| Orchestration | `.cursor/skills/platform-orchestrator/SKILL.md` |

## Local dev

```bash
npm run dev:identity
npm run dev:webonone
npm run dev:website
```

Manual: From a deep website page (or protected WebOnOne route), trigger login → sign in with Google or email/password → land on the **same** page (or homepage if return was invalid).
