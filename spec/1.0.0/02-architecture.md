# 02 — Architecture

## Topology

Each project is **self-contained**. No shared gateway. Cross-origin integration only where required (iframe login).

```text
┌─────────────────────────────────────────────────────────────────┐
│  identity/                    (standalone)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ identity-fe  │  │ identity-be  │  │ identity_db  │           │
│  │ :3001        │  │ :4001        │  │ (MySQL)      │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│  Routes: /login, /register, /forgot-password (embed via query)   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  webonone-v2/                 (standalone)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ webonone-fe  │  │ webonone-be  │  │ webonone_db  │           │
│  │ :3000        │  │ :4000        │  │ (MySQL)      │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│  /login → iframe → Identity /login?parentOrigin=...              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ui-kit/                      (standalone)                       │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │ showcase app │  │ @webonone/   │  ← consumed by both FEs     │
│  │ :3002        │  │ ui-kit pkg   │                             │
│  └──────────────┘  └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

## Design principles

| Principle | Application |
|-----------|-------------|
| One DB per project | `identity_db` and `webonone_db` never shared |
| Standalone dev | Each folder has own `package.json`, env, migrations |
| Auth UI owned by Identity | WebOnOne does not implement login forms |
| UI from UI Kit only | No duplicate primitives in Identity or WebOnOne |
| JWT across projects | Identity issues; WebOnOne backend verifies |

## Iframe login flow

WebOnOne v2 `/login` does **not** render a local login form. It hosts Identity’s **`/login`** route in **embed mode** (via query params).

```text
1. User opens http://localhost:3000/login
2. WebOnOne renders <LoginFrame /> with iframe src:
     http://localhost:3001/login
       ?parentOrigin=http://localhost:3000
       &returnPath=/
3. Identity LoginPage detects parentOrigin → embed mode (minimal layout)
4. User submits credentials inside iframe (shared LoginForm + UI Kit)
5. Identity API issues JWT
6. LoginPage posts message to parent:
     window.parent.postMessage({ type: 'webonone:auth:success', accessToken, user, ... }, parentOrigin)
7. WebOnOne parent validates origin + message type, stores token + user profile
8. WebOnOne navigates to returnPath (/) and HomePage shows welcome message with user.displayName
```

### Iframe URL contract

WebOnOne builds the iframe `src` from `VITE_IDENTITY_LOGIN_URL` plus query params:

| Query param | Required | Description |
|-------------|----------|-------------|
| `parentOrigin` | Yes | WebOnOne origin — enables embed mode and `postMessage` target |
| `returnPath` | No | Path after login (default `/`) |

Identity route: **`GET /login`** (same route as standalone; embed mode when `parentOrigin` is set).

### postMessage contract

**Success** (Identity → WebOnOne parent):

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

**Cancel** (optional):

```json
{
  "type": "webonone:auth:cancel"
}
```

WebOnOne parent **must**:

- Listen with `window.addEventListener('message', ...)`.
- Accept messages only if `event.origin === IDENTITY_ORIGIN`.
- Accept only `event.data.type` values from the contract above.

Identity auth pages in embed mode **must**:

- Detect embed mode when `parentOrigin` query param is present.
- Use minimal `AuthLayout` (no full app chrome) suitable for iframe.
- Reuse the same `LoginForm` / shared form components as standalone mode.
- Send `postMessage` only to `parentOrigin` from query string on login success.

### Security (iframe)

| Control | Owner |
|---------|-------|
| `Content-Security-Policy: frame-ancestors` | Identity FE — allow WebOnOne origin(s) from env |
| `parentOrigin` validation | Identity LoginPage in embed mode — validate allowed origins |
| `event.origin` check | WebOnOne parent — reject non-Identity messages |
| JWT verification | WebOnOne BE — verify Identity-issued token |

Env examples:

```text
# identity-fe
VITE_ALLOWED_FRAME_ANCESTORS=http://localhost:3000

# webonone-fe
VITE_IDENTITY_ORIGIN=http://localhost:3001
VITE_IDENTITY_LOGIN_URL=http://localhost:3001/login
```

## JWT between projects

- Identity backend signs JWT (`sub`, `email`, `iss: webonone-identity`).
- WebOnOne backend verifies with shared `JWT_PUBLIC_KEY` or `JWT_SECRET` (dev).
- WebOnOne frontend stores token (memory or sessionStorage) after iframe success.
- WebOnOne API calls attach `Authorization: Bearer <token>`.

## What WebOnOne v2 contains (1.0.0)

**Empty project** — scaffold only:

- Frontend: router, empty home/dashboard placeholder, `/login` iframe host.
- Backend: health check, JWT auth middleware, no domain tables yet.
- Database: empty or migration stub only.

Domain features (sites, pages, etc.) are **not** part of 1.0.0.

## Repo layout

```text
PROJECTS/2026/
├── spec/1.0.0/
├── identity/
│   ├── frontend/
│   ├── backend/
│   └── package.json          # optional workspace root for identity
├── webonone-v2/
│   ├── frontend/
│   ├── backend/
│   └── package.json
├── ui-kit/
│   ├── package/                # @webonone/ui-kit
│   ├── showcase/               # standalone showcase app
│   └── package.json
└── .cursor/rules/
```

## Running locally

| Project | Command (example) | URLs |
|---------|-------------------|------|
| Identity | `cd identity && npm run dev` | FE `:3001`, BE `:4001` |
| WebOnOne v2 | `cd webonone-v2 && npm run dev` | FE `:3000`, BE `:4000` |
| UI Kit | `cd ui-kit && npm run dev` | Showcase `:3002` |

WebOnOne login flow requires **Identity FE running**; iframe loads `/login?parentOrigin=...`.

**Full integration guide:** [07-identity-webonone-integration.md](./07-identity-webonone-integration.md).
