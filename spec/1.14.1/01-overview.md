# 01 — Overview (1.14.1)

## Vision

When operators create or edit a **number** attribute, choosing a **unit of measure** feels the same as choosing **tags** on catalog forms: a clear trigger field, a dedicated **selection dialog** with search and infinite scroll, a Check on the selected row, and optional **Add new unit** — working both standalone and when Data is embedded in WebOnOne.

## User stories

1. As a **catalog operator**, on **Create attribute** / **Edit attribute**, when Value type is **Number**, I open a **Unit** picker dialog (not a cramped dropdown) and pick one unit of measure.
2. As an operator with many units, I **search** and scroll the list until I find the right unit (`name` + `symbol`).
3. As an operator who needs a unit that does not exist yet, I use **Add new unit** from the picker; after create, that unit is **selected** and I return to the picker / form.
4. As an operator using Data **inside WebOnOne**, the unit picker and create dialogs use **host-owned** chrome (peer-dialog / nested), same labels and sizes as standalone — never a local `CustomDialog` clipped to `#main-content`.

## Goals (1.14.1)

1. **Common unit select dialog** — Reusable Data feature module mirroring `TagSelectField` / `TagPickerPanel` / `TagSelectEmbedPage` (single-select).
2. **Attribute form wiring** — Replace the inline unit `<Select>` with the unit select trigger + stacked / nested dialogs.
3. **Parity standalone ↔ embed** — Same title, description, sizes, footer labels; embed body has no Cancel/Done buttons.
4. **Selection UX** — `itemListRowActiveClassName` + Lucide `Check` on the selected row ([selection-dialog-list](../../.cursor/rules/selection-dialog-list.mdc)).
5. **No backend change** — Keep existing `unit_id` validation (`required` when `value_type === 'number'`).

## Scope (1.14.1)

### In scope

- Data FE: `UnitPickerPanel`, `UnitSelectField` (trigger + stacked dialogs + session helpers)
- Data FE: `/embed/dialogs/units/select` peer-dialog body (`UnitSelectEmbedPage`)
- Data FE: Nested create via existing `/embed/dialogs/units/create` (`UnitFormEmbedPage`)
- Data FE: `AttributeFormDialog` (+ embed page) uses unit select when `valueType === 'number'`
- Router registration for the new select embed route
- Docs / plan for branch `spec/1.14.1`

### Out of scope

- Changing attribute or unit REST APIs, migrations, or Zod BE schemas (already correct)
- Multi-select units on an attribute (always **one** `unitId`)
- Replacing generic `CatalogLibrarySelectEmbedPage` for other kinds (tags/products/…)
- Cross-service unit picker outside Data (no `DataUnitPickerFrame` in this release unless already required elsewhere — default: Data-internal only)
- New UI Kit `SelectUnit` component (optional follow-up; Data-local trigger matching SelectTag chrome is enough)
- Unit required for `valueType === 'text'` (remains cleared / null on submit)

## Glossary

| Term | Definition |
|------|------------|
| **Unit of measure (UOM)** | Row in `data_units` (`id`, `name`, `symbol`, …) referenced by `data_attributes.unit_id` |
| **Unit select dialog** | Common picker opened from a form field — same product pattern as tag select |
| **Tag select (reference)** | `TagSelectField.tsx`, `TagPickerPanel.tsx`, `TagSelectEmbedPage.tsx` |
| **Peer-dialog** | Host `CustomDialog` + peer `/embed/dialogs/…` body ([core-hosted-peer-dialog](../../.cursor/skills/core-hosted-peer-dialog/SKILL.md)) |
| **Nested request** | `peer-dialog-nested-request` so a picker (or create) opens as a sibling host dialog |

## Permission matrix (unchanged)

| Action | `member` | `company_admin` | `super_admin` |
|--------|----------|-----------------|---------------|
| Open attribute create/edit | existing catalog rules | yes | yes |
| Select existing unit in picker | yes (if can edit attribute) | yes | yes |
| Add new unit from picker | existing unit create rules | yes (per current Units POST) | yes |

## Success criteria

1. Attribute create/edit with Number shows a **Unit** trigger (not inline Select list).
2. Opening Unit opens the selection dialog; selecting a row shows border + **Check**; **Done** applies `unitId`.
3. Search and pagination load units via `listUnits` (not a one-shot pageSize 100 dump in the form).
4. **Add new unit** (when allowed) creates via existing unit form; new unit becomes the pending selection.
5. Standalone and WebOnOne embed behave with host chrome parity; embed select body has no footer buttons.
6. Submit still sends `unit_id` for number attributes; text clears `unit_id`.
7. `npm run type-check -w data-root` passes.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — Spec No 1.14.1 | TBD | All docs |
| Common unit select dialog | TBD | [02](./02-unit-select-dialog.md) |
| Attribute form unit field | TBD | [03](./03-attribute-form-unit-field.md) |
