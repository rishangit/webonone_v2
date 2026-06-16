# 04 — WebOnOne v2 Project

Standalone project: **frontend + backend + database**. Runs independently while Identity is also running (required for `/login` iframe).

## 1.0.0 status: empty project

WebOnOne v2 is a **scaffold only** — no product domain yet.

| Layer | 1.0.0 content |
|-------|----------------|
| Frontend | Router, placeholder home, `/login` iframe host |
| Backend | Health endpoint, JWT auth middleware |
| Database | Empty (`webonone_db`) or initial migration stub — **no business tables** |

Future specs will add sites, pages, and related APIs.

## Folder layout

```text
webonone-v2/
  frontend/                 # React SPA — port 3000
    src/
      app/
        router.tsx
        store/
      features/
        auth/
          pages/LoginPage.tsx           # iframe host only — no local login form
          components/IdentityLoginFrame.tsx
          hooks/useIdentityAuthMessage.ts
        home/
          pages/HomePage.tsx            # welcome message after login
      shared/
        services/apiClient.ts
      main.tsx
  backend/                  # Express API — port 4000
    src/
      middleware/auth.ts      # verify Identity JWT
      routes/health.ts
      app.ts
      server.ts
    migrations/               # stub only in 1.0.0
  package.json
```

## `/login` — iframe integration

WebOnOne **does not** implement login forms. `/login` loads Identity’s **`/login`** route in embed mode (query params).

### LoginPage

```tsx
// Conceptual — IdentityLoginFrame builds iframe src from env + query
function LoginPage() {
  return (
    <PageShell>
      <IdentityLoginFrame
        loginUrl={import.meta.env.VITE_IDENTITY_LOGIN_URL}
        parentOrigin={window.location.origin}
        returnPath="/"
      />
    </PageShell>
  )
}
```

`IdentityLoginFrame` builds iframe src:

```text
{loginUrl}?parentOrigin={parentOrigin}&returnPath={returnPath}
```

Example: `http://localhost:3001/login?parentOrigin=http://localhost:3000&returnPath=/`

### IdentityLoginFrame

- Renders `<iframe title="Sign in" src={loginUrl + embedQuery} />`.
- Full width/height appropriate for auth card; no duplicate auth UI beside iframe.
- Registers `useIdentityAuthMessage` listener.

### useIdentityAuthMessage

- Listen for `message` events.
- Verify `event.origin === VITE_IDENTITY_ORIGIN`.
- On `webonone:auth:success`: store `accessToken` and `user` (Redux auth slice), navigate to `returnPath` (default `/`).
- On `webonone:auth:cancel`: optional redirect or message.

### HomePage — welcome after login

After successful iframe login, user lands on `/` with a welcome message:

```tsx
// Uses user from auth slice (set by postMessage)
function HomePage() {
  const user = useAppSelector((s) => s.auth.user)
  return (
    <PageShell>
      <h1>Welcome, {user?.displayName ?? 'User'}!</h1>
      <p>You are signed in to WebOnOne.</p>
    </PageShell>
  )
}
```

- Message uses `displayName` from Identity `postMessage` payload.
- If no token/user, redirect to `/login`.

See [02-architecture.md](./02-architecture.md) and [07-identity-webonone-integration.md](./07-identity-webonone-integration.md) for full postMessage contract.

## Backend (`/api/v1`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Health check |
| `GET` | `/me` | Bearer | Example protected route (optional stub) |

JWT verified against Identity-issued tokens. No password endpoints.

## Database (`webonone_db`)

1.0.0: database exists for project wiring; **no domain schema**. Migrations folder may contain a single stub migration.

## UI dependency

```tsx
import { PageShell } from '@webonone/ui-kit'
```

Shell and layout from UI Kit; **no** local Button/Input. Login UI lives entirely inside Identity iframe.

## Environment

| Variable | Where | Example |
|----------|-------|---------|
| `DATABASE_URL` | backend | `mysql://.../webonone_db` |
| `JWT_SECRET` or `JWT_PUBLIC_KEY` | backend | same as Identity (verify only) |
| `PORT` | backend | `4000` |
| `VITE_API_BASE_URL` | frontend | `http://localhost:4000/api/v1` |
| `VITE_IDENTITY_ORIGIN` | frontend | `http://localhost:3001` |
| `VITE_IDENTITY_LOGIN_URL` | frontend | `http://localhost:3001/login` |

## Frontend routes (1.0.0)

| Path | Page | Auth |
|------|------|------|
| `/login` | LoginPage (iframe) | Public |
| `/` | HomePage (placeholder) | Private (redirect to `/login` if no token) |

## Standalone run

```bash
cd webonone-v2
npm run dev
```

With Identity also running:

1. Open `http://localhost:3000/login`
2. Iframe loads Identity `/login?parentOrigin=...`
3. After login, WebOnOne receives token + user profile and navigates to `/`
4. Home page shows **Welcome, {displayName}!**

## Acceptance criteria

1. WebOnOne runs without importing Identity source code (URL + postMessage only).
2. `/login` shows Identity login via iframe, not a local form.
3. Token and user profile from iframe are stored and sent on WebOnOne API calls.
4. Home page shows welcome message with the logged-in user's `displayName`.
5. No sites/pages domain features yet.
6. Base layout components from `@webonone/ui-kit`.
