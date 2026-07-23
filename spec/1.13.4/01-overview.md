# 01 — Overview (1.13.4)

## Vision

Company owners and super admins manage company identity and media in one place. The **Company profile** page keeps today’s profile, contact, and location cards under a **Profile** tab, and adds a **Gallery** tab for the company logo and a multi-image gallery — both backed by the Media service under clear per-company folder paths.

## User stories

1. As a company owner, on the company profile page I switch between **Profile** and **Gallery** without leaving the company route.
2. As a company owner, on **Profile** I still see and edit the same three cards (Company profile, Contact, Location) as in 1.13.2.
3. As a company owner, on **Gallery** I view and upload/replace the **company logo** via the Media picker.
4. As a company owner, on **Gallery** I add **multiple images** to the company gallery via Media, and see them on the card.
5. As the platform, company logo files live under Media path `companies/{company_id}/profile` and gallery files under `companies/{company_id}/gallery`.

## Goals (1.13.4)

1. **Tabs on company profile** — Profile | Gallery on existing member and super-admin company routes.
2. **Profile tab unchanged** — Preserve 1.13.2 three-card UX, validation, and PATCH behavior.
3. **Logo card** — Show current logo (or empty state); upload/replace via Media; persist `logoUrl` on the company.
4. **Gallery card** — Show multiple images; add/remove via Media; persist gallery image refs on the company.
5. **Media paths** — Fixed folder paths under company scope (see [05](./05-media-paths-and-integration.md)).
6. **Reuse platform Media host** — Prefer `PlatformMediaDialogHost` / existing `@webonone/media-embed` patterns; no new Media microservice APIs.
7. **Permissions** — View: members + super admin; edit logo/gallery: company owner (`company_admin`) + super admin (same as profile edit).

## Scope (1.13.4)

### In scope

- Tab shell on `CompanyProfilePage` (both `/settings/companies/:companyId` and `/companies/:companyId`)
- Profile tab = current three cards
- Gallery tab = Logo card + Gallery images card
- Media scope + folderPath helpers for company profile / gallery
- Persist logo URL (existing) and gallery image refs (new field or JSON column)
- Empty / loading / unauthorized states consistent with 1.13.2

### Out of scope

- Public company website / storefront gallery rendering
- Reordering gallery via drag-and-drop (optional later; simple add/remove is enough for v1)
- Changing Media service schema or blob storage layout beyond folderPath usage
- Moving logo upload into the Profile “Company profile” card (logo management lives on Gallery tab)
- Identity or UI Kit new primitives
- Changing company registration wizard (may still accept optional `logoUrl` as today)

## Glossary

| Term | Definition |
|------|------------|
| **Profile tab** | Tab containing the existing Company profile / Contact / Location cards |
| **Gallery tab** | Tab for logo + multi-image gallery management |
| **Logo card** | Gallery-tab card to show and upload a single company logo |
| **Gallery card** | Gallery-tab card to add and display multiple company images |
| **Company Media scope** | Media scope string `webonone:company:{companyId}` |
| **Profile folder path** | Media `folderPath` `/companies/{companyId}/profile` (logo / profile images) |
| **Gallery folder path** | Media `folderPath` `/companies/{companyId}/gallery` |
| **Gallery image ref** | Stored `{ mediaId, url }` (or URL string) on the company for display without listing Media on every paint |

## Success criteria

1. Company profile page shows **Profile** and **Gallery** tabs.
2. Profile tab matches pre-1.13.4 three-card behavior (view/edit/save).
3. Gallery → Logo: upload stores under profile path; company `logoUrl` updates; lists/cards that use `logoUrl` show the new logo.
4. Gallery → Gallery card: multiple images upload under gallery path; page shows them after save/refresh.
5. Members who are not owners can view Gallery but cannot upload/remove.
6. Wrong company id / unauthorized → same error pattern as 1.13.2.
7. `npm run type-check -w webonone-v2-root` passes.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — Spec No 1.13.4 | TBD | All docs |
| Subtask — Tabs shell | TBD | [02](./02-company-profile-tabs.md) |
| Subtask — Profile tab | TBD | [03](./03-profile-tab.md) |
| Subtask — Gallery tab | TBD | [04](./04-gallery-tab.md) |
| Subtask — Media paths | TBD | [05](./05-media-paths-and-integration.md) |
