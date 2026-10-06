# Plan — Feedback 0017

## Approach

Reuse existing list-page primitives (`ListPageActions`, `ListAddButton`, compact `SearchInput`) inside selection dialog toolbars. One shared web change in `UserSelectionDialog` covers Add User and POS Select customer; mirror the same toolbar in Data/WebOnOne pickers and native mobile pickers.

## Implementation steps

1. **Web ui-kit — `UserSelectionDialog`**
  - Replace stacked `flex-col` + outline `Button` with `ListPageActions` wrapping `SearchInput` then `ListAddButton` (`children` = “Add user”) when `onAddUser` is set.
  - Keep optional role `Select` as a trailing sibling inside `ListPageActions`.
  - Remove unused `Plus` / outline `Button` imports if unused.
  - Precedent: Media `ScopedFolderBrowser` toolbar.

2. **Web Data pickers**
  - `TagPickerPanel`, `UnitPickerPanel`, `AttributePickerPanel`: wrap search + create in `ListPageActions`; swap outline Add for `ListAddButton` with existing labels.

3. **Web WebOnOne — `LibraryPickerPanel`**
  - Same toolbar pattern for search + “Add {entity} to library”.

4. **Native mobile-ui — `UserSelectionDialog`**
  - Add optional `onAddUser?: () => void` and `addLabel?: string` (default “Add user”).
  - Toolbar: `ListPageActions` → `SearchInput` → `ListAddButton` when `onAddUser` set.

5. **Native app**
  - `CustomerPickerDialog`: toolbar Add via `ListAddButton` / `onAddNew`; remove “New customer” from footer.
  - `AddCompanyUserDialog`: pass `onAddUser` into `UserSelectionDialog` to open register create; simplify outer shell so primary path is list picker with search+Add (keep create dialog stacked). Prefer opening the picker as the main Add User surface (or keep SelectUser trigger but ensure nested picker has Add).

6. **Support**
  - Update `company-users` (en + si) and POS-related help if present: on phone / mobile app, search and Add match the list toolbar (tap search / + to expand).

7. **Verify** — type-check/lint on touched workspaces listed in `spec.md`.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- `ListPageActions` expects `SearchInput` as first child for mobile overlay geometry (especially native) — keep that order.
- Role filter on web user picker must remain usable on narrow screens (may sit with trailing actions).
- Do not change peer-dialog paths or Done/Cancel footer contracts.
