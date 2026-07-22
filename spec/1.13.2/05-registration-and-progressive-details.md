# 05 — Registration vs progressive company details

First registration on WebOnOne **does not need to collect every company field**. Owners complete the remaining details on the **Company profile** page ([02](./02-company-profile-page.md)).

## Principle

```text
Register (minimal)  ──►  company row + pending status + Company Owner
                              │
                              ▼
                    Company profile page
                      ├─ Company profile card (extend basics)
                      ├─ Contact information card
                      └─ Location information card (+ Google Map)
```

| Stage | Purpose |
|-------|---------|
| **Register** | Create the company quickly so it exists for approval / All Companies |
| **Company profile** | Capture full profile, contact, and map/address over time |

## Minimal registration (1.13.2)

Align the register wizard / `POST /company/register` so **only company identity is required** at create time.

| Field | At register | On profile page |
|-------|-------------|-----------------|
| Name | **Required** | Editable (Company profile card) |
| Description | Optional (recommended) | Editable |
| Company size | Optional | Editable |
| Logo | Optional / deferred | Deferred / optional |
| Contact email | **Not required** (omit step or optional) | **Contact card** — complete here |
| Contact phone | **Not required** | **Contact card** |
| Address lines / city / region / postal / country | **Not required** | **Location card** |
| Google Map lat/lng / place | **Not collected** | **Location card** |

### Wizard UX (update from 1.6.0 / 1.13.0)

| Before | After (1.13.2) |
|--------|----------------|
| Step 1 basics + Step 2 location & contact (many required) | Prefer **one short step**: name (+ optional description / size), then summary / submit |
| Full address + contact required before submit | Contact + location collected on Company profile |

If a multi-step wizard is kept temporarily, contact and location steps must be **optional** (skippable) — do not block registration on those fields.

### API register body

| Rule | Detail |
|------|--------|
| Required | `name` only (trim, max 255) |
| Optional | `description`, `companySize`, `logoUrl`, contact + address fields if client still sends them |
| Always | `status = pending`; registrant = Company Owner (`company_admin`) |
| Map fields | Not part of register; null until set on profile |

Backend Zod for register must relax former required contact/address rules so slim submit succeeds. Existing companies with full data remain valid.

## Profile page fills the gaps

After register, All Companies shows the row (name + Pending). Owner opens the company → profile:

1. **Company profile** — confirm / finish name, description, size.
2. **Contact information** — add email and phone.
3. **Location information** — set Google Map pin and address.

Empty cards are expected until the owner saves them. Super admin can view incompleteness and still Approve/Reject from the list.

## Completeness (optional UX)

Not required for v1, but allowed:

- Soft “profile incomplete” Callout on the profile page when contact or location is missing.
- No hard gate blocking Login or approval solely because contact/map is empty (unless product later adds a policy).

## Acceptance

1. User can register with name (and optional basics) without contact or address.
2. New company appears on All Companies as Pending / Company Owner.
3. Owner opens profile and can add contact + location (+ map) later.
4. Register API rejects only when `name` is missing/invalid — not when contact/location omitted.
5. Companies registered under the old full wizard still load and edit on the profile page.
