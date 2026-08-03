---
name: details-page-cards
description: >-
  Builds profile / entity details pages with FeaturePage and Card sections in a
  full-width 3-column layout (left stack span-2, right stack span-1), equal
  gap-6, top-aligned columns, Back control, and one page-level Edit for all
  cards. Use when creating or editing details pages, profile pages, company
  profile, entity view/edit, or multi-section card layouts in any service
  frontend or UI Kit showcase.
---

# Details page cards

Standard workflow for **profile / company / simple multi-field** details pages with **inline** edit. Sections are **`Card`** surfaces in a **3-column** grid (left **2-col** stack, right **1-col** stack). **Back** and a single **Edit** live in `FeaturePage` `actions` — cards have no per-card edit chrome.

**Wizard-backed entities** (create is a multi-step dialog): use [details-page-wizard-edit](../details-page-wizard-edit/SKILL.md) instead (read-only cards + per-card Edit → shared wizard).

## When to apply

- New or updated profile / company / simple multi-field details route
- Replacing flat sections with page-level inline edit
- Showcase Pages → Details (`DetailsPageDemo`)

Collection lists that lead to this page must wire **row body click → detail route** per [item-list](../item-list/SKILL.md) (**Detail page navigation**).

## Do not use for

- Entities whose create flow is a multi-step wizard — [details-page-wizard-edit](../details-page-wizard-edit/SKILL.md)
- Paginated collection lists — use [item-list](../item-list/SKILL.md)
- Auth / embed chrome — [feature-page-layout.mdc](../../rules/feature-page-layout.mdc) exceptions

## Required primitives

| Export | Role |
|--------|------|
| `FeaturePage` | Page shell; owns Back + Edit / Cancel / Save |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` | Section surface (view + edit content only) |
| `Form`, `FormField` | One page `Form` wrapping the card grid in edit mode |
| `ImagePreview` | Logos / avatars — `src={null}` shows first-upload empty state ([image-preview.mdc](../../rules/image-preview.mdc)) |
| `ArrowLeft`, `Edit3` (lucide) | Back and Edit icons in `actions` |

`CardTitle` → `className="text-lg"`.

## Layout + chrome (mandatory)

```text
FeaturePage
  actions: Back (always) | view → Edit | edit → Cancel + Save
  Outer: grid items-start gap-6 lg:grid-cols-3
         (Form: also space-y-0)
    Left:  flex flex-col gap-6 lg:col-span-2
    Right: flex flex-col gap-6 lg:col-span-1
```

| Rule | Detail |
|------|--------|
| Back | Outline `size="sm"`; navigates to parent list (or showcase nested list tab) |
| Edit | **One** control — switches **all** cards to edit fields |
| Save | Validates all sections; one submit; returns to view |
| Cancel | Discards drafts for all cards; returns to view |
| Cards | No Edit/Save/Cancel in headers — presentational + fields only |
| Form | `space-y-0` required on multi-column edit grid |

## Steps

1. `FeaturePage` with Back + page-level Edit / Cancel / Save in `actions`.
2. Split sections: wide → left; compact → right.
3. Cards render view or fields from page `mode` / draft state — no local edit mode.
4. View: outer `<div className="grid …">`. Edit: same classes on `<Form id=… space-y-0>`.
5. Match `DetailsPageDemo`.

Wizard-backed details (Identity profile, company, services — Overview `ImageCarousel` when gallery images exist): [details-page-wizard-edit](../details-page-wizard-edit/SKILL.md).

## Forbidden (this pattern)

- Per-card Edit / Save / Cancel (wizard-backed details use [details-page-wizard-edit](../details-page-wizard-edit/SKILL.md))
- Flat section lists without `Card`
- `Form` default `space-y-4` on multi-column details
- Unequal horizontal vs vertical gaps

## Rule

Authoritative: [details-page-cards.mdc](../../rules/details-page-cards.mdc).

## Verification

```bash
npm run type-check
npm run lint
```

Back always present; one Edit edits every card; Save/Cancel only in the page header.
