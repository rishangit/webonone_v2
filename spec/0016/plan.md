# Plan — Feedback 0016

## Approach

Move the existing `CompanyLogoCard` from the Gallery tab onto Overview (owner + member), leave Gallery as gallery-only, mirror on mobile, and update Support + AI copy that still say logo lives under Gallery.

## Implementation steps

1. **`CompanyProfilePage.tsx` (owner/admin tabs)**
  - In `overviewContent` first row right column: stack `CompanyLogoCard` above `CompanyContactCard` (`flex flex-col gap-6`).
  - In Gallery tab: render only `CompanyGalleryCard` (remove `CompanyLogoCard`).

2. **`CompanyMemberProfileView.tsx`**
  - Same Overview layout: `CompanyLogoCard` above contact (`canEdit` / `saving` from existing flags).
  - Members keep view-only logo when they cannot edit.

3. **Mobile**
  - Extract or reuse a small logo card section in `CompanyOverviewTab` (ImagePreview + title; edit toast path if needed).
  - Remove logo `EditableSectionCard` from `CompanyGalleryPanel`; narrow `CompanyGallerySection` to `'gallery'` only (or drop logo branch in `handleGalleryEdit`).
  - Wire Overview edit for logo to the existing “Edit on web for now” toast if no native media picker.

4. **Copy**
  - `webonone-v2/backend/src/ai/capabilities.ts` — logo → Overview tab (not Gallery).
  - `support/.../en/companies/logo-and-gallery.md` and `si/` — steps: Overview for logo, Gallery for photos.

5. **Verify** — type-check/lint on webonone frontend; type-check mobile + support-root.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- No backend/API change — still `PATCH` `{ logoUrl }`.
- Do not put logo back into Gallery “for convenience”; feedback explicitly removes it.
- Keep `ImagePreview` empty state (`src={null}`) — no custom “No logo” tiles.
