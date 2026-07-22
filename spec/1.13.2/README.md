# WebOnOne Platform — Specification (1.13.2)

Extends [1.13.0](../1.13.0/README.md) (All Companies list + super-admin Companies list) by adding a **Company profile** details page. The page uses the UI Kit **Details page** pattern inside `FeaturePage`, with details split into **three cards**: **Company profile**, **Contact information**, and **Location information** (Google Map + address). **First registration may be minimal**; remaining contact and location details are collected on the company profile page. Owners open the profile from **All Companies**; super admins open it from **Companies**.

**Spec No:** 1.13.2

Implementation branch: **`spec/1.13.2`**

## What changed from 1.13.0 / 1.13.1

| Area | Before | 1.13.2 |
|------|--------|--------|
| Company detail UX | List rows only | **Company profile** with three cards |
| Profile layout | N/A | Company profile / Contact / Location (+ Google Map) |
| Registration | Full wizard required contact + address | **Slim register** (name required); rest on profile |
| All Companies row click | No navigation | → company profile |
| Super-admin Companies | Status actions only | Row also opens company profile |
| Company GET/PATCH | No full detail update API | `GET` + partial `PATCH` by id + map fields |

## Projects affected

| Project | Role in 1.13.2 |
|---------|----------------|
| **WebOnOne v2** (`webonone-v2/`) | Profile page (3 cards + map), list navigation, slim register, store/API |
| **WebOnOne backend** | Detail + patch APIs; map columns; relax register validation |
| **UI Kit** | Reuse `FeaturePage`, `Card`, form fields, `StatusTag` — no new primitive required |
| **Identity** | No schema change |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-company-profile-page.md](./02-company-profile-page.md) | Three cards, map, view/edit |
| [03-list-navigation.md](./03-list-navigation.md) | All Companies + SA Companies → profile |
| [04-company-detail-api.md](./04-company-detail-api.md) | GET/PATCH, map fields, slim register |
| [05-registration-and-progressive-details.md](./05-registration-and-progressive-details.md) | Minimal register vs profile completion |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.13.2 Company profile details page | TBD | All docs |
| Subtask: Company profile three cards + Google Map | TBD | [02](./02-company-profile-page.md) |
| Subtask: List row navigation | TBD | [03](./03-list-navigation.md) |
| Subtask: Company detail GET/PATCH + map columns | TBD | [04](./04-company-detail-api.md) |
| Subtask: Slim registration / progressive details | TBD | [05](./05-registration-and-progressive-details.md) |

## Revision history

- **2026-07-22** — Initial spec: company profile details page; list navigation; GET/PATCH company by id.
- **2026-07-22** — Update: three cards (Company profile, Contact, Location + Google Map); slim registration; remaining details on profile page.

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.13.0/03-my-companies-list-ui.md](../1.13.0/03-my-companies-list-ui.md) | All Companies list |
| [../1.13.0/04-multi-company-api.md](../1.13.0/04-multi-company-api.md) | My-companies API + status |
| [../1.6.0/02-company-service.md](../1.6.0/02-company-service.md) | Company table (extended by map columns here) |
| [../1.6.0/03-webonone-company-ui.md](../1.6.0/03-webonone-company-ui.md) | Register wizard (slimmed by [05](./05-registration-and-progressive-details.md)) |
| [../1.6.0/04-super-admin-approval.md](../1.6.0/04-super-admin-approval.md) | SA `/companies` list |

## Rules / skills reference

| Topic | Rule / skill |
|-------|----------------|
| Feature page layout | `.cursor/rules/feature-page-layout.mdc` |
| Forms | `.cursor/skills/form-creation/SKILL.md` |
| Item lists | `.cursor/skills/item-list/SKILL.md` |
| Loading | `.cursor/rules/loading-empty-states.mdc` |
| WebOnOne scope | `.cursor/rules/webonone-v2-project.mdc` |
| UI Kit Details / Card | `DetailsPageDemo`; `Card` exports from `@webonone/ui-kit` |

## Local dev

```bash
npm run dev:ui-kit     # Showcase — Pages → Details page; Components → Card
npm run dev:webonone   # WebOnOne FE + BE
npm run dev:identity   # JWT + company roles
```

Set `VITE_GOOGLE_MAPS_API_KEY` in `webonone-v2/frontend/.env` for the location map (page still works without it — address-only fallback).

Manual test: Register with name only → All Companies → open profile → three cards → fill Contact + Location (map) → Save. SA Companies → open same profile. Status actions remain on SA list menu.
