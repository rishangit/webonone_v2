---
name: details-page-wizard-edit
description: >-
  Builds wizard-backed entity details pages: read-only section cards with
  per-card Edit opening a shared create/edit wizard at the mapped step. Use when
  creating or editing catalog-style detail pages, section Edit buttons, dual-use
  create/edit wizards, ServiceDetails-style flows, or Add dialogs that must also
  support detail-page edit.
---

# Details page wizard edit

Standard workflow when an entity’s **create** flow is a **multi-step wizard**. Details stay **view-only**; each section’s Edit opens the **same** wizard used by list Add/Edit, jumped to that section’s step.

**Also this skill:** Identity profile and company profile (per-card Edit → wizard). Showcase/simple **inline** page-level Edit → [details-page-cards](../details-page-cards/SKILL.md).

Self-edit-only wizards (no list Add) are allowed when there is no create list — pass `initialStep` from section cards.

Authoritative rule: [details-page-wizard-edit.mdc](../../rules/details-page-wizard-edit.mdc). Dialog chrome: [dialog-windows.mdc](../../rules/dialog-windows.mdc) + [core-hosted-peer-dialog](../core-hosted-peer-dialog/SKILL.md). Forms: [form-creation](../form-creation/SKILL.md). List CTA: [item-list](../item-list/SKILL.md).

## When to apply

- New or updated entity details route whose create dialog is already a wizard
- Adding section Edit on a details page that should reopen the create wizard
- Building list Add / Edit so one dialog supports create, edit, and detail card entry

## Do not use for

- Showcase/simple pages that keep page-level Edit → fields on cards — [details-page-cards](../details-page-cards/SKILL.md)
- Single-step form dialogs with no detail page
- Media picker/crop (`media-dialog-*`)

## Decide pattern first

| Entity create UX | Details edit | Skill |
|------------------|--------------|-------|
| Multi-step wizard (or self-edit wizard) | Per-card Edit → same wizard | **This skill** |
| Single form / inline fields | One page-level Edit | [details-page-cards](../details-page-cards/SKILL.md) |

## Props recipe

| Prop | Role |
|------|------|
| `open` | Controlled visibility |
| `id?` | Omit → create (`isNew = !id`); set → edit + load entity |
| `initialStep?` | Wizard step for detail card entry (default `1`) |
| `onOpenChange` | Close clears opener state |
| `onSaved` | List refresh and/or `fetchDetailRequested({ id, force: true })` |
| `chrome?` | `'dialog'` \| `'embed-page'` for peer-dialog body |

Titles / primary labels: create → `Create …` / `Create …`; edit → `Edit …` / `Save changes`.

Embed paths: `/embed/dialogs/<kind>/create` and `/embed/dialogs/<kind>/:id/edit`; append `?step=N` when `initialStep > 1`.

## Steps

1. **Confirm pattern** — create is a multi-step wizard → continue; else use details-page-cards.
2. **Build one dual-use `*FormDialog` first** — Zod schemas, one step component per step, progress bar, `isNew = !id`, empty seed vs `valuesFromDetail`, size `large` × `xlarge`. Follow form-creation + dialog-windows + core-hosted-peer-dialog.
3. **Wire the list** — Add: `setDialog({})` (no id). Edit (row menu): `setDialog({ id })`. Primary CTA per item-list.
4. **Add the details route** — `FeaturePage` + Back only; 3-col `gap-6` card grid (left span-2 / right span-1).
5. **Section cards** — copy Data `EditableSectionCard` shape exactly (`canEdit`, hover icon-only `Edit3`, `onEdit`). Map each editable section → `openWizard(step)`. Meta/audit → plain `Card`.
6. **Open wizard from detail** — `<FormDialog open id={entityId} initialStep={…} onSaved={refreshDetail} />`.
7. **Embed** — routes for create + `:id/edit`; body uses `chrome="embed-page"` and `?step=` via `parse…Step`; host Previous/Next via peer-dialog busy sync.

## EditableSectionCard Edit chrome (mandatory)

Match Data / company / Identity profile — **icon-only hover Edit**, not a labeled button:

| Do | Don't |
|----|-------|
| `Card className="group"` | Omit `group` (breaks hover reveal) |
| `variant="outline"` `size="icon"` | `size="sm"` + text “Edit” |
| Lucide `Edit3` only (`h-4 w-4`) | Icon + visible label |
| `opacity-0 … group-hover:opacity-100 focus-visible:opacity-100` | Always-visible labeled Edit |
| `aria-label={`Edit ${title}`}` | Missing accessible name |
| Gate with `canEdit && onEdit` | Different chrome per feature |

Canonical copy: `data/frontend/src/features/services/components/EditableSectionCard.tsx`. Also mirrored under companies, Identity profile, and system-theme — keep them identical.

## Section → step map (example)

Data services reference:

| Card | Step |
|------|------|
| Basics (name, status, description) | 1 |
| Time | 2 |
| Tags | 3 |
| Attributes | 4 |
| Summary (wizard only) | 5 |

Card Edit jumps into the wizard; save still walks the full flow (no section-only API).

## Forbidden

- Separate create-only and edit-only dialogs for the same entity
- Page-level Edit / Cancel / Save on this details pattern
- Section-only save endpoints
- `CustomDialog` inside the page iframe when `parentOrigin` is set
- Putting Previous / Next / Save in the embed body
- Labeled or always-visible “Edit” text buttons on section cards (must match hover icon chrome)

## Canonical reference

| Piece | Path |
|-------|------|
| Details page | `data/frontend/src/features/services/pages/ServiceDetailsPage.tsx` |
| Section card | `data/frontend/src/features/services/components/EditableSectionCard.tsx` |
| Wizard dialog | `data/frontend/src/features/services/components/ServiceFormDialog.tsx` |
| Steps / schemas | `data/frontend/src/features/services/components/service-wizard/`, `…/schemas/serviceSchemas.ts` |
| Embed body | `data/frontend/src/features/catalog/pages/CatalogFormEmbedPage.tsx` |
| Company details | `webonone-v2/.../companies/pages/CompanyProfilePage.tsx` |
| Company wizard | `webonone-v2/.../companies/components/CompanyFormDialog.tsx` |
| Theme details | `webonone-v2/.../system-theme/pages/ThemeDetailPage.tsx` |
| Theme wizard | `webonone-v2/.../system-theme/components/ThemeFormDialog.tsx` |
| Identity profile | `identity/.../profile/pages/ProfilePage.tsx` |
| Identity wizard | `identity/.../profile/components/ProfileFormDialog.tsx` |
| Identity embed | `identity/.../profile/pages/ProfileFormEmbedPage.tsx` |

`EditableSectionCard` is feature-local — copy the component shape; do not invent a different Edit chrome.

## Verification

```bash
npm run type-check
npm run lint
```

Manual: list Add opens wizard at step 1 with empty values; list Edit and each detail card Edit open the same dialog with entity loaded at the mapped step; section Edit is hover icon-only `Edit3` aligned with other detail pages; save refreshes the detail page; when embedded in WebOnOne, host owns Cancel / Previous / primary footer.
