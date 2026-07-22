# 07 — Implementation Plan

Phased delivery for **1.13.2** on branch **`spec/1.13.2`**.

---

## Branch workflow

```bash
git checkout master   # or merge base that includes 1.13.0 / 1.13.1 company work
git pull
git checkout -b spec/1.13.2
```

| Rule | Detail |
|------|--------|
| Base | Branch that includes All Companies list + SA Companies list |
| Spec branch | `spec/1.13.2` |
| Scope | `webonone-v2/backend`, `webonone-v2/frontend` |
| UI Kit | `FeaturePage` + `Card` — no new kit primitive required |
| Env | `VITE_GOOGLE_MAPS_API_KEY` in frontend `.env.example` |

---

## Phase 0 — Spec (this folder)

- [x] `spec/1.13.2/*` documentation
- [ ] Branch `spec/1.13.2`
- [ ] ClickUp parent + subtasks when tracking is required

---

## Phase 1 — API + migration + slim register

**Goal:** [04-company-detail-api.md](./04-company-detail-api.md), [05-registration-and-progressive-details.md](./05-registration-and-progressive-details.md)

| Task | Detail |
|------|--------|
| Migration | `latitude`, `longitude`, `map_place_id`, `map_formatted_address` |
| Schema | Partial `updateCompanyBodySchema`; relax `registerCompanyBodySchema` (name required) |
| Repository | `updateCompanyProfile` |
| Service / routes | `GET` / `PATCH /company/:id`; register accepts slim body |

**Exit criteria:** Slim register; owner partial PATCH; map fields round-trip; status untouched by PATCH.

---

## Phase 2 — Company profile page (three cards + map)

**Goal:** [02-company-profile-page.md](./02-company-profile-page.md)

| Task | Detail |
|------|--------|
| Routes | `/settings/companies/:companyId`, `/companies/:companyId` |
| Page | `CompanyProfilePage` — FeaturePage + three Cards |
| Cards | Company profile / Contact / Location (map + address) |
| Map | Google Maps picker/view; graceful fallback without API key |
| API client + store | get + partial update |

**Exit criteria:** Empty contact/location OK; per-card (or page) edit/save; StatusTag on profile card.

**Verify:** `npm run type-check -w webonone-v2-root`

---

## Phase 3 — List navigation + register wizard slim-down

**Goal:** [03-list-navigation.md](./03-list-navigation.md), [05](./05-registration-and-progressive-details.md)

| Task | Detail |
|------|--------|
| Lists | Row click + View details on MyCompaniesList / CompaniesList |
| Register UI | Minimal required fields; contact/location not blocking |

**Exit criteria:** Both lists open profile; register without contact/address works.

---

## Acceptance checklist

- [ ] Three cards: Company profile, Contact information, Location information
- [ ] Location card shows Google Map when key configured + address fields
- [ ] Slim register (name) → Pending company on All Companies
- [ ] Owner completes contact + location on profile later
- [ ] All Companies / SA Companies row → profile routes
- [ ] SA status actions + All Companies Login unchanged
- [ ] Partial PATCH; map columns persist
- [ ] Type-check green

---

## Open items

- ClickUp IDs
- Exact Google Maps JS vs Embed vs Places Autocomplete library choice at implement time
- Logo Media picker (deferred)
- Soft “profile incomplete” Callout (optional)
