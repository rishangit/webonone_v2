# 03 — WebOnOne Company UI

WebOnOne v2 is the **consumer** for company registration and the company detail section. Identity remains the auth issuer; Company service owns business data.

## Navigation

Add under **Settings** group in `navItems.ts`:

| Route | Label |
|-------|-------|
| `/settings/basic` | Basic Settings |

Place **Basic Settings** before or after System Theme per existing group order.

## Basic Settings page

**Path:** `webonone-v2/frontend/src/features/settings/basic/pages/BasicSettingsPage.tsx`

### State A — No company (prompt)

When `GET /me/company` (via WebOnOne BFF or direct Company API with JWT) returns 404:

- Show informational banner: user has not registered a company.
- Primary action: **Register Company** → opens dialog.

### State B — Pending company

- Show company name, logo thumbnail, status badge **Pending**.
- Message: admin approval is required before management features unlock.
- No edit actions beyond optional cancel (out of scope).

### State C — Approved company

- Show company name, logo, status **Approved**, user's role (**Company Admin** or **Member**).
- Company admins: future edit affordances; 1.6.0 minimum is read-only details + role display.

## Register Company dialog

**Component:** `RegisterCompanyDialog.tsx`

| Field | Control | Validation |
|-------|---------|------------|
| Company name | `Input` | Required, max 255 |
| Logo | Media upload embed trigger | Required — user must upload before submit |

### Logo upload flow

Use **`@webonone/media-embed`** upload embed (see [1.4.0 upload iframe](../1.4.0/02-media-iframe-components.md)):

- `scope`: `webonone:company:pending:{userId}` for pre-registration upload, or create company first with placeholder then update logo — **preferred:** upload first, pass `logoUrl` on `POST /companies`.
- `mediaType`: `image`
- `crop`: optional `true` with `cropAspectPresets=1:1` for square logo
- JWT via `sendMediaInit` postMessage pattern from [08-media-consumer-integration](../1.4.0/08-media-consumer-integration.md)

On upload complete, store pending `logoUrl` in dialog state; include in register payload.

### Submit

1. `POST` Company API `/companies` with `{ name, logoUrl }` (proxied through WebOnOne backend or direct with JWT — prefer **WebOnOne backend proxy** to keep API base single-origin in prod).
2. Close dialog; refresh company state.
3. Toast: registration submitted; approval required.

## WebOnOne backend proxy (recommended)

Add routes under `webonone-v2/backend`:

| Method | Path | Action |
|--------|------|--------|
| `GET` | `/api/v1/company/me` | Forward to Company `GET /me/company` with verified JWT |
| `POST` | `/api/v1/company/register` | Forward to Company `POST /companies` |

Env (`backend/.env.example`):

| Variable | Purpose |
|----------|---------|
| `COMPANY_API_BASE_URL` | `http://localhost:4004/api/v1` |

Frontend env (`frontend/.env.example`):

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Own API (proxy paths above) |
| `VITE_MEDIA_ORIGIN` | Media embed for logo |
| `VITE_MEDIA_API_BASE_URL` | Media API if needed for init |

Derive Media embed URLs in `features/media/utils/mediaConfig.ts` (mirror Identity/WebOnOne patterns).

## Auth slice extension

Store optional `company` summary on auth or dedicated `companySlice`:

```typescript
type CompanySummary = {
  id: string
  name: string
  logoUrl: string | null
  status: 'pending' | 'approved'
  role: 'member' | 'company_admin'
}
```

Refresh on Basic Settings mount and after registration.

## UI Kit

- `Dialog`, `FormField`, `Button`, `Input`, `Badge` from `@webonone/ui-kit`
- Form validation: Zod frontend + matching backend (see form-creation skill)

## Acceptance mapping (subtask 86ey2p61f)

| Criterion | Implementation |
|-----------|----------------|
| Prompt on Basic Settings if no company | State A banner |
| Register Company button → dialog | Dialog with name + logo |
| Pending status + notification | State B + toast on submit |
| Return to company section | Basic Settings States B/C |
| Role visible after approval | Show `company_admin` badge |
