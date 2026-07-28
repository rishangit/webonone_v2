# 02 — Common unit select dialog

ClickUp: TBD

## Problem

Operators need a **reusable** way to pick one unit of measure — searchable, scrollable, with clear selected-state UX — matching **tag selection**. The attribute form’s inline `<Select>` (and the generic catalog library select) do not meet that bar (no dedicated symbol row layout, no create-from-picker for attributes, limited list).

## Reference pattern (tags)

| Piece | Tags (canonical) | Units (this spec) |
|-------|------------------|-------------------|
| Panel | `TagPickerPanel` | **`UnitPickerPanel`** |
| Trigger + stacked dialogs + session | `TagSelectField.tsx` | **`UnitSelectField.tsx`** |
| Embed select body | `TagSelectEmbedPage` → `/embed/dialogs/tags/select` | **`UnitSelectEmbedPage`** → `/embed/dialogs/units/select` |
| Nested create | `/embed/dialogs/tags/create` | Existing `/embed/dialogs/units/create` |
| Selection mode | Multi (default) | **Single** (one unit) |
| Row content | Color + name | **Name** + **symbol** (subtitle or trailing) |
| Selected row | Active border + Check | Same ([selection-dialog-list](../../.cursor/rules/selection-dialog-list.mdc)) |

Do **not** open create chrome inside the select iframe — use stacked sibling (standalone) or `peer-dialog-nested-request` (embed). See [dialog-windows.mdc](../../.cursor/rules/dialog-windows.mdc) SelectTag stacked section and [core-hosted-peer-dialog](../../.cursor/skills/core-hosted-peer-dialog/SKILL.md) nested create.

## Flow

```text
Form field (Unit trigger)
  │
  ├─ Standalone
  │     → CustomDialog "Choose unit" (stackLevel ≥ 1)
  │           body: UnitPickerPanel
  │           footer: Cancel + Done
  │           optional → stacked "Create unit" (UnitFormDialog / iframe create)
  │
  └─ Hosted (parentOrigin)
        → peer-dialog-nested-request → /embed/dialogs/units/select
              body: UnitPickerPanel only
              host footer: Cancel + Done
              optional nested → /embed/dialogs/units/create
        → Done → peer-dialog-complete { unit }
```

## Dialog chrome

| Item | Value |
|------|--------|
| Title | **Choose unit** |
| Description | Optional short copy: “Select a unit of measure for this attribute.” |
| Size | Match tag picker: `sizeWidth="small"`, `sizeHeight="large"` (reuse same constants as `TAG_PICKER_DIALOG` unless product prefers medium — **default: same as tag picker**) |
| Footer | **Cancel** + primary **Done** (Done disabled until a unit is selected, **or** allow Done with prior selection only — preferred: require a selection when opening with empty; when editing, pre-select current unit so Done stays enabled) |
| Create nested | Title **Create unit** / submit **Create unit** — reuse `DATA_FORM_DIALOG_SIZE` / existing unit form labels |

## UnitPickerPanel behavior

| Behavior | Detail |
|----------|--------|
| Data | `dataApi.listUnits({ q, page, pageSize })` — debounce search (~300ms), page size ~20, infinite scroll sentinel |
| Mode | **Single-select** — clicking a row sets pending selection (replaces previous) |
| Selected UI | `itemListRowActiveClassName` + Lucide `Check` on the right |
| Row text | Primary: `name`; secondary: `symbol` (and optional description truncate) |
| Empty | `ItemListEmpty` when no matches |
| Create | Optional **Add new unit** button when `onCreateRequest` provided and role may create units (`company_admin` / `super_admin` per existing Units rules) |
| Loading / error | Spinner on first page; Alert on failure |

Payload type (picker value):

```ts
type UnitSelectValue = {
  id: string
  name: string
  symbol: string
}
```

Complete / Done returns one `UnitSelectValue` (or `null` only if product allows clear — **default for attribute: no clear in picker**; clear by switching attribute to Text).

## UnitSelectField module

Mirror exports from `TagSelectField.tsx`:

| Export | Purpose |
|--------|---------|
| `UnitSelectTrigger` | Read-only field chrome: placeholder **Choose unit** or `{name} ({symbol})`; `onClick` opens picker |
| `UnitSelectStackedDialogs` | Sibling stacked picker + create; `nestedDismissGuard` + post-close buffer |
| `UNIT_SELECT_EMBED_PATH` | `'/embed/dialogs/units/select'` |
| `UNIT_CREATE_EMBED_PATH` | `'/embed/dialogs/units/create'` (existing) |
| Session helpers | `writeUnitSelectSession` / `readUnitSelectSession` / `clearUnitSelectSession` keyed by `data:unit-select:{requestId}` |
| Dialog size constants | `UNIT_PICKER_DIALOG`, reuse unit create sizes |

**Trigger placement:** like tags — trigger inside the form body; **stacked dialogs rendered as siblings of the outer form `CustomDialog`**, never as children of the form body.

**Embed open:** from a hosted attribute form body, use `sendPlatformPeerDialogNestedRequest` with session write of the current unit (if any), same as catalog tag nested open — not a local `CustomDialog` inside the attribute embed iframe.

## UnitSelectEmbedPage

Path: **`/embed/dialogs/units/select`**

1. Resolve `parentOrigin` + `requestId` from query.
2. Hydrate pending selection from session.
3. Render `UnitPickerPanel` only (no footer).
4. `usePlatformPeerDialogSubmit` → on submit send `sendPlatformPeerDialogComplete({ unit })`.
5. Sync host busy/labels via `sendPlatformPeerDialogBusy` as needed.
6. **Add new unit** → nested request to create path; on nested result, set pending selection to created unit (map create payload to `UnitSelectValue`).

Register in `data/frontend/src/app/router.tsx` alongside other embed dialog routes.

## Relationship to CatalogLibrarySelect

| | `CatalogLibrarySelectEmbedPage` (`kind=units`) | This spec |
|--|-----------------------------------------------|-----------|
| Use | Generic library pick (name/description) | Attribute (and future) UOM pick |
| Symbol | Not shown | Required in row |
| Create nested | No | Yes |
| Attribute form | Not used | **Required** |

Do **not** point the attribute form at `/embed/dialogs/catalog/units/select`. Keep the generic route for other callers; dedicated unit select is the attribute path.

## Expected files

| Path | Change |
|------|--------|
| `data/frontend/src/features/units/components/UnitPickerPanel.tsx` | **New** |
| `data/frontend/src/features/units/components/UnitSelectField.tsx` | **New** |
| `data/frontend/src/features/units/pages/UnitSelectEmbedPage.tsx` | **New** |
| `data/frontend/src/app/router.tsx` | Register `/embed/dialogs/units/select` |
| Existing `UnitFormDialog` / `UnitFormEmbedPage` | Reuse for nested create; ensure create complete payload includes `id`, `name`, `symbol` for picker auto-select |

## Acceptance

1. Unit picker searchable; infinite scroll loads more pages.
2. Selected row shows primary border **and** Check on the right.
3. Standalone: stacked dialogs; create does not dismiss the picker ([dialog-windows](../../.cursor/rules/dialog-windows.mdc)).
4. Embed: host owns Cancel/Done; body has no footer; nested create works.
5. Pattern is reusable from any Data form (first consumer: Attributes in [03](./03-attribute-form-unit-field.md)).
