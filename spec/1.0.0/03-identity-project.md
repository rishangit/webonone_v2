# 03 — Identity Project

Standalone project: **frontend + backend + database**. Must run without WebOnOne v2.

## Responsibilities

- **Register** new users.
- **Login** and issue JWT.
- **Reset password** (forgot-password request + set new password).
- Own MySQL database `identity_db`.
- Auth UI for **standalone** use and **embed mode** (iframe from WebOnOne) — **one route per screen**, no duplicate `/embed/*` routes.

## Folder layout

```text
identity/
  frontend/                 # React SPA — port 3001
    src/
      app/
      features/
        auth/
          pages/LoginPage.tsx
          pages/RegisterPage.tsx
          pages/ForgotPasswordPage.tsx
          pages/ResetPasswordPage.tsx
          components/LoginForm.tsx
          components/RegisterForm.tsx
          components/ForgotPasswordForm.tsx
          components/ResetPasswordForm.tsx
          hooks/useEmbedMode.ts       # reads parentOrigin, returnPath from query
          utils/embedQuery.ts         # build/preserve embed query on links
          services/authApi.ts
          store/
          schemas/
      main.tsx
  backend/
    src/
      routes/
      controllers/
      services/
      models/
      middleware/
      app.ts
      server.ts
    migrations/
  package.json
```

Each auth **page** is a single file. Embed behavior is a **mode** inside that page, not a separate route or page file.

## Embed mode (single route)

When `parentOrigin` is present in the URL query string, the page runs in **embed mode**:

| Signal | Meaning |
|--------|---------|
| `parentOrigin` query param present | Embed mode — minimal layout, `postMessage` on success |
| `parentOrigin` absent | Standalone mode — full layout, normal in-app redirect |

**Example URLs**

```text
Standalone:  http://localhost:3001/login
Embedded:    http://localhost:3001/login?parentOrigin=http://localhost:3000&returnPath=/
```

Same pattern for `/register`, `/forgot-password`, `/reset-password` (preserve `parentOrigin` on links when embedded).

### LoginPage structure

```text
LoginPage.tsx
  ├── useEmbedMode()           → { isEmbed, parentOrigin, returnPath }
  ├── AuthLayout variant       → minimal (embed) | full (standalone)
  ├── LoginForm                → shared form + API call
  └── onSuccess:
        ├── embed    → postMessage to parentOrigin
        └── standalone → navigate('/') inside Identity
```

Register, forgot-password, and reset-password pages follow the same pattern with their shared form components.

## User flows

### Register

```text
User fills form (email, password, firstName, lastName)
  → POST /api/v1/auth/register
  → User created in identity_db
  → Redirect to /login (preserve parentOrigin + returnPath query if embedded)
```

### Google Sign-In

```text
User clicks Sign in with Google
  → Google returns idToken to Identity FE
  → POST /api/v1/auth/google { idToken }
  → User created or linked by google_sub / email
  → Same JWT + profile response as password login
```

### Login

```text
User fills form (email, password)
  → POST /api/v1/auth/login
  → Returns accessToken, refreshToken, user profile
  → Standalone: redirect inside Identity
  → Embed: postMessage to WebOnOne parent (see below)
```

### Reset password

**Step 1 — Request reset**

```text
POST /api/v1/auth/forgot-password
  → 200 always (do not reveal if email exists)
```

**Step 2 — Set new password**

```text
User opens /reset-password?token=... (& parentOrigin if embedded)
  → POST /api/v1/auth/reset-password { token, newPassword }
  → Redirect to /login (preserve embed query if present)
```

## Database (`identity_db`)

| Table | Purpose |
|-------|---------|
| `users` | Credentials + profile (`id` CHAR(21) nanoid) |
| `refresh_tokens` | Hashed refresh tokens |
| `password_reset_tokens` | Hashed token, `user_id`, `expires_at`, `used_at` |

### `users` profile columns

| Column | Notes |
|--------|-------|
| `email`, `password_hash` (nullable for Google-only), `google_sub` (nullable unique) | Auth |
| `first_name`, `last_name`, `display_name` | Name (Google: `given_name`, `family_name`, `name`) |
| `is_email_verified`, `avatar_url`, `locale` | Google profile |
| `phone_number`, `address_line_1`, `address_line_2`, `city`, `state_region`, `postal_code`, `country` | Optional profile (PATCH `/auth/me`) |

## Backend API (`/api/v1`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | No | Create user (`firstName`, `lastName`, `email`, `password`) |
| `POST` | `/auth/login` | No | Issue JWT + user profile |
| `POST` | `/auth/google` | No | Google Sign-In via `idToken` |
| `POST` | `/auth/forgot-password` | No | Request password reset |
| `POST` | `/auth/reset-password` | No | Set new password with token |
| `POST` | `/auth/refresh` | No | Refresh access token |
| `POST` | `/auth/logout` | No | Revoke refresh token |
| `GET` | `/auth/me` | Bearer | Current user (full profile) |
| `PATCH` | `/auth/me` | Bearer | Update optional profile fields |
| `GET` | `/health` | No | Health check |

### `POST /auth/login` response

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<opaque>",
  "expiresIn": 900,
  "user": {
    "id": "V7xK9mN2pQw3rTy4uIoP0",
    "email": "user@example.com",
    "displayName": "Jane Doe"
  }
}
```

## Frontend routes (one route per screen)

| Path | Page | Standalone | Embed (with `parentOrigin`) |
|------|------|------------|------------------------------|
| `/login` | LoginPage | Full layout, redirect on success | Minimal layout, `postMessage` on success |
| `/register` | RegisterPage | Full layout | Minimal layout, links preserve query |
| `/forgot-password` | ForgotPasswordPage | Full layout | Minimal layout |
| `/reset-password` | ResetPasswordPage | Full layout | Minimal layout |

### Embed query params

| Param | Required in embed | Description |
|-------|-------------------|-------------|
| `parentOrigin` | Yes | WebOnOne origin for `postMessage` target |
| `returnPath` | No | Path parent navigates to after login (default `/`) |

Helper `embedQuery.ts` builds links that preserve params:

```text
/register?parentOrigin=http://localhost:3000&returnPath=/
/forgot-password?parentOrigin=http://localhost:3000&returnPath=/
```

### Embed login → WebOnOne success

When user logs in via `/login?parentOrigin=...` inside WebOnOne iframe:

1. Identity API returns JWT + user profile.
2. `LoginPage` sends `postMessage` to `parentOrigin`:

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

3. WebOnOne parent stores token + user, navigates to `returnPath` (home).
4. WebOnOne home shows **welcome message** using `displayName` (see [04-webonone-v2-project.md](./04-webonone-v2-project.md) and [07-identity-webonone-integration.md](./07-identity-webonone-integration.md)).

In embed mode, pages **must not** redirect the top window — only `postMessage` the parent (login) or navigate inside the iframe (register → login with same query).

## UI dependency

```tsx
import { Button, Input, Form, AuthLayout } from '@webonone/ui-kit'
```

All auth forms use UI Kit only.

## Environment

| Variable | Where | Example |
|----------|-------|---------|
| `DATABASE_URL` | backend | `mysql://.../identity_db` |
| `JWT_SECRET` | backend | dev secret |
| `PASSWORD_RESET_EXPIRY` | backend | `1h` |
| `PORT` | backend | `4001` |
| `VITE_API_BASE_URL` | frontend | `http://localhost:4001/api/v1` |
| `VITE_ALLOWED_FRAME_ANCESTORS` | frontend | `http://localhost:3000` |

## Standalone run

```bash
cd identity
npm run dev
```

Must serve:

- `http://localhost:3001/login`, `/register`, `/forgot-password`
- `http://localhost:3001/login?parentOrigin=...` (embed mode for WebOnOne iframe)
- `http://localhost:4001/api/v1/health`

## Acceptance criteria

1. User can **register**, **login**, and **reset password** via Identity UI alone (standalone mode).
2. Same `/login` route works in WebOnOne iframe when `parentOrigin` is set — minimal layout, no duplicate page files.
3. Successful embed login sends `postMessage` with JWT and `user.displayName`.
4. WebOnOne loads home with welcome message after embed login success.
5. Register / forgot-password links preserve embed query params inside iframe.
6. All base UI from `@webonone/ui-kit`.
