# 07 — Identity ↔ WebOnOne Integration

Authoritative guide for connecting **Identity** and **WebOnOne v2** (and the pattern for all microservice links in this platform).

Related: [02-architecture.md](./02-architecture.md), [03-identity-project.md](./03-identity-project.md), [04-webonone-v2-project.md](./04-webonone-v2-project.md), `microservice-architecture.mdc`.

## Three connection layers

Every cross-service link uses the **right channel** for its layer. Do not mix them.

| Layer | Channel | Used for |
|-------|---------|----------|
| **1 — UI embed** | `<iframe>` + query params | Host another service's UI (login) in your app |
| **2 — Browser handoff** | `window.postMessage` | Pass login result (JWT + profile) parent ↔ child |
| **3 — Service trust** | JWT in `Authorization` header | Prove identity on each API request |
| **4 — Async sync** | Versioned events | Provision or update local copies after registration |

```text
Layer 1–2 (browser):  WebOnOne FE ←iframe/postMessage→ Identity FE
Layer 3 (API):        WebOnOne FE ──Bearer JWT──► WebOnOne BE (verify locally)
Layer 4 (async):      Identity BE ──UserRegistered──► WebOnOne BE (future)
```

**Never:** shared database, token in URL, `postMessage` with `targetOrigin '*'`, or WebOnOne BE calling Identity BE on every request.

---

## Layer 1 — Iframe embedding

WebOnOne `/login` hosts Identity login UI:

```text
Parent: http://localhost:3000/login
Iframe: http://localhost:3001/login?parentOrigin=http://localhost:3000&returnPath=/
```

| Owner | Responsibility |
|-------|----------------|
| WebOnOne FE | `IdentityLoginFrame` — build iframe `src`, listen for messages |
| Identity FE | `LoginPage` embed mode — minimal layout when `parentOrigin` is set |
| Identity FE | `Content-Security-Policy: frame-ancestors` — allow WebOnOne origins only |

Identity **owns** login, register, and reset-password UI. WebOnOne **never** duplicates auth forms.

---

## Layer 2 — postMessage handoff

After successful `POST /api/v1/auth/login` inside the iframe, Identity FE sends:

```json
{
  "type": "webonone:auth:success",
  "accessToken": "<jwt>",
  "expiresIn": 900,
  "user": {
    "id": "V7xK9mN2pQw3rTy4uIoP0",
    "email": "user@example.com",
    "displayName": "Jane Doe"
  }
}
```

### Identity FE (send)

```typescript
window.parent.postMessage(payload, parentOrigin) // never '*'
```

- `parentOrigin` from URL query; validate against `VITE_ALLOWED_PARENT_ORIGINS`.
- Do not redirect `window.top` in embed mode.

### WebOnOne FE (receive)

```typescript
window.addEventListener('message', (event) => {
  if (event.origin !== VITE_IDENTITY_ORIGIN) return
  if (event.data?.type !== 'webonone:auth:success') return
  dispatch(loginSuccess({ accessToken: event.data.accessToken, user: event.data.user }))
  navigate(returnPath)
})
```

### What to pass

| Field | Include | Notes |
|-------|---------|-------|
| `accessToken` | Yes | For WebOnOne API calls |
| `user.id`, `email`, `displayName` | Yes | Welcome UI without extra round-trip |
| `refreshToken` | Optional | Prefer Identity-only storage or documented cross-origin policy |
| `password` | **Never** | Stays in Identity only |

### Optional cancel message

```json
{ "type": "webonone:auth:cancel" }
```

---

## Layer 3 — JWT between backends

WebOnOne BE **verifies** tokens Identity BE **signed**. No Identity HTTP call per request.

### JWT claims (access token)

```json
{
  "sub": "V7xK9mN2pQw3rTy4uIoP0",
  "email": "user@example.com",
  "iss": "webonone-identity",
  "aud": "webonone-api",
  "iat": 1718534400,
  "exp": 1718535300
}
```

### WebOnOne API request

```http
GET /api/v1/me HTTP/1.1
Host: localhost:4000
Authorization: Bearer <accessToken>
```

### WebOnOne auth middleware

1. Verify signature (`JWT_SECRET` or public key).
2. Validate `iss`, `aud`, `exp`.
3. Set `req.user = { id: sub, email }`.
4. **Do not** query `identity_db`.

### WebOnOne FE after handoff

- Store `accessToken` + `user` in Redux auth slice.
- `apiClient` attaches `Authorization: Bearer <token>` on every WebOnOne API call.
- Home page: `Welcome, {user.displayName}!` from Redux (from postMessage).

---

## Layer 4 — Events (async, not on login path)

Login must **not** synchronously call WebOnOne. After registration, Identity publishes:

```json
{
  "eventVersion": "1.0",
  "eventType": "UserRegistered",
  "eventId": "<nanoid>",
  "occurredAt": "2026-06-16T10:00:00.000Z",
  "payload": {
    "userId": "V7xK9mN2pQw3rTy4uIoP0",
    "email": "user@example.com",
    "displayName": "Jane Doe"
  }
}
```

WebOnOne consumer: idempotent handler, local denormalized copy only — no FK to Identity DB.

---

## End-to-end sequence

```text
1. User → WebOnOne /login
2. WebOnOne renders iframe → Identity /login?parentOrigin=...
3. User submits credentials in iframe
4. Identity FE → Identity BE POST /auth/login
5. Identity BE → identity_db verify, return JWT + user
6. Identity FE → postMessage(webonone:auth:success) → WebOnOne parent
7. WebOnOne FE stores token + user, navigates to /
8. HomePage shows "Welcome, {displayName}!"
9. WebOnOne FE → WebOnOne BE with Bearer JWT
10. WebOnOne BE verifies JWT locally → 200
```

---

## Security checklist

| # | Requirement | Owner |
|---|-------------|-------|
| 1 | `event.origin === IDENTITY_ORIGIN` on receive | WebOnOne FE |
| 2 | `postMessage(payload, parentOrigin)` not `'*'` | Identity FE |
| 3 | Allowlist `parentOrigin` before postMessage | Identity FE |
| 4 | `frame-ancestors` CSP | Identity FE |
| 5 | Short-lived access token | Identity BE |
| 6 | Verify `iss`, `aud`, `exp` on API | WebOnOne BE |
| 7 | Never JWT in URL query or hash | Both FEs |
| 8 | Never shared auth tables | Both BEs |

---

## Pattern for future microservices

Use the same layer model for any new service:

| Need | Mechanism |
|------|-----------|
| Embed another service's UI | iframe + query params + postMessage contract |
| User/session on API calls | JWT from Identity; verify in each service |
| Copy user or domain data | Versioned event + idempotent consumer + local table |
| Sync read at request time | Avoid; prefer JWT claims + local denormalized copy |
| Service-to-service write | Event first; sync API only when unavoidable |

Full platform rules: `microservice-architecture.mdc` — **Cross-service connection patterns**.

---

## Environment reference

```text
# Identity FE
VITE_ALLOWED_FRAME_ANCESTORS=http://localhost:3000
VITE_ALLOWED_PARENT_ORIGINS=http://localhost:3000

# WebOnOne FE
VITE_IDENTITY_ORIGIN=http://localhost:3001
VITE_IDENTITY_LOGIN_URL=http://localhost:3001/login

# WebOnOne BE + Identity BE (shared verify/sign contract)
JWT_SECRET=<dev-shared>   # or JWT_PRIVATE_KEY / JWT_PUBLIC_KEY pair
```

---

## Acceptance criteria

1. Login works via iframe; WebOnOne has no local login form.
2. postMessage delivers JWT + `user.displayName`; home shows welcome message.
3. WebOnOne BE accepts Bearer JWT without calling Identity BE per request.
4. Origin and message-type checks enforced on both sides.
5. No credentials or tokens in URLs; no cross-database queries.
