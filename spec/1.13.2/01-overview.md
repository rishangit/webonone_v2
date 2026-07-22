# 01 — Overview (1.13.2)

## Vision

Company data lives in WebOnOne on two lists — **All Companies** (members / owners) and **Companies** (super admin). Users need a **Company profile** page: open a company from either list and manage details in **three separate cards** — **Company profile**, **Contact information**, and **Location information** (Google Map + address). First registration may collect only minimal identity; remaining contact and location details are completed on this page.

## User stories

1. As a company owner on **Settings → All Companies**, I click a company and land on its profile so I can view and edit company, contact, and location (including map) in separate cards — including fields I skipped at registration.
2. As a **super admin** on **Companies**, I click a company and open the same profile to inspect full (or incomplete) details. Status Approve / Reject / Set pending stays on the list menu.
3. As a new registrant, I can create a company with **basic identity only**, then finish contact and location later on the company profile page.

## Goals (1.13.2)

1. **Company profile page** — Dedicated route(s); UI Kit details pattern with **three cards**.
2. **List → profile** — Clicking a company on All Companies loads the profile.
3. **Super-admin → profile** — Clicking a company on `/companies` loads the same profile.
4. **Edit** — Company Owner (and super admin) can edit and save card fields; prefer per-card edit.
5. **Progressive details** — Slim registration; contact + location (+ map) completed on the profile page.
6. **Auth** — Detail/update APIs only for membership or super admin.
7. **Preserve list actions** — Login and SA status menus unchanged; row click opens profile.

## Scope (1.13.2)

### In scope

- WebOnOne frontend: `CompanyProfilePage`, three cards, Google Map on location card, routing, list navigation
- WebOnOne backend: `GET` / `PATCH` company by id; map/geo columns; **relax register** required fields
- Frontend env: `VITE_GOOGLE_MAPS_API_KEY` (documented in `.env.example`)
- `StatusTag` on Company profile card; status not editable on profile
- Loading via `usePlatformLoading`

### Out of scope

- Media logo upload picker (optional / deferred)
- Inviting / managing company members
- Deleting or leaving a company
- Header account switcher
- New Identity roles or JWT claims
- Changing post-login Choose account dialog (1.13.1)
- Server-side Google Maps proxy (browser Maps JS / Places is enough for v1)

## Glossary

| Term | Definition |
|------|------------|
| **Company profile page** | Details route with three cards: profile, contact, location |
| **Company profile card** | Name, description, size, logo, status |
| **Contact information card** | Contact email and phone |
| **Location information card** | Google Map pin + address fields |
| **Slim registration** | Create company with minimal required fields (name); rest on profile |
| **All Companies** | `/settings/companies` |
| **Companies (SA)** | `/companies` |
| **Company Owner** | `company_admin` for that company |

## Success criteria

1. All Companies row click → company profile for that id.
2. Profile shows three cards: Company profile, Contact information, Location information (map + address).
3. Owner can edit/save cards; Cancel restores; empty post-register contact/location is allowed.
4. User can register without contact/address; then complete those on the profile page.
5. Super-admin Companies row → same profile (view works for any company).
6. Unauthorized access → 403/404; lists’ Login / Approve-Reject unchanged.
7. `npm run type-check -w webonone-v2-root` passes.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — Spec No 1.13.2 | TBD | All docs |
| Subtask — Profile page UI (three cards + map) | TBD | [02](./02-company-profile-page.md) |
| Subtask — List navigation | TBD | [03](./03-list-navigation.md) |
| Subtask — Detail API + map fields | TBD | [04](./04-company-detail-api.md) |
| Subtask — Slim registration / progressive details | TBD | [05](./05-registration-and-progressive-details.md) |
