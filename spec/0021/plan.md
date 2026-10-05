# Plan — Feedback 0021

## Approach

Mirror Identity profile: view logo inside `CompanyProfileCard`; edit logo only in company wizard step 1 via `ImagePreview` + platform Media dialog. Delete the standalone logo card and its immediate update/remove flow.

## Implementation steps

1. **`CompanyProfileCard` (web)**  
   - Accept `logoUrl` (from `detail.logoUrl`).  
   - Render `ImagePreview` `mode="view"` above the name/status block (ProfileView-style flex row).  
   - Keep existing Edit → `onEdit` (wizard step 1).

2. **`CompanyFormDialog` + schemas**  
   - Add `logoUrl: string | null` to `CompanyWizardFormValues` / empty + `valuesFromDetail`.  
   - `toUpdateBody` includes `logoUrl`.  
   - On step 1 (edit, when `id` present): open Media dialog (reuse scope helpers from old `CompanyLogoCard`) on ImagePreview edit; set form `logoUrl`.  
   - Create flow: no logo picker until company exists (no media scope).  
   - Pass logo props into `CompanyWizardStepProfile`; show logo status on summary optionally.

3. **`CompanyWizardStepProfile`**  
   - When `companyId` / edit: centered or leading `ImagePreview` `mode="edit"` + hint (like `ProfileAvatarEditor`).  
   - Create: omit logo editor.

4. **Overview consumers**  
   - `CompanyProfilePage` + `CompanyMemberProfileView`: remove `CompanyLogoCard`; pass logo via profile card only; right column starts with Contact.  
   - Delete `CompanyLogoCard.tsx`. Clean unused i18n keys that only served that card (or keep picker titles if reused in wizard).

5. **Mobile**  
   - Move `ImagePreview` into `CompanyProfileCard` above title.  
   - Remove `CompanyLogoCard` from `CompanyOverviewTab` and `logo` from `CompanyEditSection` / toast branch.

6. **Support + AI**  
   - Update `support/.../companies/logo-and-gallery.md` (en/si): edit company profile → Media on logo in wizard.  
   - Soften AI capability strings that say “logo card on Overview”.

7. **Verify** — type-check/lint on webonone-v2, mobile, support.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Media picker needs `companyId` — edit-only in wizard; create registration unchanged.  
- Help articles required (user-visible flow change).  
- Do not reintroduce Replace/Remove on the details page.
