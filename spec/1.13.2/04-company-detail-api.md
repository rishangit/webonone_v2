# 04 — Company detail API

Company rows already exist in `webonone_v2.companies`. 1.13.2 adds **read full detail**, **update profile fields** (including partial card saves), **map/geo columns**, and **slim register** validation. Status lifecycle stays on existing admin status endpoints ([1.13.0/04](../1.13.0/04-multi-company-api.md)).

## Endpoints

### `GET /api/v1/company/:id`

| Item | Detail |
|------|--------|
| Auth | Identity JWT (`requireAuth`) |
| Authorization | Caller is a **member** of the company **or** **super admin** |
| 404 | Unknown id, or caller not authorized (prefer **404** when not member and not SA) |
| Response | Full company detail DTO (below) |

### `PATCH /api/v1/company/:id`

| Item | Detail |
|------|--------|
| Auth | Identity JWT (`requireAuth`) |
| Authorization | **Company Owner** (`company_admin`) **or** **super admin** |
| Body | Partial or full update of editable fields (card saves may send one group) |
| Forbidden | Role `member` only → 403/404; `status` in body → reject |
| Response | Updated full company detail DTO |

### `POST /api/v1/company/register` (updated)

| Item | Detail |
|------|--------|
| Required | `name` only |
| Optional | description, companySize, logoUrl, contact, address (if client still sends) |
| Not accepted / ignored | Map lat/lng / place (set only via PATCH on profile) |
| Unchanged | Always `pending`; registrant = `company_admin` |

See [05](./05-registration-and-progressive-details.md).

## Schema migration (map / geo)

Add nullable columns on `companies` (migration under `webonone-v2/backend/migrations`):

| Column | Type | Notes |
|--------|------|-------|
| `latitude` | DECIMAL(10,7) NULL | Map pin |
| `longitude` | DECIMAL(10,7) NULL | Map pin |
| `map_place_id` | VARCHAR(255) NULL | Optional Google Place id |
| `map_formatted_address` | VARCHAR(512) NULL | Optional Places formatted address |

Existing address columns remain; they may be null after slim registration.

## Detail DTO

```ts
type CompanyStatus = 'pending' | 'approved' | 'rejected'

type CompanyDetail = {
  id: string
  name: string
  description: string | null
  companySize: string | null
  logoUrl: string | null
  // Contact (often null after slim register)
  contactEmail: string | null
  contactPhone: string | null
  // Location address (often null after slim register)
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  stateRegion: string | null
  postalCode: string | null
  country: string | null
  // Map
  latitude: number | null
  longitude: number | null
  mapPlaceId: string | null
  mapFormattedAddress: string | null
  status: CompanyStatus
  createdByUserId: string
  createdAt: string
  updatedAt: string
  approvedAt: string | null
  role?: 'member' | 'company_admin'
}
```

## Update body (PATCH)

Partial updates are **allowed** so each profile card can save independently. Omit unchanged groups.

```ts
type UpdateCompanyBody = {
  // Company profile card
  name?: string
  description?: string | null
  companySize?: '1-10' | '11-50' | '51-200' | '201-500' | '500+' | null
  logoUrl?: string | null
  // Contact card
  contactEmail?: string | null
  contactPhone?: string | null
  // Location address
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  stateRegion?: string | null
  postalCode?: string | null
  country?: string | null
  // Map
  latitude?: number | null
  longitude?: number | null
  mapPlaceId?: string | null
  mapFormattedAddress?: string | null
}
```

| Rule | Detail |
|------|--------|
| Validation | Per provided field — same string limits as register; lat ∈ [-90,90], lng ∈ [-180,180] |
| Partial | Only supplied keys are written; omitted keys untouched |
| Clear field | Explicit `null` clears nullable columns where allowed |
| Status | Never accepted on this endpoint |
| `updated_at` | Bumped on successful update |
| Card completeness | When a card sends its group, frontend Zod may require that group’s fields before PATCH; backend still validates each present field |

## Auth resolution

```text
GET /company/:id
  ├─ super admin? → return detail
  ├─ Identity company role for (user, id)? → return detail + role
  └─ else → 404

PATCH /company/:id
  ├─ super admin? → update allowed
  ├─ company_admin for id? → update allowed
  ├─ member only? → 403/404
  └─ else → 404
```

## Repository

| Helper | Purpose |
|--------|---------|
| `findCompanyById` | Reuse |
| `updateCompanyProfile(id, patch)` | **New** — patch only provided editable columns; never `status` / approval columns |

## Frontend API

| Method | Call |
|--------|------|
| `getCompany(id)` | `GET /company/:id` |
| `updateCompany(id, body)` | `PATCH /company/:id` (per-card or full) |
| `registerCompany` | Slim body — name (+ optional basics) |

Env: `VITE_GOOGLE_MAPS_API_KEY` for map UI only (not sent to backend).

## Out of scope

- Changing status via detail PATCH
- Soft-delete company
- Public unauthenticated company pages
- Backend Google Places proxy

## Acceptance

1. Owner GET + PATCH (including partial contact-only or location-only).
2. Member GET-only; outsider 404.
3. Super admin GET + PATCH any company.
4. PATCH cannot change `status`.
5. Register succeeds with name only; contact/address/map null until profile PATCH.
6. Detail DTO returns map fields (null when unset).
