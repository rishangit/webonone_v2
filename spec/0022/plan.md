# Plan — Feedback 0022

## Approach

Mirror feedback 0017’s native picker pattern (`CustomerPickerDialog`): replace the stacked search + outline Add row in mobile `LibraryPickerPanel` with `ListPageActions` → `SearchInput` → `ListAddButton`. No web or kit changes unless type-check reveals a gap.

## Implementation steps

1. **`mobile/.../LibraryPickerPanel.tsx`**
  - Import `ListPageActions` and `ListAddButton` from `@webonone/mobile-ui`.
  - Remove `Plus` from lucide imports and the outline `Button` for create-in-library.
  - Replace the `flex-row` search/button wrapper with:
  ```tsx
  <ListPageActions>
  <SearchInput … />
  {canCreateInLibrary(kind) ? (
  <ListAddButton disabled={createOpen} onPress={openCreate}>
  {t('library.addToLibrary', { noun: nounLower })}
  </ListAddButton>
  ) : null}
  </ListPageActions>
  ```
  - Keep existing create host, list selection, and reload behavior unchanged.
  - Keep `SearchInput` first child (required for `ListPageActions` overlay geometry).

2. **Consumers** — no API change; `CompanyCatalogFormDialog` / service wizard already render `LibraryPickerPanel`.

3. **Verify** — `npm run type-check -w @webonone/mobile` (+ mobile-ui if touched). Lint if workspace has a lint script for mobile.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Long Add label expands over the toolbar — same as other list screens; do not truncate or invent a shorter label.
- Do not reintroduce outline `Button` + `Plus` for this control.
- Help articles: not needed (layout parity only).
