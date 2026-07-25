# 07 — Implementation Plan

Phased delivery for **1.14.0** on branch **`spec/1.14.0`**.

---

## Branch workflow

```bash
git checkout master
git pull
git checkout -b spec/1.14.0
```

| Rule | Detail |
|------|--------|
| Base | Current platform with redirect login + peer iframes |
| Spec branch | `spec/1.14.0` |
| Scope | WebOnOne FE auth login host; Identity FE embed login; optional `packages/platform-embed`; Cursor rules |
| UI Kit | No new primitives required |

---

## Phase 0 — Spec (this folder)

- [x] `spec/1.14.0/*` documentation
- [x] Branch `spec/1.14.0`
- [x] ClickUp parent **86eydjav3** + ready subtasks

---

## Phase 1 — Auth message contract (shared)

**Goal:** [04](./04-auth-postmessage-contract.md)

| Task | Detail |
|------|--------|
| Types / guards | `webonone:auth:success` / `cancel` — platform-embed and/or WebOnOne `embed.types.ts` |
| Sender helper | Identity can call a single `sendAuthSuccess(parentOrigin, payload)` |
| Theme | Confirm login iframe receives channel A apply |

**Exit criteria:** Shared constants compile; type-check package if touched.

**Verify:** `npm run type-check` / build for `@webonone/platform-embed` if changed

---

## Phase 2 — Identity embed login

**Goal:** [03](./03-identity-embed-login.md) · ClickUp [86eydjavx](https://app.clickup.com/t/86eydjavx)

| Task | Detail |
|------|--------|
| Detect embed | Allowlisted `parentOrigin` |
| Success path | postMessage; skip `completeAuthRedirect` |
| Query links | Preserve `parentOrigin` + `returnPath` on register/forgot |
| Redirect mode | Unchanged when no embed |

**Exit criteria:** Manual iframe test posts success; redirect OAuth still works.

**Verify:** `npm run type-check -w identity-root`

---

## Phase 3 — WebOnOne `/login` host

**Goal:** [02](./02-webonone-login-iframe-host.md) · ClickUp [86eydjavt](https://app.clickup.com/t/86eydjavt)

| Task | Detail |
|------|--------|
| Remove redirect | Delete auto `location.assign` from `LoginPage` |
| Frame + listener | `IdentityLoginFrame` + `useIdentityAuthMessage` |
| Session | `loginSuccess` + navigate `returnPath` |
| Theme on load | postMessage apply into iframe |
| Keep `/callback` | Do not remove exchange page |

**Exit criteria:** `/login` stays on WebOnOne origin; sign-in reaches home authenticated.

**Verify:** `npm run type-check -w webonone-v2-root`

---

## Phase 4 — Cursor rules

**Goal:** ClickUp [86eydjaw5](https://app.clickup.com/t/86eydjaw5)

| Task | Detail |
|------|--------|
| `webonone-v2-project.mdc` | `/login` embeds Identity via iframe + postMessage; no auto top-level redirect |
| `identity-project.mdc` | Embed login `parentOrigin` + postMessage; redirect mode for OAuth |
| Confirm | `microservice-architecture.mdc` already lists iframe login — no contradiction |

**Exit criteria:** Rules match implemented behavior.

---

## Acceptance checklist

- [ ] WebOnOne `/login` does not redirect the top window to Identity
- [ ] Identity login UI visible in iframe
- [ ] Successful login → WebOnOne session + home (or `returnPath`)
- [ ] Register / forgot stay in iframe with `parentOrigin`
- [ ] Redirect `/callback` exchange still works
- [ ] Origin allowlists enforced; no `postMessage('*')`
- [ ] Theme channel A applied to login iframe
- [ ] Cursor rules updated
- [ ] `npm run type-check -w identity-root`
- [ ] `npm run type-check -w webonone-v2-root`

---

## ClickUp subtask traceability

| Subtask | ID | Phase / doc |
|---------|-----|-------------|
| WebOnOne `/login` hosts Identity login iframe | 86eydjavt | Phase 3 · [02](./02-webonone-login-iframe-host.md) |
| Identity embed login postMessage on success | 86eydjavx | Phase 2 · [03](./03-identity-embed-login.md) |
| Auth postMessage contract and theme channel A | 86eydjaw3 | Phase 1 · [04](./04-auth-postmessage-contract.md) |
| Update Cursor rules for iframe login | 86eydjaw5 | Phase 4 |

---

## Forbidden

- Local WebOnOne login forms
- JWT in URL
- Removing `/callback` in this release
- Using `PlatformServiceFrame` (requires accessToken) for unauthenticated login
- `postMessage` with target `'*'`
