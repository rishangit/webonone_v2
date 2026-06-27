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

- Show company name, logo thumbnail (if `logo_url` set), status badge **Pending**.
- Message: admin approval is required before management features unlock.
- No edit actions beyond optional cancel (out of scope).

### State C — Approved company

- Show company name, logo (if set), status **Approved**, user's role (**Company Admin** or **Member**).
- Company admins: read-only details + role display in 1.6.0; name/logo edit deferred.

## Register Company wizard

**Component:** `RegisterCompanyDialog.tsx` (orchestrator) + one step component per slide under `components/register-wizard/`.

Replace the single-step form with a **3-step wizard** inside `CustomDialog` (`sizeWidth="large"`, `sizeHeight="xlarge"` per [dialog-windows.mdc](../../.cursor/rules/dialog-windows.mdc)). Footer: **Cancel**, **Previous**, **Next** / **Submit registration** on final step. Single progress bar (`w-1/2 mx-auto`) — no duplicate numeric stepper.

### Step 1 — Company basics

| Field | Control | Validation |
|-------|---------|------------|
| Company name | `Input` | Required, max 255 |
| Company description | `Textarea` | Required, max 2000 |
| Company size | `Select` | Required — options: `1-10`, `11-50`, `51-200`, `201-500`, `500+` |

Validate step 1 on **Next**. Logo upload was removed from registration (subtask 86ey2punp); `logoUrl` is optional on register API.

### Step 2 — Location and contact

| Field | Control | Validation |
|-------|---------|------------|
| Address line 1 | `Input` | Required, max 255 |
| Address line 2 | `Input` | Optional, max 255 |
| City | `Input` | Required, max 128 |
| State / region | `Input` | Optional, max 128 |
| Postal code | `Input` | Optional, max 32 |
| Country | `CountrySelect` (UI Kit — searchable list, same pattern as phone country selector) | Required |
| Contact email | `Input` | Required, valid email |
| Contact phone | `PhoneInput` with country selector | Required |

Validate step 2 on **Next**.

### Step 3 — Summary and welcome

- Read-only summary of all entered fields (no logo).
- Short welcome message explaining pending approval.
- **Submit registration** in footer (primary action with `Save` icon).

### Wizard footer navigation (subtask 86ey2punp)

- **Previous** / **Next:** labeled footer buttons (`Previous` with leading `ChevronLeft`; `Next` with trailing `ChevronRight`). Use default button size (`h-10 px-4`), not `size="icon"`.
- **Select** / **Popover** overlays inside `CustomDialog` must render above the dialog shell (`z-[110]` in UI Kit).

### Submit

1. `POST` Company API `/companies` with full wizard payload (proxied through WebOnOne backend).
2. Close dialog; refresh company state.
3. Toast: registration submitted; approval required.

## Register Company dialog (legacy note)

The original single-step dialog (name + logo only) is **superseded** by the wizard above (subtask 86ey2pmp2). Keep the same `RegisterCompanyDialog` export; internal implementation is wizard-only.

## WebOnOne backend API

Company routes are **native** to WebOnOne backend under `webonone-v2/backend`:

| Method | Path | Action |
|--------|------|--------|
| `GET` | `/api/v1/company/me` | Current user's company + membership |
| `POST` | `/api/v1/company/register` | Register company (Identity JWT) |

Frontend env (`frontend/.env.example`):

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Own API (paths above) |

`VITE_MEDIA_ORIGIN` / `VITE_MEDIA_API_BASE_URL` — **deferred** (post-approval logo edit via Media embed; not used in 1.6.0 registration).

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

- `Dialog`, `FormField`, `Button`, `Input`, `Badge`, `CountrySelect`, `PhoneInput` from `@webonone/ui-kit`
- Form validation: Zod frontend + matching backend (see form-creation skill)

## Acceptance mapping (subtask 86ey2p61f)

| Criterion | Implementation |
|-----------|----------------|
| Prompt on Basic Settings if no company | State A banner |
| Register Company button → dialog | 3-step wizard with name, description, size, location, contact |
| Pending status + notification | State B + toast on submit |
| Return to company section | Basic Settings States B/C |
| Role visible after approval | Show `company_admin` badge |
