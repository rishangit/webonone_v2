# 05 — Admin UI (1.11.0)

Data admin SPA pages using `@webonone/ui-kit` patterns from Email and WebOnOne ([feature-page-layout](../1.8.0/02-feature-page-layout.md), [item-list skill](../../.cursor/skills/item-list/SKILL.md), [pagination](../1.9.2/04-service-pagination-rollout.md), [filter panel](../1.10.1/02-ui-kit-list-filter-panel.md)).

## Router

Lazy-load feature pages per `frontend-vite-chunk-splitting.mdc`:

| Path | Page | Lazy |
|------|------|------|
| `/` | `DashboardPage` | yes |
| `/tags` | `TagsPage` | yes |
| `/tags/new` | `TagEditorPage` | yes |
| `/tags/:id` | `TagEditorPage` | yes |
| `/units` | `UnitsPage` | yes |
| `/units/new`, `/units/:id` | `UnitEditorPage` | yes |
| `/attributes` | `AttributesPage` | yes |
| `/attributes/new`, `/attributes/:id` | `AttributeEditorPage` | yes |
| `/products` | `ProductsPage` | yes |
| `/products/new`, `/products/:id` | `ProductEditorPage` | yes |
| `/services` | `ServicesPage` | yes |
| `/services/new`, `/services/:id` | `ServiceEditorPage` | yes |
| `/spaces` | `SpacesPage` | yes |
| `/spaces/new`, `/spaces/:id` | `SpaceEditorPage` | yes |
| `/login`, `/callback` | eager | no |

## List page pattern (all six entities)

Each collection page uses:

```text
FeaturePage
  actions: [Create (optional), ListSearchField, ListFilterTrigger] — flex row, justify-end
  ListFilterPanel (status + entity filters)
  ListPageBody
    flex-1 wrapper → ItemList rows (glass-card, 3-dot menu: Edit, Delete)
    Pagination (mt-auto, server total from API)
```

See [08-list-page-layout-refinements.md](./08-list-page-layout-refinements.md) for pagination bottom-pin and header alignment requirements.

### Row display

| Entity | Primary | Secondary | Badge |
|--------|---------|-----------|-------|
| Tag | name | description truncate | color swatch + status |
| Unit | name (`symbol`) | base unit name if any | status |
| Attribute | name | value_type + unit symbol | status |
| Product/Service/Space | name | tag chips (max 3) | status |

### Row actions

- **Edit** → editor route
- **Delete** → `ConfirmDialog`; call DELETE API; toast on success

## Editor page pattern

`FeaturePage` with form sections:

| Entity | Fields |
|--------|--------|
| Tag | name*, description, color* (color input or preset swatches), status |
| Unit | name*, symbol*, is_base toggle, base_unit_id select (when not base) |
| Attribute | name*, description, value_type*, unit select (conditional), status |
| Product/Service/Space | name*, description, status, Tags multi-select, Attributes repeater (pick attribute + value) |

Use [form-creation skill](../../.cursor/skills/form-creation/SKILL.md): matching Zod on FE + BE, required asterisks, inline errors.

### Attributes repeater

- Add row: select from `GET /attributes` (verified + pending)
- Value input switches on selected attribute's `value_type`
- Remove row button per line

### Tags multi-select

- Searchable multi-select from `GET /tags` (paginated fetch or typeahead endpoint)

## Dashboard

Simple cards: count per entity type grouped by `verified` / `pending`. Links to each list.

## API client

`data/frontend/src/shared/services/dataApi.ts` — typed fetch wrapper with JWT from auth store; RTK Query optional (match Email if already used).

## Theme and accents

- Import `@webonone/theme` preset in `tailwind.config.js`
- `AppShell` uses system theme from localStorage / platform handoff
- Primary buttons and active nav use theme accent tokens

## Auth shell

Reuse Email patterns:

- `AppLayout.tsx` — platform handoff, profile link to Identity
- `AuthCallbackPage`, `LoginPage` redirect
- `PrivateRoute` wraps all `/` routes except login/callback

## Acceptance

- [ ] All six list pages: search, filter panel, pagination, ItemList styling
- [ ] All six editor flows: create + edit + validation errors
- [ ] Delete confirms and refreshes list
- [ ] Lazy routes + manualChunks in `vite.config.ts`
- [ ] `npm run type-check -w data-root` passes
