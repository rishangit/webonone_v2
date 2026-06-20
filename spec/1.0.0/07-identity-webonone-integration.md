# 07 — Identity ↔ WebOnOne Integration

Authoritative guide for connecting **Identity** and **WebOnOne v2** (and the pattern for all microservice links in this platform).

Related: [02-architecture.md](./02-architecture.md), [03-identity-project.md](./03-identity-project.md), [04-webonone-v2-project.md](./04-webonone-v2-project.md), `microservice-architecture.mdc`.

## Three connection layers

Every cross-service link uses the **right channel** for its layer. Do not mix them.

| Layer | Channel | Used for |
|-------|---------|----------|
| **1 — Browser redirect** | Full-page redirect + auth code | Send user to Identity login; return to consumer callback |
| **2 — Token exchange** | `POST /auth/exchange` | Trade short-lived code for JWT + profile (never JWT in URL) |
| **3 — Service trust** | JWT in `Authorization` header | Prove identity on each API request |
| **4 — Async sync** | Versioned events | Provision or update local copies after registration |

```text
Layer 1–2 (browser):  WebOnOne FE ──redirect──► Identity FE ──code──► WebOnOne /callback ──exchange──► Identity BE
Layer 3 (API):        WebOnOne FE ──Bearer JWT──► WebOnOne BE (verify locally)
Layer 4 (async):      Identity BE ──UserRegistered──► WebOnOne BE (future)
```

**Never:** shared database, JWT in URL query/hash, or WebOnOne BE calling Identity BE on every request.

### Shared frontend library

Cross-service redirect helpers live in **`@webonone/platform-nav`** (`packages/platform-nav/`):

- `redirectWithAuthCode()` — JWT holder requests auth code, redirects to target FE with `code` (+ optional `return_url`)
- `buildLoginRedirectUrl()` / `consumeOAuthState()` — Layer 1 login redirect
- `parseReturnUrl()` — validate `return_url` on the receiving page

See [packages/platform-nav/README.md](../../packages/platform-nav/README.md).

---

## Layer 1 — Redirect to Identity

WebOnOne sends unauthenticated users to Identity login:

```text
WebOnOne: http://localhost:3000/login  →  user clicks "Continue to sign in"
Identity: http://localhost:3001/login?redirect_uri=http://localhost:3000/callback&return_path=/&state=<nonce>
```

| Owner | Responsibility |
|-------|----------------|
| WebOnOne FE | Build login URL with `redirect_uri`, `return_path`, `state`; store `state` in `sessionStorage` |
| Identity FE | Validate `redirect_uri` against allowlist; preserve params across register/forgot links |
| Identity FE | Shared `AppHeader` from UI Kit (logo when logged out) |

Identity **owns** login, register, and reset-password UI. WebOnOne **never** duplicates auth forms.

---

## Layer 2 — Authorization code exchange

After successful login, Identity FE requests a one-time code and redirects:

```text
{callback_url}?code=<oneTimeCode>&state=<nonce>
```

WebOnOne `/callback` exchanges the code:

```http
POST /api/v1/auth/exchange HTTP/1.1
Host: localhost:4001
Content-Type: application/json

{ "code": "<oneTimeCode>", "redirectUri": "http://localhost:3000/callback" }
```

Response:

```json
{
  "accessToken": "<jwt>",
  "expiresIn": 900,
  "user": {
    "id": "V7xK9mN2pQw3rTy4uIoP0",
    "email": "user@example.com",
    "displayName": "Jane Doe",
    "avatarUrl": "https://..."
  }
}
```

### Identity BE endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth/code` | Bearer JWT → create one-time code (Identity FE after login) |
| POST | `/auth/exchange` | Public; `{ code, redirectUri }` → JWT + user |

Codes: 60s TTL, single-use, tied to `redirect_uri`. Stored in `auth_codes` table.

### WebOnOne FE after exchange

- Validate `state` against `sessionStorage`
- Store `accessToken` + `user` in Redux auth slice
- Navigate to `return_path` (default `/`)
- `apiClient` attaches `Authorization: Bearer <token>` on every WebOnOne API call

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

## Shared UI — AppHeader

Both services use `@webonone/ui-kit`:

- `AppHeader` — logo left, user avatar + logout menu right (when authenticated)
- `Avatar` — size variants (`sm` for header)
- `PageShell` — composes `AppHeader` + main content

---

## End-to-end sequence

```text
1. User → WebOnOne /
2. PrivateRoute → /login
3. User clicks sign in → redirect to Identity /login?redirect_uri=...&state=...
4. User submits credentials on Identity
5. Identity FE → Identity BE POST /auth/login
6. Identity FE → POST /auth/code (Bearer) → redirect to /callback?code=...&state=...
7. WebOnOne /callback → POST /auth/exchange → store token + user
8. Navigate to / (dashboard)
9. HomePage shows welcome + header avatar
10. WebOnOne FE → WebOnOne BE with Bearer JWT
11. WebOnOne BE verifies JWT locally → 200
```

---

## Security checklist

| # | Requirement | Owner |
|---|-------------|-------|
| 1 | `redirect_uri` allowlisted before code creation/exchange | Identity BE |
| 2 | `state` validated on callback | WebOnOne FE |
| 3 | Auth code single-use, 60s TTL | Identity BE |
| 4 | Short-lived access token | Identity BE |
| 5 | Verify `iss`, `aud`, `exp` on API | WebOnOne BE |
| 6 | Never JWT in URL query or hash | Both FEs |
| 7 | Never shared auth tables | Both BEs |

---

## Environment reference

```text
# Identity FE
VITE_ALLOWED_REDIRECT_URIS=http://localhost:3000/callback

# Identity BE
ALLOWED_REDIRECT_URIS=http://localhost:3000/callback

# WebOnOne FE
VITE_IDENTITY_ORIGIN=http://localhost:3001
VITE_IDENTITY_LOGIN_URL=http://localhost:3001/login
VITE_IDENTITY_API_BASE_URL=http://localhost:4001/api/v1
VITE_AUTH_CALLBACK_URL=http://localhost:3000/callback

# WebOnOne BE + Identity BE (shared verify/sign contract)
JWT_SECRET=<dev-shared>
```

---

## Acceptance criteria

1. Login works via redirect; WebOnOne has no local login form fields.
2. Callback exchanges code for JWT + `user.displayName`; home shows welcome message.
3. Shared header with avatar and logout on authenticated WebOnOne pages.
4. WebOnOne BE accepts Bearer JWT without calling Identity BE per request.
5. `state` and `redirect_uri` checks enforced; no credentials or tokens in URLs.
