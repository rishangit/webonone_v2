# 02 — Company profile page

WebOnOne owns the **Company profile** page. Follow the UI Kit **Details page** pattern (`DetailsPageDemo` — `FeaturePage` + view/edit) and Identity **Profile** view/edit, but present details in **three separate cards** (not one flat section list).

## Routes

| Actor | Route | Notes |
|-------|--------|--------|
| Member / owner | `/settings/companies/:companyId` | From All Companies |
| Super admin | `/companies/:companyId` | From Companies list |

Prefer **one page component** mounted on both routes (e.g. `CompanyProfilePage`). Resolve `companyId` from `useParams`.

## Page chrome

| Item | Value |
|------|--------|
| Layout | `FeaturePage` from `@webonone/ui-kit` |
| Title | Company name when loaded; fallback **Company profile** while loading |
| Description | Short copy, e.g. “Complete and update this company’s profile, contact, and location.” |
| Loading | `usePlatformLoading('Loading company…')` |
| Not found / forbidden | `Alert` destructive; no editable form |

### Header / back

- Back control: **Back to All Companies** / **Back to Companies** (or `navigate(-1)` when history exists).
- Page-level **Edit all** is optional. Preferred: **per-card Edit** so owners can finish one incomplete area at a time (see below).

Members who are not owners: **view only**. Super admin: **view** required; **edit** allowed (default for 1.13.2).

## Composition (mandatory) — three cards

```text
FeaturePage
  title / description / back
  Card 1 — Company profile
  Card 2 — Contact information
  Card 3 — Location information
    Google Map (pin / place)
    Address details
```

Use UI Kit **`Card`**, **`CardHeader`**, **`CardTitle`**, **`CardDescription`**, **`CardContent`**. Stack cards vertically with `FeaturePage` gap (`gap-6`). Do **not** merge all fields into a single card or a single undifferentiated form.

### Card 1 — Company profile

| Item | Detail |
|------|--------|
| Title | **Company profile** |
| Description | Identity of the company on the platform |
| View | Logo (or placeholder), name, description, company size, **StatusTag**, role meta |
| Edit | Name, description, company size; optional logo later |
| Empty | Show **—** / “Not set” for missing optional fields after slim registration |

Status is **display-only** on this card. SA changes status from `/companies` list.

### Card 2 — Contact information

| Item | Detail |
|------|--------|
| Title | **Contact information** |
| Description | How customers and the platform reach this company |
| View | Contact email, contact phone (em dash when null) |
| Edit | Contact email, contact phone (`PhoneInput` / email `Input`) |
| Incomplete | After slim registration these are often empty — card should make “Add contact” / **Edit** obvious |

### Card 3 — Location information

| Item | Detail |
|------|--------|
| Title | **Location information** |
| Description | Map pin and postal / street address |
| Map | **Google Map** showing the company location when coordinates / place are set; placeholder / “Set location on map” when unset |
| Address | Address line 1, address line 2, city, state/region, postal code, country |
| Edit | Map place picker (search / click pin) **and** address fields; picking a place should prefer-fill address fields when Google returns structured address |
| Incomplete | Map + address typically filled on this page, not at first registration |

#### Google Map behavior

| Mode | Behavior |
|------|----------|
| View | Embed or static map centered on stored `latitude` / `longitude` (or place id). If unset, muted empty state |
| Edit | Interactive map + Places search (or map click) to set pin; persist lat/lng (+ optional `mapPlaceId`, formatted address) |
| API key | Frontend `VITE_GOOGLE_MAPS_API_KEY` in `webonone-v2/frontend/.env` (document in `.env.example`) — browser key only; never put Maps secret keys in backend env unless a server proxy is introduced later |
| Fallback | If Maps key missing in local/dev, show address fields only + Callout that map requires configuration — do not crash the page |

## View vs edit (per card)

| Pattern | Detail |
|---------|--------|
| Default | Each card in **view** mode |
| Edit | Card header action **Edit** → card body becomes form fields; **Cancel** / **Save** on that card |
| Save | Validate that card’s schema → `PATCH` with that card’s fields (partial update allowed — see [04](./04-company-detail-api.md)) → back to view |
| Cancel | Discard draft for that card only |
| Page-level edit | Allowed as alternative if implementation prefers one form wrapping all three cards; still **must** render three distinct cards |

Per-card edit is preferred for progressive completion after slim registration.

## Field ownership vs registration

Registration may collect only a **minimal** company profile (see [05](./05-registration-and-progressive-details.md)). Contact and location (including map) are **completed on this page**. Profile page must:

1. Render all three cards even when contact/location are empty.
2. Allow owners to fill missing fields without re-running the register wizard.
3. Treat null/empty values as normal incomplete state, not errors on view.

## Validation (edit)

| Card | Required when saving that card |
|------|--------------------------------|
| Company profile | Name required; description / size required once the owner saves this card (or keep description/size optional until product requires them — default: name required; description + size required on profile save) |
| Contact | Email + phone required when saving the contact card |
| Location | Country + address line 1 + city required when saving location; map lat/lng **strongly recommended** — require map pin when saving location if Places is available |

Use form-creation skill + Zod; map Zod issues to `FormField` errors.

## Components / files (suggested)

| Path | Role |
|------|------|
| `…/companies/pages/CompanyProfilePage.tsx` | Route page — load, FeaturePage, three cards |
| `…/companies/components/CompanyProfileCard.tsx` | Card 1 |
| `…/companies/components/CompanyContactCard.tsx` | Card 2 |
| `…/companies/components/CompanyLocationCard.tsx` | Card 3 (map + address) |
| `…/companies/components/CompanyMapPicker.tsx` | Google Map view/edit helper |
| `…/basic/schemas/companySchemas.ts` | Per-card + update schemas |
| `…/basic/services/companyApi.ts` | `getCompany`, `updateCompany` |
| Store | Detail load / save (partial PATCH support) |

## Accessibility / UX

- Empty contact/location: clear CTA copy (“Add contact information”, “Set location”).
- Disable Save while request in flight.
- After save, that card returns to view with new values.

## Acceptance

1. Profile shows **three** cards: Company profile, Contact information, Location information.
2. Location card includes Google Map (when configured) plus address fields.
3. Incomplete post-registration companies show empty contact/location without breaking the page.
4. Owner can edit and save each card; Cancel discards that card’s draft.
5. `StatusTag` on Company profile card; status not editable here.
6. Unauthorized / unknown id → error state.
7. Type-check green for webonone-v2.
