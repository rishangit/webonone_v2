# 03 — Attribute form unit field

ClickUp: TBD

## Problem

`AttributeFormDialog` already stores `unitId` and requires it when `valueType === 'number'`, but the UI is an **inline `<Select>`** fed by `unitsActions.loadListRequested({ pageSize: 100 })`. That breaks down with large unit libraries and does not match the **tag selection** product pattern used elsewhere in Data.

## Target UX

```text
Create / Edit attribute
  name, description, value type, [status]
  when valueType === 'number':
    FormField "Unit" * → UnitSelectTrigger
      → open unit select dialog ([02](./02-unit-select-dialog.md))
      → onDone → set values.unitId (+ keep display name/symbol in local state)
  submit → unit_id: number ? unitId : null
```

When `valueType` switches from **number** → **text**, clear `unitId` (and display selection) so Zod/submit stay consistent with backend.

## Form field rules

| Rule | Detail |
|------|--------|
| Visibility | Show Unit field **only** when `valueType === 'number'` |
| Required | Asterisk + Zod `unitId` required for number (existing `attributeFormSchema`) |
| Trigger | `UnitSelectTrigger` — placeholder **Choose unit**; selected shows `{name} ({symbol})` |
| Error | Inline `FormField` error from Zod when submit without unit |
| Load units list in form | **Remove** the form-level `loadListRequested({ pageSize: 100 })` used only for the Select options — picker loads via API |

## Display state

Keep `values.unitId` as the form source of truth. Additionally hold a small `selectedUnit: UnitSelectValue | null` for the trigger label:

- On edit load from `editor.detail`: if `unitId` present, set selected unit from detail if API returns unit name/symbol, **or** fetch/list once to resolve label, **or** extend attribute detail DTO with optional `unit: { id, name, symbol }` if already available.
- Prefer: if attribute API already exposes enough to show the label, use it; otherwise resolve via `getUnit(id)` or include unit summary on attribute read in a **minimal** FE-only fetch when opening edit — **avoid** a backend contract change unless detail currently has only `unitId` (then one `GET /units/:id` on edit hydrate is acceptable).

Confirm current attribute DTO: response has `unitId` only → **hydrate label** with `dataApi.getUnit(unitId)` (or list filter) when editing a number attribute. Do not block create flow.

## Standalone wiring

In `AttributeFormDialog` (`chrome === 'dialog'`):

1. Replace Unit `<Select>` block with `UnitSelectTrigger` + local `unitPickerOpen` state.
2. Render `UnitSelectStackedDialogs` **next to** the attribute `CustomDialog` (sibling), `pickerStackLevel={1}`.
3. `onDone(unit)` → set `unitId` + `selectedUnit`; close picker.

## Embed wiring

When attribute form is hosted (`useRequestPlatformPeerDialog` / `chrome === 'embed-page'`):

1. Trigger still in body.
2. On open: `writeUnitSelectSession` + `sendPlatformPeerDialogNestedRequest` → `UNIT_SELECT_EMBED_PATH` (same pattern as `CatalogFormDialog` / `ServiceFormDialog` tag open).
3. Listen for nested result → apply `unit` payload; clear session.

Do **not** render stacked `CustomDialog` for the picker inside the attribute embed iframe when `parentOrigin` is set.

## Validation (unchanged contract)

Frontend `attributeFormSchema` and backend attributes schema already:

- `unit_id` required when `value_type === 'number'`
- `unit_id` null/omitted when text

No migration. Submit payload remains:

```ts
unit_id: parsed.data.valueType === 'number' ? parsed.data.unitId || null : null
```

## Expected files

| Path | Change |
|------|--------|
| `data/frontend/src/features/attributes/components/AttributeFormDialog.tsx` | Unit select trigger + open/apply; remove inline Select + bulk units load |
| `data/frontend/src/features/attributes/pages/AttributeFormEmbedPage.tsx` | No change if it only hosts `AttributeFormDialog` with `chrome="embed-page"` — behavior lives in dialog |
| `data/frontend/src/features/attributes/schemas/attributeSchemas.ts` | Keep; ensure messages match “Unit is required” |
| Unit select module | From [02](./02-unit-select-dialog.md) |

## Acceptance

1. Create number attribute without unit → validation error on Unit field.
2. Open picker → select unit → Done → trigger shows name (symbol) → Create succeeds with correct `unit_id`.
3. Edit number attribute → trigger shows existing unit; change unit → Save updates `unit_id`.
4. Switch to Text → Unit field hidden; submit sends `unit_id: null`.
5. Embed in WebOnOne: nested Choose unit covers shell; Done applies without local iframe modal.
6. `npm run type-check -w data-root` passes.
