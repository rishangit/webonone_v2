# 07 — Implementation Plan

Phased delivery for **1.14.1** on branch **`spec/1.14.1`**.

---

## Branch workflow

```bash
git checkout master
git pull
git checkout -b spec/1.14.1
```

| Rule | Detail |
|------|--------|
| Base | Data catalog attributes + units CRUD; tag select peer-dialog pattern already on master |
| Spec branch | `spec/1.14.1` |
| Scope | **Data frontend only** (optional tiny payload tweak on unit create complete if symbol missing) |
| Backend | No change expected |
| WebOnOne | No change (host already supports nested peer-dialogs under `/embed/dialogs/`) |

---

## Phase 0 — Spec (this folder)

- [x] `spec/1.14.1/*` documentation
- [ ] Branch `spec/1.14.1`
- [ ] ClickUp parent + subtasks (IDs TBD)

---

## Phase 1 — Common unit select dialog

**Goal:** [02](./02-unit-select-dialog.md)

| Task | Detail |
|------|--------|
| `UnitPickerPanel` | Search, infinite scroll, single-select, Check + active row, optional Add new |
| `UnitSelectField` | Trigger, stacked dialogs, session helpers, embed path constants |
| `UnitSelectEmbedPage` | Peer body + nested create listener |
| Router | `/embed/dialogs/units/select` |
| Create complete payload | Ensure unit create complete includes `id`, `name`, `symbol` for auto-select |

**Exit criteria:** Can open unit select from a temporary/dev hook or Story-less manual route; Done returns unit; embed nested create works.

**Verify:** `npm run type-check -w data-root`

**Skills / rules:** core-hosted-peer-dialog, dialog-windows, selection-dialog-list, item-list

---

## Phase 2 — Attribute form wiring

**Goal:** [03](./03-attribute-form-unit-field.md)

| Task | Detail |
|------|--------|
| Replace inline Select | `UnitSelectTrigger` + stacked / nested open |
| Remove form bulk units load | Drop `loadListRequested({ pageSize: 100 })` if only used for Select |
| Edit hydrate | Resolve unit label for existing `unitId` |
| valueType text | Clear unit selection |

**Exit criteria:** Create/edit number attribute via picker; embed parity.

**Verify:** `npm run type-check -w data-root`

---

## Phase 3 — Manual QA + cleanup

| Check | Standalone Data | WebOnOne → Data iframe |
|-------|-----------------|------------------------|
| Create number + unit | ✓ | ✓ host nested select |
| Search / scroll units | ✓ | ✓ |
| Add new unit from picker | ✓ stacked | ✓ nested-from-nested |
| Validation without unit | ✓ | ✓ |
| Edit existing unit | ✓ | ✓ |
| Switch to text clears unit | ✓ | ✓ |

- [ ] Remove unused imports / empty leftovers ([code-cleanliness](../../.cursor/rules/code-cleanliness.mdc))
- [ ] Confirm no local `CustomDialog` for unit select when `parentOrigin` set

---

## Acceptance checklist (release)

- [ ] Unit select dialog matches tag-select product pattern (trigger + dialog + Check)
- [ ] Attribute create/edit uses that dialog for number value type
- [ ] Peer-dialog host chrome when embedded; no footer in embed body
- [ ] No backend migration required
- [ ] `npm run type-check -w data-root` passes

---

## Forbidden

- Inline unit `<Select>` left as primary UX for attributes
- Local picker `CustomDialog` inside `#main-content` when hosted
- Footer Cancel/Done inside `/embed/dialogs/units/select` body
- Pointing attribute form at `/embed/dialogs/catalog/units/select` instead of dedicated unit select
- Shared DB or cross-service unit APIs outside Data
- Spec links from `.cursor/rules/` to this folder (rules stay self-contained)
