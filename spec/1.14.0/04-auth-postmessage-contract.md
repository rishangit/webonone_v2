# 04 — Auth postMessage contract and theme

ClickUp: [86eydjaw3](https://app.clickup.com/t/86eydjaw3)

## Purpose

Single contract for iframe login between **Identity (child)** and **WebOnOne (parent)**, plus theme sync. Aligns with [microservice-architecture.mdc](../../.cursor/rules/microservice-architecture.mdc) layers:

| Layer | Channel | This spec |
|-------|---------|-----------|
| UI embed | iframe + query | `/login?parentOrigin=…` |
| Browser handoff | postMessage | `webonone:auth:success` |
| API auth | Bearer JWT | After parent stores token |
| Redirect OAuth | auth code | **Retained** — not primary WebOnOne path |

## Message types

### Success — Identity → WebOnOne

| Field | Type | Required |
|-------|------|----------|
| `type` | `'webonone:auth:success'` | yes |
| `accessToken` | string (JWT) | yes |
| `expiresIn` | number (seconds) | yes |
| `user.id` | string | yes |
| `user.email` | string | yes |
| `user.displayName` | string | yes |
| `user.avatarUrl` | string \| null | recommended |

Optional: `embedId` if multiple frames need correlation (not required for single `/login` frame).

### Cancel — Identity → WebOnOne (optional)

```json
{ "type": "webonone:auth:cancel" }
```

### Theme — WebOnOne → Identity (channel A)

Existing ([1.2.0](../1.2.0/05-theme-propagation.md)):

```json
{ "type": "webonone:theme:apply", "…theme payload…" }
```

Send after iframe `load` (and when guest theme changes while still on `/login`). Identity already has embed theme listeners for platform embeds — ensure **login embed** (parentOrigin without `embed=platform`) also applies theme.

## Security checklist

| # | Requirement | Owner |
|---|-------------|-------|
| 1 | `parentOrigin` allowlisted before any postMessage | Identity FE |
| 2 | Parent accepts messages only from `VITE_IDENTITY_ORIGIN` | WebOnOne FE |
| 3 | Never `postMessage` target `'*'` | Both |
| 4 | Never put JWT in URL query/hash | Both |
| 5 | CSP `frame-ancestors` includes WebOnOne origin | Identity Vite / deploy |
| 6 | Validate message `type` + required fields before `loginSuccess` | WebOnOne FE |
| 7 | Short-lived access token (existing JWT TTL) | Identity BE |

## Shared types location

Prefer one of:

1. Extend `@webonone/platform-embed` with `AUTH_MESSAGE_TYPES` + type guards + `sendAuthSuccess`, **or**
2. Keep WebOnOne `embed.types.ts` and mirror a thin Identity sender using the same string literals.

Do not invent a second type string (must remain `webonone:auth:success`).

## Redirect path retained

```text
Satellite / legacy:
  Identity /login?redirect_uri=…&state=…
  → POST /auth/code → {callback}?code&state
  → POST /auth/exchange → JWT
```

WebOnOne **primary**:

```text
  WebOnOne /login
  → iframe Identity /login?parentOrigin=…
  → postMessage auth:success
  → Redux loginSuccess → /
```

Document both in rules so agents do not “fix” iframe login back to redirect-only.

## Acceptance

1. Contract implemented with origin checks on both sides.
2. Theme apply reaches login iframe (visual match with WebOnOne guest shell).
3. `/callback` exchange still works in a manual redirect test.
4. Spec + code use the same message type strings.
