# WebOnOne Platform — Specification (1.14.1)

Improve **Data → Attributes** create/edit so **unit of measure** is chosen through a **common selection dialog** — the same stacked / peer-dialog pattern as **tag selection** — instead of an inline `<Select>` dropdown capped at a small list.

**Spec No:** 1.14.1

Implementation branch: **`spec/1.14.1`**

## What changed from current platform

| Area | Before (current) | 1.14.1 |
|------|------------------|--------|
| Attribute form — Unit field | Inline `<Select>` over Redux units (`pageSize: 100`) when `valueType === 'number'` | **Unit select trigger** opens a **selection dialog** (search + scroll + Check) |
| Unit picker | None dedicated for attributes; generic `/embed/dialogs/catalog/units/select` exists but is unused by the form and lacks symbol / create | **`UnitPickerPanel` + `UnitSelectField`** (mirror tags) |
| Standalone | Local form dialog only | Stacked sibling **Choose unit** (+ optional **Create unit**) dialogs |
| Embedded in WebOnOne | Attribute form already peer-dialog; unit still inline Select | Nested peer-dialog **`/embed/dialogs/units/select`** (+ nested create) |
| Backend / `unit_id` | Already required for number attributes | **Unchanged** |

## Projects affected

| Project | Role in 1.14.1 |
|---------|----------------|
| **Data** (`data/frontend/`) | Primary — unit picker UI, embed route, wire Attribute form |
| **Data** (`data/backend/`) | No API/schema change |
| **UI Kit** | Optional reuse of trigger chrome; **no new required kit API** (Data-local trigger OK) |
| **WebOnOne / platform-embed** | No host change — existing peer-dialog + nested-request allowlist |
| **Identity / Media / Email / SMS** | No change |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-unit-select-dialog.md](./02-unit-select-dialog.md) | Common unit selection dialog (panel, stacked, embed) |
| [03-attribute-form-unit-field.md](./03-attribute-form-unit-field.md) | Wire unit picker into Attribute create/edit |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.14.1 Attribute unit-of-measure selection dialog | TBD | All docs |
| Subtask: Common unit select dialog (TagSelect parity) | TBD | [02](./02-unit-select-dialog.md) |
| Subtask: Attribute form uses unit select dialog | TBD | [03](./03-attribute-form-unit-field.md) |

## Revision history

- **2026-07-28** — Initial spec: replace attribute inline unit `<Select>` with tag-style unit selection dialog (standalone + peer-dialog embed).

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.11.0/05-admin-ui.md](../1.11.0/05-admin-ui.md) | Attribute editor fields including conditional unit |
| [../1.11.0/03-data-model.md](../1.11.0/03-data-model.md) | `data_attributes.unit_id` → `data_units` |
| [../1.12.3/README.md](../1.12.3/README.md) | Data catalog embed under WebOnOne |

## Rules / skills reference

| Topic | Rule / skill |
|-------|----------------|
| Data service | `.cursor/skills/data-agent/SKILL.md` |
| Core-hosted peer dialogs | `.cursor/skills/core-hosted-peer-dialog/SKILL.md` |
| Dialog windows / SelectTag stacked pattern | `.cursor/rules/dialog-windows.mdc` |
| Selection list Check | `.cursor/rules/selection-dialog-list.mdc` |
| Item lists | `.cursor/skills/item-list/SKILL.md` |
| Forms / Zod | `.cursor/skills/form-creation/SKILL.md` |
| Platform shell | `.cursor/rules/platform-shell-navigation.mdc` |
| Microservice boundaries | `.cursor/rules/microservice-architecture.mdc` |

## Local dev

```bash
npm run dev:data       # Data FE + BE (Attributes + Units)
npm run dev:webonone   # Host for peer-dialog when testing embed
```

Manual test: Data → Attributes → **Create attribute** → Value type **Number** → open **Unit** picker → search / select → Done → create succeeds with `unit_id`. Repeat inside WebOnOne Data iframe (host chrome, nested select).
