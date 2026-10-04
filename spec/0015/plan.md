# Plan — Feedback 0015

## Approach

Fix the Media selector/library toolbar in `ScopedFolderBrowser` so mobile matches list-page actions: wrap controls in `ListPageActions` for compact `SearchInput`, size icon buttons to `h-9 w-9`, and update cursor rules that currently forbid compact search in pickers for this surface.

## Implementation steps

1. **`media/frontend/.../ScopedFolderBrowser.tsx` — `renderToolbar()`**
   - Import `ListPageActions`.
   - Wrap `SearchInput`, `ListFilterTrigger`, Upload, FolderPlus, List, LayoutGrid in `<ListPageActions>`.
   - Add `onClear={() => setFileNameQuery('')}` on `SearchInput`.
   - Keep `className="w-64"` on `SearchInput` (desktop width when expanded / `sm+`).
   - On each icon `Button` (`size="icon"`), add `className="h-9 w-9 shrink-0"` so they match `ListFilterTrigger`.

2. **Non-`showIconToolbar` search row**
   - Replace the ad-hoc `flex` search + filter cluster with the same `ListPageActions` + `SearchInput` (+ `onClear`) + `ListFilterTrigger` pattern for consistent mobile compact search.

3. **Rules**
   - `list-filter-panel.mdc`: exception — Media `ScopedFolderBrowser` toolbar uses list-page compact search via `ListPageActions` (ticket 0015).
   - `ui-kit-consumption.mdc`: Media selector/library toolbar may use compact header-style search; other dialog/picker bodies stay full field unless wrapped in `ListPageActions` intentionally.

4. **Verify** — type-check + lint `@webonone/media-frontend`. No Support help article.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- `ListPageActions` standalone mode needs horizontal space for the expand overlay; keep breadcrumb + toolbar `justify-between` / wrap as today.
- Do not change `size="icon"` globally in ui-kit — only override class on these Media toolbar buttons.
- Filtering logic stays local (`fileNameQuery` / MIME); no API change.
